import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CollegesService } from './colleges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from '../audit/audit.service';

@ApiTags('Colleges')
@Controller('api/v1/colleges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollegesController {
  constructor(
    private collegesService: CollegesService,
    private auditService: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve list of all colleges with nested hierarchy' })
  async findAll(@Req() req: any) {
    const data = await this.collegesService.findAll();
    
    // Log audit activity
    const user = req.user;
    await this.auditService.log(
      user.id,
      user.name,
      user.role,
      'Viewed Colleges',
      `User ${user.email} queried all colleges and hierarchies`,
    );

    return {
      message: 'Colleges retrieved successfully',
      data,
    };
  }
}
