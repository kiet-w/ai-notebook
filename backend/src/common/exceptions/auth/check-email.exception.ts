import { BaseException } from '../base.exception';
import { HttpStatus } from '@nestjs/common';

export class CheckEmailException extends BaseException {
  constructor() {
    super('Email is already registered', HttpStatus.BAD_REQUEST, 'CHECK_EMAIL');
  }
}
