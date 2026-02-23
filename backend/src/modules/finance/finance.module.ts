import { Module } from '@nestjs/common';
import { LoansService } from './loans/loans.service';
import { LoansController } from './loans/loans.controller';
import { JournalService } from './journal/journal.service';
import { JournalController } from './journal/journal.controller';
import { LedgerService } from './journal/ledger.service';
import { ContributionsService } from './contributions/contributions.service';
import { ContributionsController } from './contributions/contributions.controller';

import { LoanRepaymentsService } from './loans/repayments.service';
import { LoanRepaymentsController } from './loans/repayments.controller';
import { DividendsService } from './dividends/dividends.service';
import { DividendsController } from './dividends/dividends.controller';
import { GovernanceService } from './governance/governance.service';
import { GovernanceController } from './governance/governance.controller';
import { AuditService } from './audit/audit.service';
import { AuditController } from './audit/audit.controller';

@Module({
    providers: [
        LoansService,
        JournalService,
        LedgerService,
        ContributionsService,
        LoanRepaymentsService,
        DividendsService,
        GovernanceService,
        AuditService
    ],
    controllers: [
        LoansController,
        JournalController,
        ContributionsController,
        LoanRepaymentsController,
        DividendsController,
        GovernanceController,
        AuditController
    ],
    exports: [LedgerService, DividendsService, AuditService]
})
export class FinanceModule { }
