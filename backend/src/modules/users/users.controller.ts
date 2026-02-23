import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('super_admin', 'treasurer')
    findAll() {
        return this.usersService.findAll();
    }

    @Get('pending')
    @Roles('super_admin', 'treasurer', 'committee')
    findAllPending() {
        return this.usersService.findAllPending();
    }

    @Patch(':id/status')
    @Roles('super_admin', 'treasurer')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: 'ACTIVE' | 'SUSPENDED',
    ) {
        return this.usersService.updateStatus(id, status);
    }
}
