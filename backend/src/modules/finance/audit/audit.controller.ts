import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AuditService } from './audit.service';

@Controller('finance/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
    constructor(private auditService: AuditService) { }

    @Get('logs')
    @Roles('super_admin')
    getLogs(@Query('limit') limit?: string) {
        return this.auditService.getLogs(limit ? parseInt(limit) : 100);
    }
}
