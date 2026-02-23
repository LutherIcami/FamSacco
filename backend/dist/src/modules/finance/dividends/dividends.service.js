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
exports.DividendsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
const ledger_service_1 = require("../journal/ledger.service");
const audit_service_1 = require("../audit/audit.service");
let DividendsService = class DividendsService {
    prisma;
    ledgerService;
    auditService;
    constructor(prisma, ledgerService, auditService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.auditService = auditService;
    }
    async getPotentialDividends() {
        const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');
        const incomeStats = await this.prisma.transaction.aggregate({
            _sum: { debit: true, credit: true },
            where: { accountId: incomeAccount.id }
        });
        const balance = Number(incomeStats._sum.credit || 0) - Number(incomeStats._sum.debit || 0);
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
    async distributeDividends(adminId) {
        const potential = await this.getPotentialDividends();
        if (potential.totalIncome <= 0)
            throw new common_1.BadRequestException('No income available to distribute');
        const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');
        const result = await this.prisma.$transaction(async (tx) => {
            const entryDescription = `Dividend distribution for income: KES ${potential.totalIncome.toLocaleString()}`;
            const transactions = [
                { accountId: incomeAccount.id, debit: potential.totalIncome, credit: 0 }
            ];
            for (const member of potential.memberBreakdown) {
                if (member.projectedDividend > 0) {
                    transactions.push({
                        accountId: member.accountId,
                        debit: 0,
                        credit: Number(member.projectedDividend.toFixed(2))
                    });
                }
            }
            return await this.ledgerService.createJournalEntry({
                referenceType: 'dividend',
                referenceId: `DIV-${Date.now()}`,
                description: entryDescription,
                createdBy: adminId,
                transactions
            });
        });
        await this.auditService.log(adminId, 'DIVIDEND_DISTRIBUTED', 'dividend', result.entry.id);
        return result;
    }
};
exports.DividendsService = DividendsService;
exports.DividendsService = DividendsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_service_1.AuditService])
], DividendsService);
//# sourceMappingURL=dividends.service.js.map