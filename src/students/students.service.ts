import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
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

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existingStudent = await this.studentRepository.findOne({
      where: { email: createStudentDto.email },
    });
    if (existingStudent) {
      throw new ConflictException('A student with this email already exists.');
    }
    const student = this.studentRepository.create(createStudentDto);
    return await this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID #${id} not found`);
    }
    return student;
  }

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

  async remove(id: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { enrollments: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID #${id} not found`);
    }

    if (student.enrollments && student.enrollments.length > 0) {
      throw new ConflictException(
        'Cannot delete student because they have course enrollments.',
      );
    }

    await this.studentRepository.softRemove(student);
  }

  async findStudentEnrollments(studentId: string) {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: {
        enrollments: {
          course: true,
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID #${studentId} not found`);
    }

    return student.enrollments;
  }
}
