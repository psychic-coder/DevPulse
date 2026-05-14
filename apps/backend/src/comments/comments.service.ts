import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  create(postId: string, authorId: string, dto: CreateCommentDto) {
    const comment = this.commentRepository.create({
      postId,
      authorId,
      content: dto.content,
    });

    return this.commentRepository.save(comment);
  }

  findByPost(postId: string) {
    return this.commentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async remove(id: string) {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    await this.commentRepository.remove(comment);
    return { deleted: true };
  }
}
