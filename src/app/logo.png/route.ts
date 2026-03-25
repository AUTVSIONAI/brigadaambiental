import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { readdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const logoPatterns = [
  /^logo\.png(\.png)?$/i,
  /^logo\.jpe?g(\.jpe?g)?$/i,
  /^logo\.svg$/i,
];

function detectContentType(data: Buffer, filePath: string) {
  if (data.length >= 8) {
    const isPng =
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47 &&
      data[4] === 0x0d &&
      data[5] === 0x0a &&
      data[6] === 0x1a &&
      data[7] === 0x0a;
    if (isPng) return 'image/png';
  }
  if (data.length >= 3) {
    const isJpeg = data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    if (isJpeg) return 'image/jpeg';
  }

  const head = data.toString('utf8', 0, Math.min(256, data.length)).toLowerCase();
  if (head.includes('<svg')) return 'image/svg+xml';

  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.svg') return 'image/svg+xml';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'image/png';
}

async function findLogoInDir(dir: string) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    for (const pattern of logoPatterns) {
      const found = files.find((f) => pattern.test(f));
      if (found) return path.join(dir, found);
    }
    return null;
  } catch {
    return null;
  }
}

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
  const discovered =
    (await findLogoInDir(publicDir)) ?? (await findLogoInDir(legacyPublicDir));
  const candidates = [
    path.join(publicDir, 'logo.png'),
    path.join(publicDir, 'logo.PNG'),
    path.join(publicDir, 'logo.jpg'),
    path.join(publicDir, 'logo.jpeg'),
    path.join(publicDir, 'logo.svg'),
    path.join(publicDir, 'logo.png.png'),
    path.join(publicDir, 'logo.png.PNG'),
    path.join(publicDir, 'logo.jpeg.jpeg'),
    path.join(publicDir, 'logo.jpg.jpg'),
    path.join(legacyPublicDir, 'logo.png'),
    path.join(legacyPublicDir, 'logo.PNG'),
    path.join(legacyPublicDir, 'logo.jpg'),
    path.join(legacyPublicDir, 'logo.jpeg'),
    path.join(legacyPublicDir, 'logo.svg'),
    path.join(legacyPublicDir, 'logo.png.png'),
    path.join(legacyPublicDir, 'logo.png.PNG'),
    path.join(legacyPublicDir, 'logo.jpeg.jpeg'),
    path.join(legacyPublicDir, 'logo.jpg.jpg'),
  ];

  const result = await readFirst(discovered ? [discovered, ...candidates] : candidates);
  if (!result) return new NextResponse(null, { status: 404 });

  const contentType = detectContentType(result.data, result.filePath);
  const contentLength = result.data.byteLength.toString();

  return new NextResponse(result.data, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function HEAD() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const legacyPublicDir = path.join(rootDir, 'brigada-platform', 'public');
  const discovered =
    (await findLogoInDir(publicDir)) ?? (await findLogoInDir(legacyPublicDir));
  const candidates = [
    path.join(publicDir, 'logo.png'),
    path.join(publicDir, 'logo.PNG'),
    path.join(publicDir, 'logo.jpg'),
    path.join(publicDir, 'logo.jpeg'),
    path.join(publicDir, 'logo.svg'),
    path.join(publicDir, 'logo.png.png'),
    path.join(publicDir, 'logo.png.PNG'),
    path.join(publicDir, 'logo.jpeg.jpeg'),
    path.join(publicDir, 'logo.jpg.jpg'),
    path.join(legacyPublicDir, 'logo.png'),
    path.join(legacyPublicDir, 'logo.PNG'),
    path.join(legacyPublicDir, 'logo.jpg'),
    path.join(legacyPublicDir, 'logo.jpeg'),
    path.join(legacyPublicDir, 'logo.svg'),
    path.join(legacyPublicDir, 'logo.png.png'),
    path.join(legacyPublicDir, 'logo.png.PNG'),
    path.join(legacyPublicDir, 'logo.jpeg.jpeg'),
    path.join(legacyPublicDir, 'logo.jpg.jpg'),
  ];

  const result = await readFirst(discovered ? [discovered, ...candidates] : candidates);
  if (!result) return new NextResponse(null, { status: 404 });

  const contentType = detectContentType(result.data, result.filePath);
  const contentLength = result.data.byteLength.toString();

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': contentLength,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
