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
exports.ContributionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
const ledger_service_1 = require("../journal/ledger.service");
const audit_service_1 = require("../audit/audit.service");
let ContributionsService = class ContributionsService {
    prisma;
    ledgerService;
    auditService;
    constructor(prisma, ledgerService, auditService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.auditService = auditService;
    }
    async deposit(userId, data, adminId) {
        if (data.amount <= 0)
            throw new common_1.BadRequestException('Amount must be positive');
        const contribution = await this.prisma.$transaction(async (tx) => {
            const contrib = await tx.contribution.create({
                data: {
                    userId,
                    amount: data.amount,
                    month: data.month,
                    status: 'CONFIRMED'
                }
            });
            const poolAccount = await this.ledgerService.getOrCreateSystemAccount('SACCO_POOL');
            const memberAccount = await this.ledgerService.getOrCreateMemberAccount(userId);
            await this.ledgerService.createJournalEntry({
                referenceType: 'contribution',
                referenceId: contrib.id,
                description: `Monthly contribution for ${data.month}`,
                createdBy: adminId,
                transactions: [
                    { accountId: poolAccount.id, debit: data.amount, credit: 0 },
                    { accountId: memberAccount.id, debit: 0, credit: data.amount }
                ]
            });
            return contrib;
        });
        await this.auditService.log(adminId, 'DEPOSIT_RECORDED', 'contribution', contribution.id);
        return contribution;
    }
    async findAll() {
        return this.prisma.contribution.findMany({
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async findByUser(userId) {
        return this.prisma.contribution.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.ContributionsService = ContributionsService;
exports.ContributionsService = ContributionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_service_1.AuditService])
], ContributionsService);
//# sourceMappingURL=contributions.service.js.map