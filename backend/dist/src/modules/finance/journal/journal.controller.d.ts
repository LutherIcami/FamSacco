import { JournalService } from './journal.service';
export declare class JournalController {
    private readonly journalService;
    constructor(journalService: JournalService);
    getGlobalStats(): Promise<{
        liquidity: number;
        portfolioAtRisk: number;
        totalIncome: number;
        awaitingDisbursement: number;
        awaitingGovernance: number;
        totalSavings: number;
    }>;
    getRecentTransactions(): Promise<({
        account: {
            user: {
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            userId: string | null;
            accountType: import("@prisma/client").$Enums.AccountType;
            currency: string;
            createdAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        debit: import("@prisma/client/runtime/library").Decimal;
        credit: import("@prisma/client/runtime/library").Decimal;
        accountId: string;
        journalEntryId: string;
    })[]>;
    getMyStats(req: any): Promise<{
        totalSavings: number;
        activeLoans: number;
        loanProgress: {
            principal: number;
            totalPayable: number;
            repaid: number;
            percent: number;
        } | null;
    }>;
    getCashflow(): Promise<{
        label: string;
        savings: number;
        loans: number;
        income: number;
    }[]>;
    getMemberRoster(): Promise<{
        userId: string | null;
        name: string;
        email: string | undefined;
        status: import("@prisma/client").$Enums.UserStatus | undefined;
        savings: number;
        activeLoan: {
            id: string;
            principal: number;
            totalPayable: number;
            status: string;
            repaid: number;
            progress: number;
        } | null;
    }[]>;
}
