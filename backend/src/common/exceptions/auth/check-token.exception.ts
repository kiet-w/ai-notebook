import { BaseException } from '../base.exception';
import { HttpStatus } from '@nestjs/common';

export class CheckTokenException extends BaseException {
  constructor() {
    super('Invalid refresh token', HttpStatus.UNAUTHORIZED, 'CHECK_TOKEN');
  }
}
