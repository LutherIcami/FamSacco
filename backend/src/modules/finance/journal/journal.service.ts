import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class JournalService {
    constructor(private prisma: PrismaService) { }

    async getGlobalStats() {
        const poolAccount = await this.prisma.account.findFirst({
            where: { accountType: 'SACCO_POOL', userId: null }
        });

        const loanAccount = await this.prisma.account.findFirst({
            where: { accountType: 'LOAN_RECEIVABLE', userId: null }
        });

        const poolStats = poolAccount ? await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: poolAccount.id }
        }) : { _sum: { debit: 0, credit: 0 } };

        const loanStats = loanAccount ? await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: loanAccount.id }
        }) : { _sum: { debit: 0, credit: 0 } };

        const incomeAccount = await this.prisma.account.findFirst({
            where: { accountType: 'INCOME', userId: null }
        });

        const incomeStats = incomeAccount ? await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: incomeAccount.id }
        }) : { _sum: { debit: 0, credit: 0 } };

        const pendingLoans = await this.prisma.loan.count({
            where: { status: 'REQUESTED' }
        });

        return {
            totalSavings: Number(poolStats._sum.debit || 0) - Number(poolStats._sum.credit || 0),
            totalDisbursed: Number(loanStats._sum.debit || 0) - Number(loanStats._sum.credit || 0),
            totalIncome: Number(incomeStats._sum.credit || 0) - Number(incomeStats._sum.debit || 0),
            pendingLoans,
        };
    }

    async getRecentTransactions(limit = 10) {
        return this.prisma.transaction.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                account: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            }
        });
    }

    async getPersonalStats(userId: string) {
        const account = await this.prisma.account.findFirst({
            where: { userId, accountType: 'MEMBER_SAVINGS' }
        });

        const savingsStats = account ? await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: account.id }
        }) : { _sum: { debit: 0, credit: 0 } };

        const activeLoans = await this.prisma.loan.aggregate({
            _sum: { principalAmount: true },
            where: { userId, status: 'DISBURSED' }
        });

        return {
            // Member Savings = Credits (increases) - Debits (decreases) for a Liability account (from Sacco's perspective)
            // Or just think: how much did we credit them?
            totalSavings: Number(savingsStats._sum.credit || 0) - Number(savingsStats._sum.debit || 0),
            activeLoans: Number(activeLoans._sum.principalAmount || 0),
        };
    }
}
