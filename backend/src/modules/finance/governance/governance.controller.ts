import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { GovernanceService } from './governance.service';

@Controller('finance/governance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GovernanceController {
    constructor(private governanceService: GovernanceService) { }

    @Get('review-queue')
    @Roles('committee', 'super_admin', 'treasurer')
    getReviewQueue() {
        return this.governanceService.getLoansForReview();
    }

    @Post('vote')
    @Roles('committee', 'super_admin')
    castVote(
        @Req() req: any,
        @Body() body: { loanId: string; vote: 'APPROVE' | 'REJECT'; comment?: string }
    ) {
        return this.governanceService.castVote(body.loanId, req.user.userId, body.vote, body.comment);
    }
}
