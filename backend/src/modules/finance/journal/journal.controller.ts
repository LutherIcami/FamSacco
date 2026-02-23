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
    @Roles('super_admin', 'treasurer', 'secretary')
    getGlobalStats() {
        return this.journalService.getGlobalStats();
    }

    @Get('transactions')
    @Roles('super_admin', 'treasurer', 'secretary')
    getRecentTransactions() {
        return this.journalService.getRecentTransactions(20);
    }

    @Get('my-stats')
    getMyStats(@Req() req: any) {
        return this.journalService.getPersonalStats(req.user.userId);
    }

    @Get('cashflow')
    @Roles('super_admin', 'treasurer')
    getCashflow() {
        return this.journalService.getMonthlyCashflow();
    }

    @Get('member-roster')
    @Roles('super_admin', 'treasurer', 'secretary')
    getMemberRoster() {
        return this.journalService.getMemberSavingsRoster();
    }
}
