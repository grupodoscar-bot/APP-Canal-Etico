import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductFamiliesModule } from './modules/product-families/product-families.module';
import { ProductsModule } from './modules/products/products.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SalesModule } from './modules/sales/sales.module';
import { CashSessionsModule } from './modules/cash-sessions/cash-sessions.module';
import { VerifactuModule } from './modules/verifactu/verifactu.module';
import { AccessLogsModule } from './modules/access-logs/access-logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    CustomersModule,
    SuppliersModule,
    ProductFamiliesModule,
    ProductsModule,
    InvoicesModule,
    SalesModule,
    CashSessionsModule,
    VerifactuModule,
    AccessLogsModule,
  ],
})
export class AppModule {}
