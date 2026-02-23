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
exports.LoanRepaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
const ledger_service_1 = require("../journal/ledger.service");
const audit_service_1 = require("../audit/audit.service");
let LoanRepaymentsService = class LoanRepaymentsService {
    prisma;
    ledgerService;
    auditService;
    constructor(prisma, ledgerService, auditService) {
        this.prisma = prisma;
        this.ledgerService = ledgerService;
        this.auditService = auditService;
    }
    async repay(loanId, amount, adminId) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { user: true }
        });
        if (!loan)
            throw new common_1.BadRequestException('Loan not found');
        if (loan.status !== 'DISBURSED')
            throw new common_1.BadRequestException('Can only repay disbursed loans');
        const repayment = await this.prisma.$transaction(async (tx) => {
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
            }
            else {
                interestPortion = amount;
            }
            const rep = await tx.loanRepayment.create({
                data: {
                    loanId,
                    amount: amount,
                    journalEntryId: 'temp-id'
                }
            });
            const poolAccount = await this.ledgerService.getOrCreateSystemAccount('SACCO_POOL');
            const loanAccount = await this.ledgerService.getOrCreateSystemAccount('LOAN_RECEIVABLE');
            const incomeAccount = await this.ledgerService.getOrCreateSystemAccount('INCOME');
            const transactions = [
                { accountId: poolAccount.id, debit: amount, credit: 0 },
            ];
            if (principalPortion > 0) {
                transactions.push({ accountId: loanAccount.id, debit: 0, credit: principalPortion });
            }
            if (interestPortion > 0) {
                transactions.push({ accountId: incomeAccount.id, debit: 0, credit: interestPortion });
            }
            const result = await this.ledgerService.createJournalEntry({
                referenceType: 'loan_repayment',
                referenceId: rep.id,
                description: `Loan repayment from ${loan.user.firstName} ${loan.user.lastName} (P: ${principalPortion}, I: ${interestPortion})`,
                createdBy: adminId,
                transactions
            });
            await tx.loanRepayment.update({
                where: { id: rep.id },
                data: { journalEntryId: result.entry.id }
            });
            if (totalRepaidSoFar + amount >= Number(loan.totalPayable)) {
                await tx.loan.update({
                    where: { id: loanId },
                    data: { status: 'CLOSED' }
                });
            }
            return rep;
        });
        await this.auditService.log(adminId, 'LOAN_REPAYMENT', 'loan_repayment', repayment.id);
        return repayment;
    }
    async findByLoan(loanId) {
        return this.prisma.loanRepayment.findMany({
            where: { loanId },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.LoanRepaymentsService = LoanRepaymentsService;
exports.LoanRepaymentsService = LoanRepaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_service_1.LedgerService,
        audit_service_1.AuditService])
], LoanRepaymentsService);
//# sourceMappingURL=repayments.service.js.map