import { PrismaClient, Status } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultCategories = [
    { name: 'Cooking', key: 'cooking', emoji: '🍳', isDefault: true },
    { name: 'Tech', key: 'tech', emoji: '💻', isDefault: true },
    { name: 'Learning', key: 'learning', emoji: '📚', isDefault: true },
    { name: 'Work', key: 'work', emoji: '💼', isDefault: true },
    { name: 'Finance', key: 'finance', emoji: '💰', isDefault: true },
    { name: 'Other', key: 'other', emoji: '📝', isDefault: true },
  ];

  const categoryMap: Record<string, string> = {};

  for (const cat of defaultCategories) {
    let existing = await prisma.category.findFirst({
      where: { name: cat.name, isDefault: true },
    });
    if (!existing) {
      existing = await prisma.category.create({
        data: cat,
      });
    }
    categoryMap[cat.name] = existing.id;
  }

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
      categoryId: categoryMap['Tech'],
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
      categoryId: categoryMap['Learning'],
      status: Status.COMPLETED,
    },
    {
      url: null,
      userInput: 'Draft quarterly budget review and categorize recurring tools.',
      aiTitle: 'Quarterly Budget Review',
      aiSummary: 'A finance task for reviewing recurring subscriptions and tool costs.',
      aiBullets: ['List recurring tools.', 'Flag unused subscriptions.', 'Estimate next quarter spend.'],
      categoryId: categoryMap['Finance'],
      status: Status.COMPLETED,
    },
  ];

  await prisma.note.deleteMany();

  for (const note of notes) {
    await prisma.note.create({ data: note });
  }

  console.log(`Seeded ${notes.length} notes and ${defaultCategories.length} categories.`);
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
