import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  create(createDto: CreatePostDto, authorId: string) {
    const post = this.postRepository.create({
      ...createDto,
      authorId,
    });

    return this.postRepository.save(post);
  }

  findAll() {
    return this.postRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, updateDto: UpdatePostDto) {
    const post = await this.findOne(id);
    Object.assign(post, updateDto);
    return this.postRepository.save(post);
  }

  async remove(id: string) {
    const post = await this.findOne(id);
    await this.postRepository.remove(post);
    return { deleted: true };
  }
}
