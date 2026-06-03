import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFpoDto } from './dto/create-fpo.dto';
import { UpdateFpoDto } from './dto/update-fpo.dto';

@Injectable()
export class FpoService {
  constructor(private prisma: PrismaService) {}

  async create(createFpoDto: CreateFpoDto) {
    // Check if FPO with same registration number already exists
    const existingFpo = await this.prisma.fpo.findUnique({
      where: { registrationNo: createFpoDto.registrationNo },
    });

    if (existingFpo) {
      throw new Error('FPO with this registration number already exists');
    }

    return this.prisma.fpo.create({
      data: {
        ...createFpoDto,
        // If admin user id is provided, link it
        adminId: createFpoDto.adminId,
      },
    });
  }

  async findAll(query: any) {
    const { state, district, isVerified, page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (state) where.state = state;
    if (district) where.district = district;
    if (isVerified !== undefined) where.isVerified = isVerified;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [fpos, total] = await Promise.all([
      this.prisma.fpo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { farmers: true, commodities: true },
          },
        },
      }),
      this.prisma.fpo.count({ where }),
    ]);

    return {
      data: fpos,
      meta: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const fpo = await this.prisma.fpo.findUnique({
      where: { id },
      include: {
        admin: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        farmers: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        commodities: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    if (!fpo) {
      throw new NotFoundException(`FPO with ID ${id} not found`);
    }

    return fpo;
  }

  async update(id: string, updateFpoDto: UpdateFpoDto) {
    const fpo = await this.prisma.fpo.findUnique({ where: { id } });

    if (!fpo) {
      throw new NotFoundException(`FPO with ID ${id} not found`);
    }

    // If updating registration number, check for duplicates
    if (
      updateFpoDto.registrationNo &&
      updateFpoDto.registrationNo !== fpo.registrationNo
    ) {
      const existingFpo = await this.prisma.fpo.findUnique({
        where: { registrationNo: updateFpoDto.registrationNo },
      });

      if (existingFpo) {
        throw new Error('FPO with this registration number already exists');
      }
    }

    return this.prisma.fpo.update({
      where: { id },
      data: updateFpoDto,
    });
  }

  async remove(id: string) {
    const fpo = await this.prisma.fpo.findUnique({ where: { id } });

    if (!fpo) {
      throw new NotFoundException(`FPO with ID ${id} not found`);
    }

    // Check if FPO has associated farmers or transactions
    const [farmerCount, transactionCount] = await Promise.all([
      this.prisma.farmer.count({ where: { fpoId: id } }),
      this.prisma.transaction.count({ where: { fpoId: id } }),
    ]);

    if (farmerCount > 0 || transactionCount > 0) {
      throw new Error(
        'Cannot delete FPO with existing farmers or transactions. Consider deactivating instead.',
      );
    }

    return this.prisma.fpo.delete({ where: { id } });
  }

  // Additional methods for dashboard stats
  async getFpoStats(fpoId: string) {
    const [
      farmerCount,
      commodityCount,
      productionForecastCount,
      transactionCount,
    ] = await Promise.all([
      this.prisma.farmer.count({ where: { fpoId } }),
      this.prisma.commodity.count({ where: { fpoId } }),
      this.prisma.productionForecast.count({ where: { fpoId } }),
      this.prisma.transaction.count({ where: { fpoId } }),
    ]);

    return {
      farmerCount,
      commodityCount,
      productionForecastCount,
      transactionCount,
    };
  }
}