import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Ip,
  Res,
  Headers,
  Req,
  UnauthorizedException,
  Head,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from './helper/cookie.helper';
import type { Request, Response } from 'express';
import { Record } from '@prisma/client/runtime/client';
import { AuthResponseDto } from './dto/response-token.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto, @Ip() ip :string, @Headers('user-agent') userAgent: string): Promise<AuthResponseDto>{
    const result = await this.userService.register(dto, ip, userAgent)
    return result
  }
  
  @Get()
  findAll(): Promise<ResponseUserDto[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ResponseUserDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<ResponseUserDto> {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}
