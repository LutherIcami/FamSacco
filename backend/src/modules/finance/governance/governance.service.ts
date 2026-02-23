import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class GovernanceService {
    constructor(private prisma: PrismaService) { }

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

    async castVote(loanId: string, userId: string, vote: 'APPROVE' | 'REJECT', comment?: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id: loanId },
            include: { votes: true }
        });

        if (!loan) throw new BadRequestException('Loan not found');
        if (loan.status !== 'COMMITTEE_REVIEW') throw new BadRequestException('Loan is not under committee review');

        // Check if user already voted
        const existingVote = loan.votes.find(v => v.userId === userId);
        if (existingVote) throw new BadRequestException('You have already voted on this loan');

        // Cast vote
        await this.prisma.loanVote.create({
            data: {
                loanId,
                userId,
                vote,
                comment
            }
        });

        // Check if we have enough votes (e.g., simple majority or all committee members)
        // For simplicity: if 2 people approve, set status to REQUESTED (so Treasurer can approve)
        const updatedVotes = await this.prisma.loanVote.findMany({ where: { loanId } });
        const approvals = updatedVotes.filter(v => v.vote === 'APPROVE').length;
        const rejections = updatedVotes.filter(v => v.vote === 'REJECT').length;

        if (approvals >= 2) {
            await this.prisma.loan.update({
                where: { id: loanId },
                data: { status: 'REQUESTED' }
            });
        } else if (rejections >= 2) {
            await this.prisma.loan.update({
                where: { id: loanId },
                data: { status: 'REJECTED' }
            });
        }

        return { message: 'Vote submitted successfully' };
    }
}
