import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const isDebug = searchParams.get('type') === 'debug';
  const filename = isDebug ? 'CampusConnect-debug.apk' : 'CampusConnect.apk';

  const possiblePaths = isDebug ? [
    path.join(process.cwd(), 'apps', 'web', 'public', 'downloads', 'CampusConnect-debug.apk'),
    path.join(process.cwd(), 'public', 'downloads', 'CampusConnect-debug.apk'),
    path.join(process.cwd(), 'apps', 'mobile', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.resolve(__dirname, '../../../../public/downloads/CampusConnect-debug.apk'),
    path.resolve(__dirname, '../../../../../apps/web/public/downloads/CampusConnect-debug.apk'),
  ] : [
    path.join(process.cwd(), 'apps', 'web', 'public', 'downloads', 'CampusConnect.apk'),
    path.join(process.cwd(), 'public', 'downloads', 'CampusConnect.apk'),
    path.join(process.cwd(), 'downloaded_test_app.apk'),
    path.join(process.cwd(), 'apps', 'web', 'public', 'CampusConnect.apk'),
    path.resolve(__dirname, '../../../../public/downloads/CampusConnect.apk'),
    path.resolve(__dirname, '../../../../../apps/web/public/downloads/CampusConnect.apk'),
    path.resolve(__dirname, '../../../../../downloaded_test_app.apk'),
  ];

  const filePath = possiblePaths.find((p) => fs.existsSync(p));
  
  if (!filePath) {
    return NextResponse.json({ success: false, message: `APK file (${filename}) not found on server` }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
