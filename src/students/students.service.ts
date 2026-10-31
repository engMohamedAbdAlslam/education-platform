import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  // 1. إنشاء طالب جديد
  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existingStudent = await this.studentRepository.findOne({ where: { email: createStudentDto.email } });
        if (existingStudent) {
          throw new ConflictException('A student with this email already exists.');
        }     
    const student = this.studentRepository.create(createStudentDto);

    return await this.studentRepository.save(student);
  }

  // 2. جلب جميع الطلاب
  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  // 3. جلب طالب بالـ ID
  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID #${id} not found`);
    }
    return student;
  }

  // 4. تحديث بيانات الطالب
  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID #${id} not found`);
    }
    return await this.studentRepository.save(student);
  }

  // 5. حذف طالب مع فحص وجود تسجيلات سابقة
  async remove(id: string) {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { enrollments: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID #${id} not found`);
    }

    if (student.enrollments && student.enrollments.length > 0) {
      throw new BadRequestException(
        'Cannot delete student because they have active course enrollments.',
      );
    }

    await this.studentRepository.remove(student);
    return { message: `Student with ID #${id} has been successfully deleted.` };
  }

  // 6. استعراض الدورات المسجل فيها الطالب مع تفاصيل السعر التاريخي
  async findStudentEnrollments(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: {
        enrollments: {
          course: true, // جلب تفاصيل الدورة داخل كل تسجيل
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID #${studentId} not found`);
    }

    return student.enrollments.map((enrollment) => ({
      enrollmentId: enrollment.id,
      status: enrollment.status,
      priceAtEnrollment: enrollment.priceAtEnrollment,
      enrolledAt: enrollment.enrolledAt,
      course: enrollment.course,
    }));
  }
}