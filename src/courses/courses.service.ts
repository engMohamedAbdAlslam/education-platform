// src/courses/courses.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  private calculateFinalPrice(course: Course): number {
    const price = Number(course.price);
    const discountValue = Number(course.discountValue || 0);

    if (!course.discountType || discountValue <= 0) {
      return price;
    }

    if (course.discountType === 'percentage') {
      const discountAmount = (price * discountValue) / 100;
      return Math.max(0, price - discountAmount);
    }

    if (course.discountType === 'fixed') {
      return Math.max(0, price - discountValue);
    }

    return price;
  }

  async create(createCourseDto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepository.create(createCourseDto);
    this.validateDiscount(course.price,course.discountType,course.discountValue)
    return await this.courseRepository.save(course);
  }

  async findAll() {
    const courses = await this.courseRepository.find();
    return courses.map((course) => ({
      ...course,
      finalPrice: this.calculateFinalPrice(course),
    }));
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with ID #${id} not found`);
    }
    return {
      ...course,
      finalPrice: this.calculateFinalPrice(course),
    };
  }
  async update(id: string, updateCourseDto: UpdateCourseDto) {
    
    const course = await this.courseRepository.preload({
      id,
      ...updateCourseDto,
    });
    if (!course) {
      throw new NotFoundException(`Course with ID #${id} not found`);
    }
    this.validateDiscount(course.price,course.discountType,course.discountValue)
    const updated = await this.courseRepository.save(course);
    return {
      ...updated,
      finalPrice: this.calculateFinalPrice(updated),
    };
  }

  // 5. حذف دورة مع حماية (منع الحذف إذا كان هناك طلاب مسجلين)
  async remove(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: {
    enrollments: true, 
        },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID #${id} not found`);
    }

    if (course.enrollments && course.enrollments.length > 0) {
      throw new BadRequestException(
        'Cannot delete course because there are active student enrollments associated with it.',
      );
    }

    await this.courseRepository.remove(course);
    return { message: `Course with ID #${id} has been successfully deleted.` };
  }

  // 6. استعراض الطلاب المسجلين في دورة معينة مع تفاصيل السعر التاريخي
  async findCourseEnrollments(courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations:{
    enrollments: {
      student: true, // جلب التسجيلات ومن داخلها جلب الطالب المرتبط بها
            },
        },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID #${courseId} not found`);
    }

    return course.enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      priceAtEnrollment: enrollment.priceAtEnrollment,
      enrolledAt: enrollment.enrolledAt,
      student: enrollment.student,
    }));
  }
  private validateDiscount(price: number, discountType?: 'percentage' | 'fixed', discountValue?: number) {
  if (!discountType || discountValue === undefined || discountValue === null) {
    return;
  }

  if (discountValue < 0) {
    throw new BadRequestException('Discount value cannot be negative.');
  }

  if (discountType === 'percentage') {
    if (discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100.');
    }
  }

  if (discountType === 'fixed') {
    if (discountValue > price) {
      throw new BadRequestException('Fixed discount cannot exceed the course base price.');
    }
  }
}
}

export { CoursesService };
