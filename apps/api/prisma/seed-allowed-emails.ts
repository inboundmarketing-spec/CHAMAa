import { readFileSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '@prisma/client';
import { AdminRole } from '@chama/shared';

type CoPracaEntry =
  | string
  | { email: string; name?: string; venueId?: string | null };

type AllowedEmailsFile = {
  mesa?: string[];
  diretor?: string[];
  co_praca?: CoPracaEntry[];
  neutro?: string[];
  criativa?: string[];
};

function resolvePath(): string {
  if (process.env.ALLOWED_EMAILS_PATH) {
    return process.env.ALLOWED_EMAILS_PATH;
  }
  const candidates = [
    join(process.cwd(), 'config', 'allowed-emails.json'),
    join(process.cwd(), '..', '..', 'config', 'allowed-emails.json'),
  ];
  for (const path of candidates) {
    try {
      readFileSync(path, 'utf-8');
      return path;
    } catch {
      /* tenta próximo */
    }
  }
  return candidates[0]!;
}

function defaultName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseFile(raw: AllowedEmailsFile) {
  const out: {
    email: string;
    name: string;
    role: string;
    venueId: string | null;
  }[] = [];

  for (const email of raw.mesa ?? []) {
    out.push({
      email: email.trim().toLowerCase(),
      name: defaultName(email),
      role: AdminRole.MESA_LIEU,
      venueId: null,
    });
  }

  for (const email of raw.criativa ?? []) {
    out.push({
      email: email.trim().toLowerCase(),
      name: defaultName(email),
      role: AdminRole.CRIATIVA,
      venueId: null,
    });
  }

  for (const email of raw.diretor ?? []) {
    out.push({
      email: email.trim().toLowerCase(),
      name: defaultName(email),
      role: AdminRole.CO_DIRECTOR,
      venueId: null,
    });
  }

  for (const item of raw.co_praca ?? []) {
    if (typeof item === 'string') {
      out.push({
        email: item.trim().toLowerCase(),
        name: defaultName(item),
        role: AdminRole.VENUE_COORDINATOR,
        venueId: null,
      });
    } else {
      out.push({
        email: item.email.trim().toLowerCase(),
        name: item.name?.trim() || defaultName(item.email),
        role: AdminRole.VENUE_COORDINATOR,
        venueId: item.venueId ?? null,
      });
    }
  }

  for (const email of raw.neutro ?? []) {
    out.push({
      email: email.trim().toLowerCase(),
      name: defaultName(email),
      role: AdminRole.NEUTRAL,
      venueId: null,
    });
  }

  return out;
}

export async function seedAllowedEmails(prisma: PrismaClient) {
  const path = resolvePath();
  let raw: AllowedEmailsFile;
  try {
    raw = JSON.parse(readFileSync(path, 'utf-8')) as AllowedEmailsFile;
  } catch {
    console.warn(`seed-allowed-emails: arquivo não encontrado (${path})`);
    return;
  }

  const entries = parseFile(raw);
  for (const entry of entries) {
    await prisma.allowedEmail.upsert({
      where: { email: entry.email },
      update: {
        name: entry.name,
        role: entry.role,
        venueId: entry.venueId,
      },
      create: entry,
    });
  }
}
