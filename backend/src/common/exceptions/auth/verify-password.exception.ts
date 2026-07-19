import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class VerifyPasswordException extends BaseException {
  constructor() {
    super('Invalid credentials', HttpStatus.BAD_REQUEST, 'VERIFY_PASSWORD');
  }
}
