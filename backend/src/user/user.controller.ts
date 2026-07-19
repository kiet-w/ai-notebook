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
  UseGuards,
  ForbiddenException,
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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface AuthRequest extends Request {
  user: { id: string; role: string };
}

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
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: AuthRequest): Promise<ResponseUserDto[]> {
    if (req.user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
    return this.userService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<ResponseUserDto> {
    if (req.user.id !== id && req.user.role !== 'ADMIN')
      throw new ForbiddenException('Access denied');
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: AuthRequest,
  ): Promise<ResponseUserDto> {
    if (req.user.id !== id && req.user.role !== 'ADMIN')
      throw new ForbiddenException('Access denied');
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: AuthRequest): Promise<void> {
    if (req.user.id !== id && req.user.role !== 'ADMIN')
      throw new ForbiddenException('Access denied');
    return this.userService.remove(id);
  }
}
