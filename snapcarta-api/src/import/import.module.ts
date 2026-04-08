import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { ProductsModule } from '../products/products.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [ProductsModule, PricingModule],
  controllers: [ImportController],
  providers: [ImportService],
  exports: [ImportService]
})
export class ImportModule {}
