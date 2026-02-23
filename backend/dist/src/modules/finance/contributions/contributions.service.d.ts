import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
import { AuditService } from '../audit/audit.service';
export declare class ContributionsService {
    private prisma;
    private ledgerService;
    private auditService;
    constructor(prisma: PrismaService, ledgerService: LedgerService, auditService: AuditService);
    deposit(userId: string, data: {
        amount: number;
        month: string;
    }, adminId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    }>;
    findAll(): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            passwordHash: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    })[]>;
    findByUser(userId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    }[]>;
}
