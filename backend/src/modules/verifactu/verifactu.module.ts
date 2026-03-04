import { Module } from '@nestjs/common';
import { VerifactuService } from './verifactu.service';
import { VerifactuController } from './verifactu.controller';

@Module({
  providers: [VerifactuService],
  controllers: [VerifactuController],
  exports: [VerifactuService],
})
export class VerifactuModule {}
