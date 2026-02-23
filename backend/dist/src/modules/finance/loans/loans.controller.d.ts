import { LoansService } from './loans.service';
export declare class LoansController {
    private readonly loansService;
    constructor(loansService: LoansService);
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
    updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'DISBURSED', req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        principalAmount: import("@prisma/client/runtime/library").Decimal;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        totalPayable: import("@prisma/client/runtime/library").Decimal;
        approvedBy: string | null;
    }>;
    apply(req: any, data: any): Promise<{
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
