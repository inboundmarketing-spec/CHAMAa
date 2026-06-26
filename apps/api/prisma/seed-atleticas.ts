import { PrismaClient } from '@prisma/client';
import {
  ATLETICAS,
  ATLETICA_LOGO_FILES,
  type AtleticaName,
} from '@chama/shared';

function slugFromName(name: AtleticaName): string {
  return ATLETICA_LOGO_FILES[name].replace(/\.(png|jpg)$/, '');
}

export async function seedAtleticas(prisma: PrismaClient) {
  for (const name of ATLETICAS) {
    const slug = slugFromName(name);
    const campus = await prisma.campus.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });

    await prisma.atletica.upsert({
      where: { id: `seed-atletica-${slug}` },
      update: {
        name: `Atlética ${name}`,
        campusId: campus.id,
      },
      create: {
        id: `seed-atletica-${slug}`,
        name: `Atlética ${name}`,
        campusId: campus.id,
      },
    });
  }
}
