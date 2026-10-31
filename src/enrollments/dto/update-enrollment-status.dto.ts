import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateEnrollmentStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; 
}