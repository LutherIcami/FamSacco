import { JournalService } from './journal.service';
export declare class JournalController {
    private readonly journalService;
    constructor(journalService: JournalService);
    getGlobalStats(): Promise<{
        totalSavings: number;
        totalDisbursed: number;
        totalIncome: number;
        pendingLoans: number;
    }>;
    getRecentTransactions(): Promise<({
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
    getMyStats(req: any): Promise<{
        totalSavings: number;
        activeLoans: number;
    }>;
}
