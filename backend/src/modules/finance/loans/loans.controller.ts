import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { LoansService } from './loans.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Get('pending')
    @Roles('super_admin', 'treasurer', 'committee')
    findAllPending() {
        return this.loansService.findAllPending();
    }

    @Patch(':id/status')
    @Roles('super_admin', 'treasurer')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: 'APPROVED' | 'REJECTED' | 'DISBURSED',
        @Req() req: any
    ) {
        return this.loansService.updateStatus(id, status, req.user.userId);
    }

    @Post('apply')
    apply(@Req() req: any, @Body() data: any) {
        return this.loansService.applyForLoan(req.user.userId, data);
    }
}
