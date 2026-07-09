import { Module } from '@nestjs/common';
import { EducationGroupsService } from './education-groups.service';
import { EducationGroupsController } from './education-groups.controller';

@Module({
  providers: [EducationGroupsService],
  controllers: [EducationGroupsController],
  exports: [EducationGroupsService],
})
export class EducationGroupsModule {}
