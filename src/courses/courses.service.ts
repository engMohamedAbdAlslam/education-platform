import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDiscountType } from './enums/course-discount-type.enum';

@Injectable()
class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  private calculateFinalPrice(course: Pick<Course, 'price' | 'discountType' | 'discountValue'>): number {
    const price = Number(course.price);
    const discountValue = Number(course.discountValue || 0);

    if (!course.discountType || course.discountType === CourseDiscountType.NONE || discountValue <= 0) {
      return price;
    }

    if (course.discountType === CourseDiscountType.PERCENTAGE) {
      const discountAmount = (price * discountValue) / 100;
      return Math.max(0, price - discountAmount);
    }

    if (course.discountType === CourseDiscountType.FIXED) {
      return Math.max(0, price - discountValue);
    }

    return price;
  }

  private withFinalPrice(course: Course) {
    return {
      ...course,
      finalPrice: this.calculateFinalPrice(course),
    };
  }

  async create(createCourseDto: CreateCourseDto) {
    this.validateDiscount(
      createCourseDto.price,
      createCourseDto.discountType,
      createCourseDto.discountValue,
    );
    const course = this.courseRepository.create(createCourseDto);
    const saved = await this.courseRepository.save(course);
    return this.withFinalPrice(saved);
  }

  async findAll() {
    const courses = await this.courseRepository.find();
    return courses.map((course) => this.withFinalPrice(course));
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException(`Course with ID #${id} not found`);
    }
    return this.withFinalPrice(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepository.preload({
      id,
      ...updateCourseDto,
    });
    if (!course) {
      throw new NotFoundException(`Course with ID #${id} not found`);
    }
    this.validateDiscount(course.price, course.discountType, course.discountValue);
    const updated = await this.courseRepository.save(course);
    return this.withFinalPrice(updated);
  }

  async remove(id: string): Promise<void> {
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
      throw new ConflictException(
        'Cannot delete course because there are student enrollments associated with it.',
      );
    }

    await this.courseRepository.softRemove(course);
  }

  async findCourseEnrollments(courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: {
        enrollments: {
          student: true,
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID #${courseId} not found`);
    }

    return course.enrollments;
  }

  private validateDiscount(
    price: number,
    discountType?: CourseDiscountType,
    discountValue?: number,
  ) {
    if (!discountType || discountValue === undefined || discountValue === null) {
      return;
    }

    const numericPrice = Number(price);
    const numericDiscount = Number(discountValue);

    if (numericDiscount < 0) {
      throw new BadRequestException('Discount value cannot be negative.');
    }

    if (discountType === CourseDiscountType.PERCENTAGE) {
      if (numericDiscount > 100) {
        throw new BadRequestException('Percentage discount cannot exceed 100.');
      }
    }

    if (discountType === CourseDiscountType.FIXED) {
      if (numericDiscount > numericPrice) {
        throw new BadRequestException(
          'Fixed discount cannot exceed the course base price.',
        );
      }
    }
  }
}

export { CoursesService };
