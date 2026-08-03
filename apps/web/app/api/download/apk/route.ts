import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const possiblePaths = [
    path.join(process.cwd(), 'apps', 'web', 'public', 'downloads', 'CampusConnect.apk'),
    path.join(process.cwd(), 'public', 'downloads', 'CampusConnect.apk'),
    path.join(process.cwd(), 'downloaded_test_app.apk'),
    path.join(process.cwd(), 'apps', 'web', 'public', 'CampusConnect.apk'),
  ];

  const filePath = possiblePaths.find((p) => fs.existsSync(p));
  
  if (!filePath) {
    return NextResponse.json({ success: false, message: 'APK file not found on server' }, { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="CampusConnect.apk"',
      'Content-Length': stat.size.toString(),
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
