import { put, del } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
  }

  const urls: string[] = [];

  for (const file of files) {
    const blob = await put(`iphones/${Date.now()}-${file.name}`, file, {
      access: 'public',
    });
    urls.push(blob.url);
  }

  return NextResponse.json({ urls });
}

export async function DELETE(req: NextRequest) {
  const { url } = await req.json();

  if (url) {
    await del(url);
  }

  return NextResponse.json({ deleted: true });
}
