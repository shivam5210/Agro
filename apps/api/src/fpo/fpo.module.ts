import { Module } from '@nestjs/common';
import { FpoService } from './fpo.service';
import { FpoController } from './fpo.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FpoService],
  controllers: [FpoController],
  exports: [FpoService],
})
export class FpoModule {}