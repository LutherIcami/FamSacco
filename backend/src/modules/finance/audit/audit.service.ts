import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async log(userId: string, action: string, entityType: string, entityId: string, ipAddress?: string) {
        return this.prisma.auditLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                ipAddress
            }
        });
    }

    async getLogs(limit = 100) {
        return this.prisma.auditLog.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });
    }
}
