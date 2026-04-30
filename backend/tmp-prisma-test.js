const prisma = require('./src/lib/prisma');

async function main() {
  try {
    console.log('PRISMA MODELS:', Object.keys(prisma));
    const categories = await prisma.category.findMany({ take: 1 });
    console.log('OK', categories);
  } catch (error) {
    console.error('ERROR', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
