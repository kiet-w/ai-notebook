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
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from './helper/cookie.helper';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: CreateUserDto,
    @Ip() ip: string,
    @Headers('user-agent') subAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userService.register(dto, ip, subAgent);
    setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') subAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userService.login(dto, ip, subAgent);
    setRefreshTokenCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;
    if (!refreshToken)
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    try {
      const result = await this.userService.refresh(
        refreshToken,
        ip,
        userAgent,
      );
      setRefreshTokenCookie(res, result.refreshToken);
      return { accessToken: result.accessToken };
    } catch (error) {
      clearRefreshTokenCookie(res);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'] as string | undefined;
    if (refreshToken) {
      await this.userService.logout(refreshToken);
    }
    clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
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
