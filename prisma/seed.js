const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@brigada.local' },
    update: { name: 'Admin Brigada', role: 'ADMIN_BRIGADA', passwordHash },
    create: {
      name: 'Admin Brigada',
      email: 'admin@brigada.local',
      role: 'ADMIN_BRIGADA',
      passwordHash,
      region: 'São Paulo (SP)',
    },
  });

  const brigadista = await prisma.user.upsert({
    where: { email: 'brigadista@brigada.local' },
    update: { name: 'Brigadista Demo', role: 'BRIGADISTA', passwordHash },
    create: {
      name: 'Brigadista Demo',
      email: 'brigadista@brigada.local',
      role: 'BRIGADISTA',
      passwordHash,
      region: 'São Paulo (SP)',
    },
  });

  const brigade1 = await prisma.brigade.upsert({
    where: { id: 'seed-brigade-1' },
    update: {
      name: 'Brigada Serra do Mar',
      description: 'Equipe dedicada ao monitoramento e resposta rápida em áreas de risco.',
      region: 'São Paulo (SP)',
      leaderId: admin.id,
    },
    create: {
      id: 'seed-brigade-1',
      name: 'Brigada Serra do Mar',
      description: 'Equipe dedicada ao monitoramento e resposta rápida em áreas de risco.',
      region: 'São Paulo (SP)',
      leaderId: admin.id,
    },
  });

  const brigade2 = await prisma.brigade.upsert({
    where: { id: 'seed-brigade-2' },
    update: {
      name: 'Brigada Mata Atlântica',
      description: 'Ações preventivas, patrulha e educação ambiental em trilhas e parques.',
      region: 'Litoral (SP)',
      leaderId: admin.id,
    },
    create: {
      id: 'seed-brigade-2',
      name: 'Brigada Mata Atlântica',
      description: 'Ações preventivas, patrulha e educação ambiental em trilhas e parques.',
      region: 'Litoral (SP)',
      leaderId: admin.id,
    },
  });

  await prisma.user.update({
    where: { id: brigadista.id },
    data: { brigadeId: brigade1.id },
  });

  await prisma.task.createMany({
    data: [
      {
        type: 'PATRULHA',
        description: 'Patrulhar área norte da reserva',
        latitude: -23.5505,
        longitude: -46.6333,
        brigadeId: brigade1.id,
        userId: brigadista.id,
        status: 'PENDENTE',
        priority: 'ALTA',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'MONITORAMENTO',
        description: 'Monitorar pontos de risco na serra',
        latitude: -23.5605,
        longitude: -46.6433,
        brigadeId: brigade1.id,
        userId: brigadista.id,
        status: 'EM_ANDAMENTO',
        priority: 'MEDIA',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      {
        type: 'PREVENCAO',
        description: 'Vistoria de aceiros e faixas de contenção',
        latitude: -23.5522,
        longitude: -46.6351,
        brigadeId: brigade2.id,
        status: 'PENDENTE',
        priority: 'BAIXA',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    await prisma.$disconnect();
    throw e;
  });

