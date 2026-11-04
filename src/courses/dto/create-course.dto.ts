import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, Min, IsEnum } from 'class-validator';
import { CourseDiscountType } from '../enums/course-discount-type.enum';
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(CourseDiscountType, {
    message: 'discountType must be NONE, PERCENTAGE, or FIXED',
  })
  @IsOptional()
  discountType?: CourseDiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}