import { GovernanceService } from './governance.service';
export declare class GovernanceController {
    private governanceService;
    constructor(governanceService: GovernanceService);
    getReviewQueue(): Promise<({
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
    castVote(req: any, body: {
        loanId: string;
        vote: 'APPROVE' | 'REJECT';
        comment?: string;
    }): Promise<{
        message: string;
    }>;
}
