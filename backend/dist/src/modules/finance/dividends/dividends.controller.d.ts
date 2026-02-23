import { DividendsService } from './dividends.service';
export declare class DividendsController {
    private dividendsService;
    constructor(dividendsService: DividendsService);
    getPotential(): Promise<{
        totalIncome: number;
        totalSavings: number;
        memberBreakdown: {
            share: number;
            projectedDividend: number;
            accountId: string;
            userId: string | null;
            name: string;
            balance: number;
        }[];
    }>;
    distribute(req: any): Promise<{
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
            debit: import("@prisma/client/runtime/library").Decimal;
            credit: import("@prisma/client/runtime/library").Decimal;
            journalEntryId: string;
            accountId: string;
        }[];
    }>;
}
