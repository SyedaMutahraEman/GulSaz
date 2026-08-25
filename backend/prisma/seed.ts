import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  'Abayas',
  'Formal',
  'Casual Wear',
  'Stoles & Hijabs',
  'Co-ords & Sets',
  'Festive Pret',
  'Accessories',
];

async function main() {
  console.log('Seeding database (categories + store settings only)...');

  for (const name of CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: { isActive: true },
      create: {
        name,
        description: `${name} collection`,
        isActive: true,
      },
    });
  }

  const existingSettings = await prisma.storeSettings.findFirst();
  if (!existingSettings) {
    await prisma.storeSettings.create({
      data: {
        brandName: 'GUL SAZ',
        tagline: 'Elegance Woven For You • ہر دھاگہ ایک کہانی',
        address: 'Fashion Square, Paris Road, Sialkot, Pakistan',
        phone: '+92 300 1234567',
        email: 'care@gulsaz.official',
        currencySymbol: 'Rs.',
        currencyCode: 'PKR',
        taxRatePercent: 0,
        receiptFooterMessage:
          'Thank you for choosing GUL SAZ! Elegance Woven For You. Exchange valid within 14 days with original barcode tag & receipt.',
      },
    });
  }

  await prisma.invoiceSequence.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastValue: 0 },
  });

  console.log('Seed complete:');
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log('  No demo users — create an account from the login screen.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
