import { BaseException } from '../base.exception';
import { HttpStatus } from '@nestjs/common';

export class checkTokenException extends BaseException {
  constructor() {
    super('Invalid refresh token', HttpStatus.UNAUTHORIZED, 'CHECK_TOKEN');
  }
}
