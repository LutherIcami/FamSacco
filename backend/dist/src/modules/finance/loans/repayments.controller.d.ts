import { LoanRepaymentsService } from './repayments.service';
export declare class LoanRepaymentsController {
    private readonly repaymentsService;
    constructor(repaymentsService: LoanRepaymentsService);
    repay(loanId: string, amount: number, req: any): Promise<{
        id: string;
        createdAt: Date;
        journalEntryId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        loanId: string;
    }>;
    findByLoan(loanId: string): Promise<{
        id: string;
        createdAt: Date;
        journalEntryId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        loanId: string;
    }[]>;
}
