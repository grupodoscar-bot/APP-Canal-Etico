import { Module } from '@nestjs/common';
import { ProductFamiliesService } from './product-families.service';
import { ProductFamiliesController } from './product-families.controller';

@Module({
  providers: [ProductFamiliesService],
  controllers: [ProductFamiliesController],
  exports: [ProductFamiliesService],
})
export class ProductFamiliesModule {}
