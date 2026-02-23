import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LoanRepaymentsService } from './repayments.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('finance/loans/:loanId/repayments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoanRepaymentsController {
    constructor(private readonly repaymentsService: LoanRepaymentsService) { }

    @Post()
    @Roles('super_admin', 'treasurer')
    async repay(
        @Param('loanId') loanId: string,
        @Body('amount') amount: number,
        @Req() req: any
    ) {
        return this.repaymentsService.repay(loanId, amount, req.user.userId);
    }

    @Get()
    async findByLoan(@Param('loanId') loanId: string) {
        return this.repaymentsService.findByLoan(loanId);
    }
}
