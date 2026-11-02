import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateEnrollmentDto } from './create-enrollment.dto'; 

export class UpdateEnrollmentStatusDto extends PartialType(
  OmitType(CreateEnrollmentDto, ['studentId', 'courseId'] as const),
) {}