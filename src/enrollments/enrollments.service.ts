// src/enrollments/enrollments.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  // 1. تسجيل طالب في دورة مع حساب وتثبيت priceAtEnrollment
  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { studentId, courseId } = createEnrollmentDto;

    // أ. التأكد من وجود الطالب
    await this.studentsService.findOne(studentId);

    // ب. التأكد من وجود الدورة والحصول على سعرها النهائي الحالي (بعد الخصم)
    const course = await this.coursesService.findOne(courseId);
    if (!course.isActive) {
      throw new BadRequestException('Cannot enroll in an inactive course.');
      }
    // ج. التحقق من وجود تسجيل سابق بين هذا الطالب وتلك الدورة
    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        throw new ConflictException('Student is already actively enrolled in this course.');
      }
      // إذا كان مسجلاً مسبقاً ولكن الحالة ملغية (Cancelled)، نقوم بإعادة تفعيله وتحديث السعر التاريخي
      existingEnrollment.status = 'active';
      existingEnrollment.priceAtEnrollment = course.finalPrice;
      return await this.enrollmentRepository.save(existingEnrollment);
    }

    // د. إنشاء سجل تسجيل جديد بالكامل
    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
      priceAtEnrollment: course.finalPrice,
      status: 'active',
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  // 2. جلب جميع التسجيلات مع بيانات الطالب والدورة
  async findAll() {
    return await this.enrollmentRepository.find({
      relations: {
        student: true,
        course: true,
      },
    });
  }

  // 3. جلب تسجيل واحد بالـ ID
  async findOne(id: string) {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: {
        student: true,
        course: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID #${id} not found`);
    }

    return enrollment;
  }

  // 4. تحديث حالة التسجيل (مثل الإلغاء CANCELLED)
  async updateStatus(id: string, updateStatusDto: UpdateEnrollmentStatusDto) {
    const enrollment = await this.findOne(id);
    enrollment.status = updateStatusDto.status;
    return await this.enrollmentRepository.save(enrollment);
  }

  // 5. الحذف النهائي للتسجيل
  async remove(id: string) {
    const enrollment = await this.findOne(id);
    await this.enrollmentRepository.remove(enrollment);
    return { message: `Enrollment with ID #${id} has been permanently deleted.` };
  }
}