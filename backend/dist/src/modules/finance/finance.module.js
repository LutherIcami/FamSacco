"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const loans_service_1 = require("./loans/loans.service");
const loans_controller_1 = require("./loans/loans.controller");
const journal_service_1 = require("./journal/journal.service");
const journal_controller_1 = require("./journal/journal.controller");
const ledger_service_1 = require("./journal/ledger.service");
const contributions_service_1 = require("./contributions/contributions.service");
const contributions_controller_1 = require("./contributions/contributions.controller");
const repayments_service_1 = require("./loans/repayments.service");
const repayments_controller_1 = require("./loans/repayments.controller");
const dividends_service_1 = require("./dividends/dividends.service");
const dividends_controller_1 = require("./dividends/dividends.controller");
const governance_service_1 = require("./governance/governance.service");
const governance_controller_1 = require("./governance/governance.controller");
const audit_service_1 = require("./audit/audit.service");
const audit_controller_1 = require("./audit/audit.controller");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        providers: [
            loans_service_1.LoansService,
            journal_service_1.JournalService,
            ledger_service_1.LedgerService,
            contributions_service_1.ContributionsService,
            repayments_service_1.LoanRepaymentsService,
            dividends_service_1.DividendsService,
            governance_service_1.GovernanceService,
            audit_service_1.AuditService
        ],
        controllers: [
            loans_controller_1.LoansController,
            journal_controller_1.JournalController,
            contributions_controller_1.ContributionsController,
            repayments_controller_1.LoanRepaymentsController,
            dividends_controller_1.DividendsController,
            governance_controller_1.GovernanceController,
            audit_controller_1.AuditController
        ],
        exports: [ledger_service_1.LedgerService, dividends_service_1.DividendsService, audit_service_1.AuditService]
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map