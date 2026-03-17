import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Brigada Ambiental API',
    version: '1.0.0',
    status: 'online',
  });
}