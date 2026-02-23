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
exports.GovernanceController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const governance_service_1 = require("./governance.service");
let GovernanceController = class GovernanceController {
    governanceService;
    constructor(governanceService) {
        this.governanceService = governanceService;
    }
    getReviewQueue() {
        return this.governanceService.getLoansForReview();
    }
    castVote(req, body) {
        return this.governanceService.castVote(body.loanId, req.user.userId, body.vote, body.comment);
    }
};
exports.GovernanceController = GovernanceController;
__decorate([
    (0, common_1.Get)('review-queue'),
    (0, roles_decorator_1.Roles)('committee', 'super_admin', 'treasurer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "getReviewQueue", null);
__decorate([
    (0, common_1.Post)('vote'),
    (0, roles_decorator_1.Roles)('committee', 'super_admin'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "castVote", null);
exports.GovernanceController = GovernanceController = __decorate([
    (0, common_1.Controller)('finance/governance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [governance_service_1.GovernanceService])
], GovernanceController);
//# sourceMappingURL=governance.controller.js.map