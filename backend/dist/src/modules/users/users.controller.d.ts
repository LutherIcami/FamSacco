import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<({
        roles: ({
            role: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            roleId: string;
        })[];
    } & {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        passwordHash: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findAllPending(): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        passwordHash: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        passwordHash: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
