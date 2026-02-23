"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
let JournalService = class JournalService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
        const awaitingDisbursement = await this.prisma.loan.count({
            where: { status: 'REQUESTED' }
        });
        const awaitingGovernance = await this.prisma.loan.count({
            where: { status: 'COMMITTEE_REVIEW' }
        });
        const totalOutstanding = await this.prisma.loan.aggregate({
            _sum: { principalAmount: true },
            where: { status: 'DISBURSED' }
        });
        return {
            liquidity: Number(poolStats._sum.debit || 0) - Number(poolStats._sum.credit || 0),
            portfolioAtRisk: Number(totalOutstanding._sum.principalAmount || 0),
            totalIncome: Number(incomeStats._sum.credit || 0) - Number(incomeStats._sum.debit || 0),
            awaitingDisbursement,
            awaitingGovernance,
            totalSavings: Number(poolStats._sum.debit || 0) - Number(poolStats._sum.credit || 0),
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
    async getPersonalStats(userId) {
        const account = await this.prisma.account.findFirst({
            where: { userId, accountType: 'MEMBER_SAVINGS' }
        });
        const savingsStats = account ? await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: account.id }
        }) : { _sum: { debit: 0, credit: 0 } };
        const activeLoan = await this.prisma.loan.findFirst({
            where: { userId, status: 'DISBURSED' },
            include: { repayments: true }
        });
        const repaidAmount = activeLoan
            ? activeLoan.repayments.reduce((sum, r) => sum + Number(r.amount), 0)
            : 0;
        return {
            totalSavings: Number(savingsStats._sum.credit || 0) - Number(savingsStats._sum.debit || 0),
            activeLoans: Number(activeLoan?.principalAmount || 0),
            loanProgress: activeLoan ? {
                principal: Number(activeLoan.principalAmount),
                totalPayable: Number(activeLoan.totalPayable),
                repaid: repaidAmount,
                percent: Math.min(100, (repaidAmount / Number(activeLoan.totalPayable)) * 100)
            } : null
        };
    }
    async getMonthlyCashflow() {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            months.push({
                label: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
                start, end
            });
        }
        const [poolAccount, loanAccount, incomeAccount] = await Promise.all([
            this.prisma.account.findFirst({ where: { accountType: 'SACCO_POOL', userId: null } }),
            this.prisma.account.findFirst({ where: { accountType: 'LOAN_RECEIVABLE', userId: null } }),
            this.prisma.account.findFirst({ where: { accountType: 'INCOME', userId: null } }),
        ]);
        return Promise.all(months.map(async (m) => {
            const [savings, loans, income] = await Promise.all([
                poolAccount ? this.prisma.transaction.aggregate({ _sum: { debit: true }, where: { accountId: poolAccount.id, createdAt: { gte: m.start, lte: m.end } } }) : null,
                loanAccount ? this.prisma.transaction.aggregate({ _sum: { debit: true }, where: { accountId: loanAccount.id, createdAt: { gte: m.start, lte: m.end } } }) : null,
                incomeAccount ? this.prisma.transaction.aggregate({ _sum: { credit: true }, where: { accountId: incomeAccount.id, createdAt: { gte: m.start, lte: m.end } } }) : null,
            ]);
            return {
                label: m.label,
                savings: Number(savings?._sum.debit || 0),
                loans: Number(loans?._sum.debit || 0),
                income: Number(income?._sum.credit || 0),
            };
        }));
    }
    async getMemberSavingsRoster() {
        const accounts = await this.prisma.account.findMany({
            where: { accountType: 'MEMBER_SAVINGS', NOT: { userId: null } },
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true, status: true } } }
        });
        return Promise.all(accounts.map(async (acc) => {
            const stats = await this.prisma.transaction.aggregate({
                _sum: { debit: true, credit: true },
                where: { accountId: acc.id }
            });
            const balance = Number(stats._sum.credit || 0) - Number(stats._sum.debit || 0);
            const loan = await this.prisma.loan.findFirst({
                where: { userId: acc.userId, status: { in: ['DISBURSED', 'REQUESTED', 'COMMITTEE_REVIEW'] } },
                orderBy: { createdAt: 'desc' },
                include: { repayments: { select: { amount: true } } }
            });
            const repaid = loan?.repayments.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
            return {
                userId: acc.userId,
                name: `${acc.user?.firstName} ${acc.user?.lastName}`,
                email: acc.user?.email,
                status: acc.user?.status,
                savings: balance,
                activeLoan: loan ? {
                    id: loan.id,
                    principal: Number(loan.principalAmount),
                    totalPayable: Number(loan.totalPayable),
                    status: loan.status,
                    repaid,
                    progress: Math.min(100, (repaid / Number(loan.totalPayable)) * 100)
                } : null
            };
        }));
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JournalService);
//# sourceMappingURL=journal.service.js.map