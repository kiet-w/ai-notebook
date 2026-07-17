import { HttpStatus } from '@nestjs/common';
import { BaseException } from '../base.exception';

export class verifyPasswordException extends BaseException {
  constructor() {
    super(
      'Password hoặc Email đã sai',
      HttpStatus.BAD_REQUEST,
      'check password',
    );
  }
}
