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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let LedgerService = class LedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createJournalEntry(data) {
        const totalDebit = data.transactions.reduce((sum, tx) => sum + tx.debit, 0);
        const totalCredit = data.transactions.reduce((sum, tx) => sum + tx.credit, 0);
        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new common_1.BadRequestException(`Journal entry is unbalanced. Debits (${totalDebit}) must equal Credits (${totalCredit}).`);
        }
        return this.prisma.$transaction(async (tx) => {
            const entry = await tx.journalEntry.create({
                data: {
                    referenceType: data.referenceType,
                    referenceId: data.referenceId,
                    description: data.description,
                    createdBy: data.createdBy,
                },
            });
            const transactions = await Promise.all(data.transactions.map((t) => tx.transaction.create({
                data: {
                    journalEntryId: entry.id,
                    accountId: t.accountId,
                    debit: new library_1.Decimal(t.debit),
                    credit: new library_1.Decimal(t.credit),
                },
            })));
            return { entry, transactions };
        });
    }
    async getOrCreateSystemAccount(type) {
        let account = await this.prisma.account.findFirst({
            where: { accountType: type, userId: null },
        });
        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    accountType: type,
                    userId: null,
                },
            });
        }
        return account;
    }
    async getOrCreateMemberAccount(userId) {
        let account = await this.prisma.account.findUnique({
            where: {}
        });
        account = await this.prisma.account.findFirst({
            where: { userId, accountType: 'MEMBER_SAVINGS' }
        });
        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    userId,
                    accountType: 'MEMBER_SAVINGS',
                },
            });
        }
        return account;
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map