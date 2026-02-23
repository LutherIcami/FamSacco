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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma.service");
let GovernanceService = class GovernanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLoansForReview() {
        return this.prisma.loan.findMany({
            where: { status: 'COMMITTEE_REVIEW' },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                },
                votes: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async castVote(loanId, userId, vote, comment) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { votes: true }
        });
        if (!loan)
            throw new common_1.BadRequestException('Loan not found');
        if (loan.status !== 'COMMITTEE_REVIEW')
            throw new common_1.BadRequestException('Loan is not under committee review');
        const existingVote = loan.votes.find(v => v.userId === userId);
        if (existingVote)
            throw new common_1.BadRequestException('You have already voted on this loan');
        await this.prisma.loanVote.create({
            data: {
                loanId,
                userId,
                vote,
                comment
            }
        });
        const updatedVotes = await this.prisma.loanVote.findMany({ where: { loanId } });
        const approvals = updatedVotes.filter(v => v.vote === 'APPROVE').length;
        const rejections = updatedVotes.filter(v => v.vote === 'REJECT').length;
        if (approvals >= 2) {
            await this.prisma.loan.update({
                where: { id: loanId },
                data: { status: 'REQUESTED' }
            });
        }
        else if (rejections >= 2) {
            await this.prisma.loan.update({
                where: { id: loanId },
                data: { status: 'REJECTED' }
            });
        }
        return { message: 'Vote submitted successfully' };
    }
};
exports.GovernanceService = GovernanceService;
exports.GovernanceService = GovernanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GovernanceService);
//# sourceMappingURL=governance.service.js.map