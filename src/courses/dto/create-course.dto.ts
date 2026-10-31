import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsIn, Min } from 'class-validator';

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

  @IsString()
  @IsIn(['percentage', 'fixed'])
  @IsOptional()
  discountType?: 'percentage' | 'fixed';

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}