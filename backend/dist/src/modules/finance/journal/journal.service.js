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
    async getPersonalStats(userId) {
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
            totalSavings: Number(savingsStats._sum.credit || 0) - Number(savingsStats._sum.debit || 0),
            activeLoans: Number(activeLoans._sum.principalAmount || 0),
        };
    }
};
exports.JournalService = JournalService;
exports.JournalService = JournalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JournalService);
//# sourceMappingURL=journal.service.js.map