const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSliders() {
  try {
    const sliders = await prisma.slider.findMany();
    console.log(JSON.stringify(sliders, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSliders();
