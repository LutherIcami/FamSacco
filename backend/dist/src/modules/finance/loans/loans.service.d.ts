import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
import { AuditService } from '../audit/audit.service';
export declare class LoansService {
    private prisma;
    private ledgerService;
    private auditService;
    constructor(prisma: PrismaService, ledgerService: LedgerService, auditService: AuditService);
    findAllPending(): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        principalAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        totalPayable: import("@prisma/client/runtime/library").Decimal;
        approvedBy: string | null;
    })[]>;
    updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED', adminId: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        principalAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        totalPayable: import("@prisma/client/runtime/library").Decimal;
        approvedBy: string | null;
    }>;
    applyForLoan(userId: string, data: {
        principalAmount: number;
        interestRate: number;
        totalPayable: number;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        principalAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        totalPayable: import("@prisma/client/runtime/library").Decimal;
        approvedBy: string | null;
    }>;
}
