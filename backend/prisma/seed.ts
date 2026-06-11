import { PrismaClient, Category, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const notes = [
    {
      url: 'https://example.com/tech-note',
      userInput: 'Save this article about building reliable AI workflows.',
      aiTitle: 'Reliable AI Workflows',
      aiSummary: 'A short reference note about designing dependable AI-assisted systems.',
      aiBullets: [
        'Keep background work non-blocking.',
        'Use explicit contracts between frontend and backend.',
        'Validate data at API boundaries.',
      ],
      category: Category.TECH,
      status: Status.COMPLETED,
    },
    {
      url: null,
      userInput: 'Remember to compare Supabase direct connections with pooler URLs for production.',
      aiTitle: 'Supabase Connection Notes',
      aiSummary: 'Use direct database URLs for migrations and consider pooler URLs for runtime deployments.',
      aiBullets: [
        'Direct URLs are simplest for local Prisma migrate.',
        'Pooler URLs are useful for serverless or high-connection environments.',
      ],
      category: Category.LEARNING,
      status: Status.COMPLETED,
    },
    {
      url: null,
      userInput: 'Draft quarterly budget review and categorize recurring tools.',
      aiTitle: 'Quarterly Budget Review',
      aiSummary: 'A finance task for reviewing recurring subscriptions and tool costs.',
      aiBullets: ['List recurring tools.', 'Flag unused subscriptions.', 'Estimate next quarter spend.'],
      category: Category.FINANCE,
      status: Status.COMPLETED,
    },
  ];

  await prisma.note.deleteMany();

  for (const note of notes) {
    await prisma.note.create({ data: note });
  }

  console.log(`Seeded ${notes.length} notes.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
