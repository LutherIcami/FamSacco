import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);
        if (user && (await bcrypt.compare(loginDto.password, user.passwordHash))) {
            if (user.status !== 'ACTIVE') {
                throw new UnauthorizedException(`Account status: ${user.status}. Please contact an administrator.`);
            }
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            name: `${user.firstName} ${user.lastName}`,
            roles: user.roles.map(ur => ur.role.name)
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                roles: payload.roles
            }
        };
    }

    async register(createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto);
        return this.login({
            email: user.email,
            password: createUserDto.password,
        });
    }
}
