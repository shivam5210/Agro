import { Module } from '@nestjs/common';
import { DemandMatchingService } from './demand-matching.service';
import { DemandMatchingController } from './demand-matching.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DemandMatchingService],
  controllers: [DemandMatchingController],
})
export class DemandMatchingModule {}