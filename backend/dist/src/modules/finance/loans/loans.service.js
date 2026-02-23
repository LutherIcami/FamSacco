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
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
const ledger_service_1 = require("../journal/ledger.service");
const audit_service_1 = require("../audit/audit.service");
let LoansService = class LoansService {
    prisma;
    ledgerService;
    auditService;
    constructor(prisma, ledgerService, auditService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.auditService = auditService;
    }
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
    async updateStatus(id, status, adminId) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: { user: true }
        });
        if (!loan)
            throw new common_1.BadRequestException('Loan not found');
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
        const updatedLoan = await this.prisma.loan.update({
            where: { id },
            data: {
                status,
                approvedBy: adminId
            },
        });
        await this.auditService.log(adminId, `LOAN_${status}`, 'loan', id);
        return updatedLoan;
    }
    async applyForLoan(userId, data) {
        const threshold = 100000;
        const status = data.principalAmount > threshold ? 'COMMITTEE_REVIEW' : 'REQUESTED';
        const loan = await this.prisma.loan.create({
            data: {
                userId,
                principalAmount: data.principalAmount,
                interestRate: data.interestRate,
                totalPayable: data.totalPayable,
                status: status,
            },
        });
        await this.auditService.log(userId, 'LOAN_APPLIED', 'loan', loan.id);
        return loan;
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_service_1.AuditService])
], LoansService);
//# sourceMappingURL=loans.service.js.map