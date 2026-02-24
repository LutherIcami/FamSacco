import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('finance/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('statement')
    async downloadStatement(
        @Req() req: any,
        @Res() res: Response,
        @Query('userId') queryUserId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        // Members can only download their own. Admins/Treasurers can specify a userId.
        const isAdmin = req.user.roles.some((r: string) => ['super_admin', 'treasurer', 'secretary'].includes(r));
        const targetUserId = isAdmin && queryUserId ? queryUserId : req.user.userId;

        try {
            const buffer = await this.reportsService.generateStatement(targetUserId, {
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
            });

            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=statement_${targetUserId}_${new Date().toISOString().split('T')[0]}.pdf`,
                'Content-Length': buffer.length,
            });

            res.end(buffer);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}
