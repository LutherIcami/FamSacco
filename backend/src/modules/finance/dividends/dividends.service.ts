import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';

@Injectable()
export class DividendsService {
    constructor(
        private prisma: PrismaService,
        private ledgerService: LedgerService
    ) { }

    async getPotentialDividends() {
        const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');

        const incomeStats = await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: incomeAccount.id }
        });

        // Income balance = Credits - Debits (for a Revenue account)
        const balance = Number(incomeStats._sum.credit || 0) - Number(incomeStats._sum.debit || 0);

        // Fetch all savings accounts
        const savingsAccounts = await this.prisma.account.findMany({
            where: { accountType: 'MEMBER_SAVINGS', NOT: { userId: null } },
            include: { user: true }
        });

        const accountBalances = await Promise.all(savingsAccounts.map(async (acc) => {
            const stats = await this.prisma.transaction.aggregate({
                _sum: { debit: true, credit: true },
                where: { accountId: acc.id }
            });
            return {
                accountId: acc.id,
                userId: acc.userId,
                name: `${acc.user?.firstName} ${acc.user?.lastName}`,
                balance: Number(stats._sum.credit || 0) - Number(stats._sum.debit || 0)
            };
        }));

        const totalSavings = accountBalances.reduce((sum, acc) => sum + acc.balance, 0);

        return {
            totalIncome: balance,
            totalSavings,
            memberBreakdown: accountBalances.map(acc => ({
                ...acc,
                share: totalSavings > 0 ? (acc.balance / totalSavings) : 0,
                projectedDividend: totalSavings > 0 ? (acc.balance / totalSavings) * balance : 0
            }))
        };
    }

    async distributeDividends(adminId: string) {
        const potential = await this.getPotentialDividends();
        if (potential.totalIncome <= 0) throw new BadRequestException('No income available to distribute');

        const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');

        return this.prisma.$transaction(async (tx) => {
            const entryDescription = `Dividend distribution for income: KES ${potential.totalIncome.toLocaleString()}`;

            const transactions = [
                // Debit INCOME (reduce income to 0 or reduce it by distributed amount)
                { accountId: incomeAccount.id, debit: potential.totalIncome, credit: 0 }
            ];

            // Credit each member
            for (const member of potential.memberBreakdown) {
                if (member.projectedDividend > 0) {
                    transactions.push({
                        accountId: member.accountId,
                        debit: 0,
                        credit: Number(member.projectedDividend.toFixed(2))
                    });
                }
            }

            // Create Journal Entry
            const result = await this.ledgerService.createJournalEntry({
                referenceType: 'dividend',
                referenceId: `DIV-${Date.now()}`,
                description: entryDescription,
                createdBy: adminId,
                transactions
            });

            return result;
        });
    }
}
