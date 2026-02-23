import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';

@Injectable()
export class LoansService {
    constructor(
        private prisma: PrismaService,
        private ledgerService: LedgerService
    ) { }

    async findAllPending() {
        return this.prisma.loan.findMany({
            where: { status: 'REQUESTED' },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED', adminId: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!loan) throw new BadRequestException('Loan not found');

        // Logic for disbursement
        if (status === 'DISBURSED' && loan.status !== 'DISBURSED') {
            const poolAccount = await this.ledgerService.getOrCreateSystemAccount('SACCO_POOL');
            const loanAccount = await this.ledgerService.getOrCreateSystemAccount('LOAN_RECEIVABLE');

            await this.ledgerService.createJournalEntry({
                referenceType: 'loan',
                referenceId: loan.id,
                description: `Disbursement of loan to ${loan.user.firstName} ${loan.user.lastName}`,
                createdBy: adminId,
                transactions: [
                    { accountId: loanAccount.id, debit: Number(loan.principalAmount), credit: 0 },
                    { accountId: poolAccount.id, debit: 0, credit: Number(loan.principalAmount) }
                ]
            });
        }

        return this.prisma.loan.update({
            where: { id },
            data: {
                status,
                approvedBy: adminId
            },
        });
    }

    async applyForLoan(userId: string, data: { principalAmount: number; interestRate: number; totalPayable: number }) {
        const threshold = 100000;
        const status = data.principalAmount > threshold ? 'COMMITTEE_REVIEW' : 'REQUESTED';

        return this.prisma.loan.create({
            data: {
                userId,
                principalAmount: data.principalAmount,
                interestRate: data.interestRate,
                totalPayable: data.totalPayable,
                status: status,
            },
        });
    }
}
