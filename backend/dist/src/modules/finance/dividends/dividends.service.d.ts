import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
import { AuditService } from '../audit/audit.service';
export declare class DividendsService {
    private prisma;
    private ledgerService;
    private auditService;
    constructor(prisma: PrismaService, ledgerService: LedgerService, auditService: AuditService);
    getPotentialDividends(): Promise<{
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
    distributeDividends(adminId: string): Promise<{
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
