import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class SocialService {
    constructor(private prisma: PrismaService) { }

    // ─── POSTS ────────────────────────────────────────────────────────────

    async getPosts() {
        return this.prisma.post.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true }
                        }
                    }
                },
                _count: { select: { comments: true } }
            }
        });
    }

    async createPost(userId: string, dto: CreatePostDto) {
        return this.prisma.post.create({
            data: {
                userId,
                content: dto.content,
                imageUrl: dto.imageUrl,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                },
                comments: true,
                _count: { select: { comments: true } }
            }
        });
    }

    async broadcastPost(userId: string, dto: CreatePostDto) {
        // Create the post
        const post = await this.prisma.post.create({
            data: {
                userId,
                content: `🚨 BROADCAST: ${dto.content}`,
                imageUrl: dto.imageUrl,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            }
        });

        // Notify all active users
        const users = await this.prisma.user.findMany({
            where: { status: 'ACTIVE' },
            select: { id: true }
        });

        if (users.length > 0) {
            await this.prisma.notification.createMany({
                data: users.map(u => ({
                    userId: u.id,
                    type: 'SYSTEM_BROADCAST',
                    referenceId: post.id,
                    isRead: false
                }))
            });
        }

        return post;
    }

    async deletePost(userId: string, postId: string) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');
        if (post.userId !== userId) throw new ForbiddenException('You can only delete your own posts');
        await this.prisma.post.delete({ where: { id: postId } });
        return { message: 'Post deleted' };
    }

    // ─── COMMENTS ─────────────────────────────────────────────────────────

    async addComment(userId: string, postId: string, dto: CreateCommentDto) {
        const post = await this.prisma.post.findUnique({ where: { id: postId } });
        if (!post) throw new NotFoundException('Post not found');

        return this.prisma.comment.create({
            data: { postId, userId, content: dto.content },
            include: {
                user: { select: { id: true, firstName: true, lastName: true } }
            }
        });
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) throw new NotFoundException('Comment not found');
        if (comment.userId !== userId) throw new ForbiddenException('You can only delete your own comments');
        await this.prisma.comment.delete({ where: { id: commentId } });
        return { message: 'Comment deleted' };
    }
}
