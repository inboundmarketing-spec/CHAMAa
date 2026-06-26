import { BadRequestException } from '@nestjs/common';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'festas');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);

export function publicMediaUrl(path: string): string {
  const base = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) {
    throw new BadRequestException('PUBLIC_API_URL não configurada');
  }
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function saveFestasUpload(file: Express.Multer.File) {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Arquivo vazio');
  }

  let type: 'image' | 'video';
  if (IMAGE_TYPES.has(file.mimetype)) {
    type = 'image';
  } else if (VIDEO_TYPES.has(file.mimetype)) {
    type = 'video';
  } else {
    throw new BadRequestException(
      'Formato não suportado. Use JPEG, PNG, WebP ou MP4.',
    );
  }

  const maxMb = type === 'video' ? 50 : 8;
  if (file.size > maxMb * 1024 * 1024) {
    throw new BadRequestException(`Arquivo muito grande (máx. ${maxMb} MB)`);
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = extname(file.originalname) || (type === 'video' ? '.mp4' : '.jpg');
  const filename = `${randomUUID()}${ext}`;
  const absolute = join(UPLOAD_DIR, filename);
  await writeFile(absolute, file.buffer);

  const url = `/uploads/festas/${filename}`;
  return { type, url, publicUrl: publicMediaUrl(url) };
}

export async function deleteFestasFileByUrl(url: string) {
  if (!url.startsWith('/uploads/festas/')) return;
  const absolute = join(process.cwd(), url.replace(/^\//, ''));
  try {
    await unlink(absolute);
  } catch {
    /* arquivo já removido */
  }
}
