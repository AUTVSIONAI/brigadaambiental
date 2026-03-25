import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function readFirst(paths: string[]) {
  for (const p of paths) {
    try {
      const data = await readFile(p);
      return { data, filePath: p };
    } catch {}
  }
  return null;
}

export async function GET() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const legacyPublicDir = path.join(rootDir, 'brigada-platform', 'public');
  const legacyAppDir = path.join(rootDir, 'brigada-platform', 'src', 'app');
  const candidates = [
    path.join(publicDir, 'favicon.ico'),
    path.join(publicDir, 'logo.ico'),
    path.join(publicDir, 'logo.png'),
    path.join(publicDir, 'logo.PNG'),
    path.join(publicDir, 'logo.jpg'),
    path.join(publicDir, 'logo.jpeg'),
    path.join(publicDir, 'logo.svg'),
    path.join(legacyPublicDir, 'favicon.ico'),
    path.join(legacyPublicDir, 'logo.ico'),
    path.join(legacyPublicDir, 'logo.png'),
    path.join(legacyPublicDir, 'logo.PNG'),
    path.join(legacyPublicDir, 'logo.jpg'),
    path.join(legacyPublicDir, 'logo.jpeg'),
    path.join(legacyPublicDir, 'logo.svg'),
    path.join(legacyAppDir, 'favicon.ico'),
  ];

  const result = await readFirst(candidates);
  if (!result) return new NextResponse(null, { status: 404 });

  const ext = path.extname(result.filePath).toLowerCase();
  const contentType =
    ext === '.ico'
      ? 'image/x-icon'
      : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : 'image/png';

  return new NextResponse(result.data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
