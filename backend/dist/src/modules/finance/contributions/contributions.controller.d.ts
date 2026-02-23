import { ContributionsService } from './contributions.service';
export declare class ContributionsController {
    private readonly contributionsService;
    constructor(contributionsService: ContributionsService);
    deposit(data: {
        userId: string;
        amount: number;
        month: string;
    }, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    }>;
    findAll(): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string | null;
            passwordHash: string;
            status: import("@prisma/client").$Enums.UserStatus;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    })[]>;
    findMy(req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        userId: string;
        journalEntryId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        month: string;
    }[]>;
}
