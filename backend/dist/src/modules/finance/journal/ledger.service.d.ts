import { PrismaService } from '../../../prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export interface TransactionInput {
    accountId: string;
    debit: number;
    credit: number;
}
export declare class LedgerService {
    private prisma;
    constructor(prisma: PrismaService);
    createJournalEntry(data: {
        referenceType: string;
        referenceId: string;
        description: string;
        createdBy: string;
        transactions: TransactionInput[];
    }): Promise<{
        entry: {
            id: string;
            createdAt: Date;
            referenceType: string;
            referenceId: string;
            description: string | null;
            createdBy: string;
        };
        transactions: {
            id: string;
            createdAt: Date;
            debit: Decimal;
            credit: Decimal;
            journalEntryId: string;
            accountId: string;
        }[];
    }>;
    getOrCreateSystemAccount(type: 'SACCO_POOL' | 'INCOME' | 'EXPENSE' | 'LOAN_RECEIVABLE'): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        currency: string;
    }>;
    getOrCreateMemberAccount(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string | null;
        accountType: import("@prisma/client").$Enums.AccountType;
        currency: string;
    }>;
}
