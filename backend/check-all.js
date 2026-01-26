const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAll() {
  try {
    const sliders = await prisma.slider.findMany();
    const videoAds = await prisma.videoAd.findMany();
    console.log('--- SLIDERS ---');
    console.log(JSON.stringify(sliders, null, 2));
    console.log('--- VIDEO ADS ---');
    console.log(JSON.stringify(videoAds, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAll();
