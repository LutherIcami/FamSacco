import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';

@Injectable()
export class LoanRepaymentsService {
    constructor(
        private prisma: PrismaService,
        private ledgerService: LedgerService
    ) { }

    async repay(loanId: string, amount: number, adminId: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { user: true }
        });

        if (!loan) throw new BadRequestException('Loan not found');
        if (loan.status !== 'DISBURSED') throw new BadRequestException('Can only repay disbursed loans');

        return this.prisma.$transaction(async (tx) => {
            // Get total amount previously repaid for this loan
            const previousRepayments = await tx.loanRepayment.aggregate({
                _sum: { amount: true },
                where: { loanId }
            });
            const totalRepaidSoFar = Number(previousRepayments._sum.amount || 0);
            const principalAmount = Number(loan.principalAmount);

            let principalPortion = 0;
            let interestPortion = 0;

            if (totalRepaidSoFar < principalAmount) {
                const remainingPrincipal = principalAmount - totalRepaidSoFar;
                principalPortion = Math.min(amount, remainingPrincipal);
                interestPortion = amount - principalPortion;
            } else {
                interestPortion = amount;
            }

            // 1. Create Repayment record
            const repayment = await tx.loanRepayment.create({
                data: {
                    loanId,
                    amount: amount,
                    journalEntryId: 'temp-id'
                }
            });

            // 2. Double-Entry
            const poolAccount = await this.ledgerService.getOrCreateSystemAccount('SACCO_POOL');
            const loanAccount = await this.ledgerService.getOrCreateSystemAccount('LOAN_RECEIVABLE');
            const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');

            const transactions = [
                { accountId: poolAccount.id, debit: amount, credit: 0 }, // Cash in
            ];

            if (principalPortion > 0) {
                transactions.push({ accountId: loanAccount.id, debit: 0, credit: principalPortion });
            }

            if (interestPortion > 0) {
                transactions.push({ accountId: incomeAccount.id, debit: 0, credit: interestPortion });
            }

            const result = await this.ledgerService.createJournalEntry({
                referenceType: 'loan_repayment',
                referenceId: repayment.id,
                description: `Loan repayment from ${loan.user.firstName} ${loan.user.lastName} (P: ${principalPortion}, I: ${interestPortion})`,
                createdBy: adminId,
                transactions
            });

            // Update repayment with real journal entry id
            await tx.loanRepayment.update({
                where: { id: repayment.id },
                data: { journalEntryId: result.entry.id }
            });

            // If fully paid, close the loan
            if (totalRepaidSoFar + amount >= Number(loan.totalPayable)) {
                await tx.loan.update({
                    where: { id: loanId },
                    data: { status: 'CLOSED' }
                });
            }

            return repayment;
        });
    }

    async findByLoan(loanId: string) {
        return this.prisma.loanRepayment.findMany({
            where: { loanId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
