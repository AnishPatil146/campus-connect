import { IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  divisionId?: string;

  @IsString()
  @IsOptional()
  rollNumber?: string;

  @IsString()
  @IsOptional()
  admissionNumber?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  profilePhoto?: string;

  @IsString()
  @IsOptional()
  parentName?: string;

  @IsString()
  @IsOptional()
  parentMobile?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
