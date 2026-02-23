import { PrismaService } from '../../../prisma.service';
import { LedgerService } from '../journal/ledger.service';
import { AuditService } from '../audit/audit.service';
export declare class LoanRepaymentsService {
    private prisma;
    private ledgerService;
    private auditService;
    constructor(prisma: PrismaService, ledgerService: LedgerService, auditService: AuditService);
    repay(loanId: string, amount: number, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        journalEntryId: string;
        loanId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findByLoan(loanId: string): Promise<{
        id: string;
        createdAt: Date;
        journalEntryId: string;
        loanId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}
