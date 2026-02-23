import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
export declare class LoanRepaymentsService {
    private prisma;
    private ledgerService;
    constructor(prisma: PrismaService, ledgerService: LedgerService);
    repay(loanId: string, amount: number, adminId: string): Promise<{
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
