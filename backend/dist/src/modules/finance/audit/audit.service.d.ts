import { PrismaService } from '../../../prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(userId: string, action: string, entityType: string, entityId: string, ipAddress?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        ipAddress: string | null;
    }>;
    getLogs(limit?: number): Promise<({
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        ipAddress: string | null;
    })[]>;
}
