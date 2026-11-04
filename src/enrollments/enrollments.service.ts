import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { StudentsService } from '../students/students.service';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentStatus } from './enums/enrollment-status.enum';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly studentsService: StudentsService,
    private readonly coursesService: CoursesService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { studentId, courseId } = createEnrollmentDto;

    const [student, course] = await Promise.all([
      this.studentsService.findOne(studentId),
      this.coursesService.findOne(courseId),
    ]);

    if (!student) {
      throw new NotFoundException(`Student with ID #${studentId} not found`);
    }

    if (!course.isActive) {
      throw new BadRequestException('Cannot enroll in an inactive course.');
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: { studentId, courseId },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw new ConflictException(
          'Student is already actively enrolled in this course.',
        );
      }
      existingEnrollment.status = EnrollmentStatus.ACTIVE;
      existingEnrollment.priceAtEnrollment = course.finalPrice;
      return await this.enrollmentRepository.save(existingEnrollment);
    }

    const enrollment = this.enrollmentRepository.create({
      studentId,
      courseId,
      priceAtEnrollment: course.finalPrice,
      status: EnrollmentStatus.ACTIVE,
    });

    return await this.enrollmentRepository.save(enrollment);
  }

  async findAll() {
    return await this.enrollmentRepository.find({
      relations: {
        student: true,
        course: true,
      },
    });
  }

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

  async updateStatus(id: string, updateStatusDto: UpdateEnrollmentStatusDto) {
    const enrollment = await this.findOne(id);
    enrollment.status = updateStatusDto.status;
    return await this.enrollmentRepository.save(enrollment);
  }

  async remove(id: string): Promise<void> {
    const enrollment = await this.findOne(id);
    await this.enrollmentRepository.softRemove(enrollment);
  }
}
