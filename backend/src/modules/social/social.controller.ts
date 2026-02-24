import {
    Controller, Get, Post, Delete,
    Body, Param, Request,
    UseGuards, HttpCode, HttpStatus
} from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
    constructor(private socialService: SocialService) { }

    // ─── POSTS ────────────────────────────────────────────────────────────

    @Get('posts')
    getPosts() {
        return this.socialService.getPosts();
    }

    @Post('posts')
    @Roles('member', 'super_admin', 'secretary', 'treasurer')
    @UseGuards(RolesGuard)
    createPost(@Request() req: any, @Body() dto: CreatePostDto) {
        return this.socialService.createPost(req.user.userId, dto);
    }

    @Post('broadcast')
    @Roles('secretary', 'super_admin')
    @UseGuards(RolesGuard)
    broadcastPost(@Request() req, @Body() dto: CreatePostDto) {
        return this.socialService.broadcastPost(req.user.userId, dto);
    }

    @Delete('posts/:id')
    @HttpCode(HttpStatus.OK)
    deletePost(@Request() req, @Param('id') id: string) {
        return this.socialService.deletePost(req.user.userId, id);
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────

    @Post('posts/:postId/comments')
    addComment(
        @Request() req,
        @Param('postId') postId: string,
        @Body() dto: CreateCommentDto
    ) {
        return this.socialService.addComment(req.user.userId, postId, dto);
    }

    @Delete('comments/:id')
    @HttpCode(HttpStatus.OK)
    deleteComment(@Request() req, @Param('id') id: string) {
        return this.socialService.deleteComment(req.user.userId, id);
    }
}
