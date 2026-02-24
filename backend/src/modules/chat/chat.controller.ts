import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Get('recent')
    async getRecent() {
        const messages = await this.chatService.getRecentMessages();
        return messages.reverse(); // Show in chronological order
    }

    @Post('send')
    async send(@Req() req: any, @Body() dto: SendMessageDto) {
        return this.chatService.sendMessage(req.user.userId, dto);
    }
}
