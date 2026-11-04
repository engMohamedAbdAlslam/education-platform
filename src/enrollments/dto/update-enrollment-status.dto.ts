import { IsEnum, IsNotEmpty } from 'class-validator';
import { EnrollmentStatus } from '../enums/enrollment-status.enum';

export class UpdateEnrollmentStatusDto {
  @IsNotEmpty()
  @IsEnum(EnrollmentStatus)
  status: EnrollmentStatus;
}