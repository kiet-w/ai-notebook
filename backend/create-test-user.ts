import { PrismaService } from './src/prisma/prisma.service';
import * as argon2 from 'argon2';

const prisma = new PrismaService();

async function main() {
  const email = 'admin@example.com';
  const username = 'admin';
  const password = 'password123';
  
  const hashedPassword = await argon2.hash(password);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      user: username,
      email: email,
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  console.log('✅ Created test user successfully!');
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
