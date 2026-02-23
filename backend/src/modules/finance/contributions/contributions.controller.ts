import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ContributionsService } from './contributions.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

@Controller('finance/contributions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContributionsController {
    constructor(private readonly contributionsService: ContributionsService) { }

    @Post()
    @Roles('super_admin', 'treasurer')
    async deposit(
        @Body() data: { userId: string; amount: number; month: string },
        @Req() req: any
    ) {
        return this.contributionsService.deposit(data.userId, data, req.user.userId);
    }

    @Get()
    @Roles('super_admin', 'treasurer', 'committee')
    async findAll() {
        return this.contributionsService.findAll();
    }

    @Get('my')
    async findMy(@Req() req: any) {
        return this.contributionsService.findByUser(req.user.userId);
    }
}
