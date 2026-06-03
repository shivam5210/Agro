import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { AuthModule } from './auth/auth.module';
import { FpoModule } from './fpo/fpo.module';
import { FarmerModule } from './farmer/farmer.module';
import { CommodityModule } from './commodity/commodity.module';
import { BuyerModule } from './buyer/buyer.module';
import { LogisticsModule } from './logistics/logistics.module';
import { TransactionModule } from './transaction/transaction.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DemandMatchingModule } from './demand-matching/demand-matching.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        explicitConnect: true,
      },
    }),
    AuthModule,
    FpoModule,
    FarmerModule,
    CommodityModule,
    BuyerModule,
    LogisticsModule,
    TransactionModule,
    AnalyticsModule,
    DemandMatchingModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}