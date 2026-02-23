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
exports.DividendsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/jwt-auth.guard");
const roles_guard_1 = require("../../auth/roles.guard");
const roles_decorator_1 = require("../../auth/roles.decorator");
const dividends_service_1 = require("./dividends.service");
let DividendsController = class DividendsController {
    dividendsService;
    constructor(dividendsService) {
        this.dividendsService = dividendsService;
    }
    getPotential() {
        return this.dividendsService.getPotentialDividends();
    }
    distribute(req) {
        return this.dividendsService.distributeDividends(req.user.userId);
    }
};
exports.DividendsController = DividendsController;
__decorate([
    (0, common_1.Get)('potential'),
    (0, roles_decorator_1.Roles)('super_admin', 'treasurer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DividendsController.prototype, "getPotential", null);
__decorate([
    (0, common_1.Post)('distribute'),
    (0, roles_decorator_1.Roles)('super_admin', 'treasurer'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DividendsController.prototype, "distribute", null);
exports.DividendsController = DividendsController = __decorate([
    (0, common_1.Controller)('finance/dividends'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [dividends_service_1.DividendsService])
], DividendsController);
//# sourceMappingURL=dividends.controller.js.map