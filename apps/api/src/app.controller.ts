import { Controller, Get, Res, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

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

  @Get(['CampusConnect.apk', 'download/apk', 'downloads/CampusConnect.apk'])
  @ApiOperation({ summary: 'Download CampusConnect Release APK' })
  downloadApk(@Res() res: Response) {
    const apkPath = path.resolve(process.cwd(), 'downloaded_test_app.apk');
    if (!fs.existsSync(apkPath)) {
      throw new NotFoundException('CampusConnect.apk binary not found on server');
    }
    const stat = fs.statSync(apkPath);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="CampusConnect.apk"');
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(apkPath).pipe(res);
  }
}
