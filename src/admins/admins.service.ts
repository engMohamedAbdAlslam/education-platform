// src/admins/admins.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  // 1. إنشاء مسؤول جديد
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({ where: { email: createAdminDto.email } });
      if (existingAdmin) {
        throw new ConflictException('A student with this email already exists.');
        }
    const admin = this.adminRepository.create(createAdminDto);
    return await this.adminRepository.save(admin);
  }

  // 2. جلب جميع المسؤولين
  async findAll(): Promise<Admin[]> {
    return await this.adminRepository.find();
  }

  // 3. جلب مسؤول بالـ ID
  async findOne(id: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { id } });
    if (!admin) {
      throw new NotFoundException(`Admin with ID #${id} not found`);
    }
    return admin;
  }

  // 4. تحديث بيانات المسؤول
  async update(id: string, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    const admin = await this.adminRepository.preload({
      id,
      ...updateAdminDto,
    });
    if (!admin) {
      throw new NotFoundException(`Admin with ID #${id} not found`);
    }
    return await this.adminRepository.save(admin);
  }

  // 5. حذف المسؤول
  async remove(id: string) {
    const admin = await this.findOne(id); // يتحقق من الوجود أولاً
    await this.adminRepository.remove(admin);
    return { message: `Admin with ID #${id} has been successfully deleted.` };
  }
}