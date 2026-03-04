import { Module } from '@nestjs/common';
import { AccessLogsService } from './access-logs.service';
import { AccessLogsController } from './access-logs.controller';

@Module({
  providers: [AccessLogsService],
  controllers: [AccessLogsController],
  exports: [AccessLogsService],
})
export class AccessLogsModule {}
