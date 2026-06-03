import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { FpoService } from './fpo.service';
import { CreateFpoDto } from './dto/create-fpo.dto';
import { UpdateFpoDto } from './dto/update-fpo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('fpo')
export class FpoController {
  constructor(private readonly fpoService: FpoService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN')
  create(@Body() createFpoDto: CreateFpoDto) {
    return this.fpoService.create(createFpoDto);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.fpoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fpoService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN')
  update(@Param('id') id: string, @Body() updateFpoDto: UpdateFpoDto) {
    return this.fpoService.update(id, updateFpoDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.fpoService.remove(id);
  }
}