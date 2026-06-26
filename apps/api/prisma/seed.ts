import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedSports } from './seed-sports';
import { seedAllowedEmails } from './seed-allowed-emails';
import { seedAtleticas } from './seed-atleticas';
import { seedInter } from './seed-inter';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.adminUser.upsert({
    where: { email: 'admin@interunesp.local' },
    update: {},
    create: {
      email: 'admin@interunesp.local',
      passwordHash,
      name: 'Admin Inter',
      role: 'admin',
    },
  });

  const venueForCo = await prisma.venue.upsert({
    where: { id: 'seed-venue-ginasio' },
    update: {},
    create: {
      id: 'seed-venue-ginasio',
      name: 'Ginásio Municipal',
      address: 'Av. Principal, 100 - Centro',
      mapUrl: 'https://maps.google.com',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'copraca@interunesp.local' },
    update: {},
    create: {
      email: 'copraca@interunesp.local',
      passwordHash,
      name: 'C.O. Praça — Ginásio',
      role: 'venue_coordinator',
      venueId: venueForCo.id,
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'neutro@interunesp.local' },
    update: {},
    create: {
      email: 'neutro@interunesp.local',
      passwordHash,
      name: 'Neutro — Ginásio',
      role: 'neutral',
    },
  });

  await prisma.adminUser.upsert({
    where: { email: 'mesa@interunesp.local' },
    update: {},
    create: {
      email: 'mesa@interunesp.local',
      passwordHash,
      name: 'Mesa da Lieu',
      role: 'mesa_lieu',
    },
  });

  await seedAtleticas(prisma);
  await seedInter(prisma);
  await seedSports(prisma);
  await seedAllowedEmails(prisma);

  const futsal = await prisma.modalidade.findUniqueOrThrow({
    where: { slug: 'futsal-masculino' },
  });

  const venue = venueForCo;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  await prisma.match.upsert({
    where: { id: 'seed-match-1' },
    update: { status: 'scheduled' },
    create: {
      id: 'seed-match-1',
      modalidadeId: futsal.id,
      venueId: venue.id,
      homeTeam: 'Bauru',
      awayTeam: 'Rio Claro',
      homeScore: 2,
      awayScore: 1,
      scheduledAt: tomorrow,
      status: 'scheduled',
      bracketRound: 'Grupos',
    },
  });

  const location = await prisma.location.upsert({
    where: { id: 'seed-location-festa' },
    update: {},
    create: {
      id: 'seed-location-festa',
      name: 'Parque de Exposições',
      address: 'Rod. Inter, km 5',
    },
  });

  const festival = await prisma.festival.upsert({
    where: { id: 'seed-festival' },
    update: {
      address: location.address,
      locationId: location.id,
    },
    create: {
      id: 'seed-festival',
      name: 'Interunesp',
      address: location.address,
      locationId: location.id,
    },
  });

  const base = new Date();
  base.setHours(18, 0, 0, 0);
  const dayTitles = ['Abertura', 'Noite principal', 'Encerramento'];
  const headliners = ['DJ Campus', 'Banda UNESP', 'DJ Fechamento'];

  for (let i = 0; i < 3; i++) {
    const startsAt = new Date(base);
    startsAt.setDate(startsAt.getDate() + i);
    const endsAt = new Date(startsAt.getTime() + 12 * 60 * 60 * 1000);
    const dayId = `seed-festival-day-${i + 1}`;

    const day = await prisma.festivalDay.upsert({
      where: { id: dayId },
      update: {
        title: dayTitles[i],
        startsAt,
        endsAt,
      },
      create: {
        id: dayId,
        festivalId: festival.id,
        dayIndex: i + 1,
        title: dayTitles[i],
        startsAt,
        endsAt,
      },
    });

    await prisma.festivalArtist.upsert({
      where: { id: `seed-artist-hl-${i + 1}` },
      update: { name: headliners[i] },
      create: {
        id: `seed-artist-hl-${i + 1}`,
        festivalDayId: day.id,
        name: headliners[i],
        role: 'headliner',
        sortOrder: 0,
      },
    });

    await prisma.festivalArtist.upsert({
      where: { id: `seed-artist-sup-${i + 1}` },
      update: {},
      create: {
        id: `seed-artist-sup-${i + 1}`,
        festivalDayId: day.id,
        name: `Atração ${i + 1}`,
        role: 'supporting',
        sortOrder: 1,
      },
    });
  }

  await prisma.segment.upsert({
    where: { slug: 'general' },
    update: {},
    create: {
      name: 'Geral',
      slug: 'general',
      description: 'Todos com opt-in geral',
    },
  });

  const knowledge = [
    {
      id: 'seed-kb-inter',
      title: 'O que é o Interunesp',
      tags: 'inter,interunesp,geral',
      content:
        'O Interunesp é o maior evento esportivo e cultural universitário do interior de São Paulo. ' +
        'Reúne atléticas de vários campi em competições, festas, tendas e integração.',
    },
    {
      id: 'seed-kb-sos',
      title: 'Ajuda humana (Lieu)',
      tags: 'sos,lieu,ajuda,atendimento',
      content:
        'Use *Ajuda* para perguntas à chaminha (IA). Se precisar de uma pessoa da Lieu, ' +
        'encerre a conversa e toque em *SOS Lieu* para atendimento humano prioritário.',
    },
    {
      id: 'seed-kb-esportes',
      title: 'Esportes e placar',
      tags: 'jogo,placar,esporte,modalidade',
      content:
        'No menu *Esportes* você vê placar ao vivo, próximos jogos, atlética e chaveamento. ' +
        'Os placares são atualizados pela comissão em tempo real durante os jogos.',
    },
    {
      id: 'seed-kb-festas',
      title: 'Festas',
      tags: 'festa,show,lineup,local',
      content:
        'No menu *Festas* há programação dos 3 dias (cerca de 12h cada), headliner por dia, ' +
        'line-up, local e vídeo promocional. Horários podem mudar — confira a agenda atualizada.',
    },
  ];

  for (const article of knowledge) {
    await prisma.knowledgeArticle.upsert({
      where: { id: article.id },
      update: {
        title: article.title,
        content: article.content,
        tags: article.tags,
        active: true,
      },
      create: article,
    });
  }

  console.log(
    'Seed concluído.\n' +
      '  Admin: admin@interunesp.local / admin123\n' +
      '  Mesa Lieu: mesa@interunesp.local / admin123\n' +
      '  C.O. Praça: copraca@interunesp.local / admin123\n' +
      '  Neutro: neutro@interunesp.local / admin123',
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
