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

  @Get([
    'CampusConnect.apk',
    'CampusConnect-debug.apk',
    'downloads/CampusConnect.apk',
    'downloads/CampusConnect-debug.apk',
    'download/apk',
    'api/download/apk',
    'api/v1/CampusConnect.apk',
    'api/v1/CampusConnect-debug.apk',
    'api/v1/downloads/CampusConnect.apk',
    'api/v1/downloads/CampusConnect-debug.apk',
    'api/v1/download/apk',
  ])
  @ApiOperation({ summary: 'Download CampusConnect APK Binary (Release or Debug)' })
  downloadApk(@Res() res: Response) {
    const isDebug = res.req.url?.includes('debug') || res.req.query?.type === 'debug';
    const filename = isDebug ? 'CampusConnect-debug.apk' : 'CampusConnect.apk';
    
    const candidates = isDebug ? [
      path.resolve(process.cwd(), 'CampusConnect-debug.apk'),
      path.resolve(process.cwd(), 'apps/api/CampusConnect-debug.apk'),
      path.resolve(process.cwd(), 'apps/web/public/downloads/CampusConnect-debug.apk'),
      path.resolve(__dirname, '../CampusConnect-debug.apk'),
      path.resolve(__dirname, '../../CampusConnect-debug.apk'),
      path.resolve(__dirname, '../../../apps/web/public/downloads/CampusConnect-debug.apk'),
    ] : [
      path.resolve(process.cwd(), 'downloaded_test_app.apk'),
      path.resolve(process.cwd(), 'CampusConnect.apk'),
      path.resolve(process.cwd(), 'apps/api/CampusConnect.apk'),
      path.resolve(process.cwd(), 'apps/web/public/downloads/CampusConnect.apk'),
      path.resolve(__dirname, '../downloaded_test_app.apk'),
      path.resolve(__dirname, '../../downloaded_test_app.apk'),
      path.resolve(__dirname, '../../../downloaded_test_app.apk'),
    ];

    const apkPath = candidates.find(c => fs.existsSync(c));
    if (!apkPath) {
      throw new NotFoundException(`APK binary (${filename}) not found on server`);
    }

    const stat = fs.statSync(apkPath);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stat.size);
    fs.createReadStream(apkPath).pipe(res);
  }
}
