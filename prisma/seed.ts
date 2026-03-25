import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Scenario configuration
const scenarios = {
  small: { users: 50, posts: 100 },
  large: { users: 500, posts: 2000 },
  'perf-test': { users: 5000, posts: 20000 },
};

// Parse scenario from CLI arguments
const scenario =
  process.argv.find((arg) => arg.startsWith('--scenario='))?.split('=')[1] ||
  'small';

const config = scenarios[scenario as keyof typeof scenarios] || scenarios.small;

async function main() {
  console.log(`Seeding scenario: ${scenario}`);
  console.log(`Users: ${config.users}, Posts: ${config.posts}`);

  try {
    // Clean up existing data before seeding (avoid foreign key issues)
    console.log('Cleaning up existing data...');
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
    console.log('Existing data cleaned up.');

    // Generate users with realistic data using faker
    console.log(`Generating ${config.users} users...`);
    const users = [];
    const usedEmails = new Set<string>();

    for (let i = 0; i < config.users; i++) {
      let email: string;
      do {
        email = faker.internet.email();
      } while (usedEmails.has(email));
      usedEmails.add(email);

      users.push({
        name: faker.person.fullName(),
        email: email,
        avatar: faker.image.avatar(),
        createdAt: faker.date.past(),
      });
    }

    // Bulk insert users for performance
    console.log('Inserting users...');
    await prisma.user.createMany({
      data: users,
    });

    // Fetch the created users to get their IDs
    const createdUsers = await prisma.user.findMany({
      select: { id: true },
    });

    // Generate posts with realistic data
    console.log(`Generating ${config.posts} posts...`);
    const posts = [];
    for (let i = 0; i < config.posts; i++) {
      const randomUser = faker.helpers.arrayElement(createdUsers);
      posts.push({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(2),
        published: faker.datatype.boolean(),
        createdAt: faker.date.recent(),
        userId: randomUser.id,
      });
    }

    // Bulk insert posts for performance
    console.log('Inserting posts...');
    await prisma.post.createMany({
      data: posts,
    });

    // Verify the data was created
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();

    console.log('Seeding completed successfully!');
    console.log(`Total users: ${userCount}`);
    console.log(`Total posts: ${postCount}`);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    // Ensure prisma disconnects
    await prisma.$disconnect();
  }
}

main()
  .then(async () => {
    console.log('Seed script finished.');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });