import { Module } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { FarmerController } from './farmer.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FarmerService],
  controllers: [FarmerController],
  exports: [FarmerService],
})
export class FarmerModule {}