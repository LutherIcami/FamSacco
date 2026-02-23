import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
export declare class LoansService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
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
