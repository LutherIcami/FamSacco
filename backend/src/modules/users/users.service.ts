import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.findByEmail(createUserDto.email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        return this.prisma.user.create({
            data: {
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                email: createUserDto.email,
                phone: createUserDto.phone,
                passwordHash: hashedPassword,
            },
        });
    }
    async findAllPending() {
        return this.prisma.user.findMany({
            where: { status: 'PENDING' as UserStatus },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            include: {
                roles: {
                    include: {
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
        return this.prisma.user.update({
            where: { id },
            data: { status },
        });
    }
}
