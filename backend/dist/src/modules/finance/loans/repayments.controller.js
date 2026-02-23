"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanRepaymentsController = void 0;
const common_1 = require("@nestjs/common");
const repayments_service_1 = require("./repayments.service");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
let LoanRepaymentsController = class LoanRepaymentsController {
    repaymentsService;
    constructor(repaymentsService) {
        this.repaymentsService = repaymentsService;
    }
    async repay(loanId, amount, req) {
        return this.repaymentsService.repay(loanId, amount, req.user.userId);
    }
    async findByLoan(loanId) {
        return this.repaymentsService.findByLoan(loanId);
    }
};
exports.LoanRepaymentsController = LoanRepaymentsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('super_admin', 'treasurer'),
    __param(0, (0, common_1.Param)('loanId')),
    __param(1, (0, common_1.Body)('amount')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Object]),
    __metadata("design:returntype", Promise)
], LoanRepaymentsController.prototype, "repay", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('loanId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LoanRepaymentsController.prototype, "findByLoan", null);
exports.LoanRepaymentsController = LoanRepaymentsController = __decorate([
    (0, common_1.Controller)('finance/loans/:loanId/repayments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [repayments_service_1.LoanRepaymentsService])
], LoanRepaymentsController);
//# sourceMappingURL=repayments.controller.js.map