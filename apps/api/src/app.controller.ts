import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Application Root Metadata' })
  getRoot() {
    console.log(`[Health Probe] GET / (Root) requested at: ${new Date().toISOString()}`);
    return {
      name: 'campus-connect-api',
      version: '1.0.0',
      status: 'UP',
      timestamp: new Date().toISOString(),
      docs: '/api/docs',
    };
  }
}
