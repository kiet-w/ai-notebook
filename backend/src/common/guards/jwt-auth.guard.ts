import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    // Lấy accessToken từ header Authorization hoặc Query Parameter (dành cho SSE)
    const authHeader = req.headers['authorization'];
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Fallback cho SSE (EventSource không hỗ trợ Header)
    if (!token && req.query.token && typeof req.query.token === 'string') {
      token = req.query.token;
    }

    if (!token) throw new UnauthorizedException('Access token is missing');

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        role: string;
      }>(token);
      // Gắn thông tin user vào request để controller/service dùng
      (req as Request & { user: { id: string; role: string } }).user = {
        id: payload.sub,
        role: payload.role,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
  }
}
