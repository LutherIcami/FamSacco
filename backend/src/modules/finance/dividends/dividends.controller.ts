import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { DividendsService } from './dividends.service';

@Controller('finance/dividends')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DividendsController {
    constructor(private dividendsService: DividendsService) { }

    @Get('potential')
    @Roles('super_admin', 'treasurer')
    getPotential() {
        return this.dividendsService.getPotentialDividends();
    }

    @Post('distribute')
    @Roles('super_admin', 'treasurer')
    distribute(@Req() req: any) {
        return this.dividendsService.distributeDividends(req.user.userId);
    }
}
