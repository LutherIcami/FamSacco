import { PrismaService } from '../../../prisma.service';
export declare class JournalService {
    private prisma;
    constructor(prisma: PrismaService);
    getGlobalStats(): Promise<{
        totalSavings: number;
        totalDisbursed: number;
        totalIncome: number;
        pendingLoans: number;
    }>;
    getRecentTransactions(limit?: number): Promise<({
        account: {
            user: {
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            userId: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
            currency: string;
        };
    } & {
        id: string;
        createdAt: Date;
        debit: import("@prisma/client/runtime/library").Decimal;
        credit: import("@prisma/client/runtime/library").Decimal;
        journalEntryId: string;
        accountId: string;
    })[]>;
    getPersonalStats(userId: string): Promise<{
        totalSavings: number;
        activeLoans: number;
    }>;
}
