import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('finance/ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JournalController {
    constructor(private readonly journalService: JournalService) { }

    @Get('stats')
    @Roles('super_admin', 'treasurer')
    getGlobalStats() {
        return this.journalService.getGlobalStats();
    }

    @Get('transactions')
    @Roles('super_admin', 'treasurer')
    getRecentTransactions() {
        return this.journalService.getRecentTransactions();
    }

    @Get('my-stats')
    getMyStats(@Req() req: any) {
        return this.journalService.getPersonalStats(req.user.userId);
    }
}
