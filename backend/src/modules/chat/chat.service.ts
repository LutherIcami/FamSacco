import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async getRecentMessages(limit = 50) {
        return this.prisma.chatMessage.findMany({
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        roles: { include: { role: true } }
                    }
                }
            }
        });
    }

    async sendMessage(userId: string, dto: SendMessageDto) {
        return this.prisma.chatMessage.create({
            data: {
                userId,
                content: dto.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        roles: { include: { role: true } }
                    }
                }
            }
        });
    }
}
