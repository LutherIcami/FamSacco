import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<({
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
    }) | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        passwordHash: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    create(createUserDto: CreateUserDto): Promise<{
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
