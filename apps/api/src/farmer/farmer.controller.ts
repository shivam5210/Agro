import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, ParseFilePipe, MaxFileSize, FileTypeValidator, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FarmerService } from './farmer.service';
import { CreateFarmerDto } from './dto/create-farmer.dto';
import { UpdateFarmerDto } from './dto/update-farmer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('farmers')
export class FarmerController {
  constructor(private readonly farmerService: FarmerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN', 'FPO_STAFF')
  create(@Body() createFarmerDto: CreateFarmerDto) {
    return this.farmerService.create(createFarmerDto);
  }

  @Post('bulk-upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN', 'FPO_STAFF')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUpload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSize({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(csv|xlsx|xls)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('fpoId') fpoId: string,
  ) {
    return this.farmerService.bulkUpload(file, fpoId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.farmerService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.farmerService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'FPO_ADMIN', 'FPO_STAFF')
  update(@Param('id') id: string, @Body() updateFarmerDto: UpdateFarmerDto) {
    return this.farmerService.update(id, updateFarmerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.farmerService.remove(id);
  }
}