import { AuditService } from './audit.service';
export declare class AuditController {
    private auditService;
    constructor(auditService: AuditService);
    getLogs(limit?: string): Promise<({
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
