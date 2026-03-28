import prisma from './src/lib/prisma';

async function main() {
  try {
    console.log('🔄 Testing connection to Supabase...');
    const userCount = await prisma.user.count();
    console.log(`✅ Success! Connected to Supabase. Found ${userCount} users in the database.`);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
