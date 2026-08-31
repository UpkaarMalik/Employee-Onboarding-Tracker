import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ModeratePostDto } from './dto/moderate-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  role: string;
}

const MODERATOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'HR'];

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.postsService.findAll(user.userId, MODERATOR_ROLES.includes(user.role));
  }

  @Post()
  async create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthenticatedUser) {
    return this.postsService.create(user.userId, dto);
  }

  @Patch(':id/moderate')
  @Permissions('post.moderate')
  async moderate(
    @Param('id') id: string,
    @Body() dto: ModeratePostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.moderate(id, dto, user.userId);
  }

  @Post(':id/react')
  async react(
    @Param('id') id: string,
    @Body() dto: ReactPostDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.postsService.react(id, user.userId, dto.reaction);
  }
}
