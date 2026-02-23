import { PrismaService } from '../../../prisma.service';
export declare class GovernanceService {
    private prisma;
    constructor(prisma: PrismaService);
    getLoansForReview(): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
        votes: ({
            user: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            comment: string | null;
            loanId: string;
            vote: string;
        })[];
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
    castVote(loanId: string, userId: string, vote: 'APPROVE' | 'REJECT', comment?: string): Promise<{
        message: string;
    }>;
}
