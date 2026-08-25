import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany({ where: { name: 'Test Category' } });
  await prisma.invoiceSequence.update({
    where: { id: 1 },
    data: { lastValue: 0 },
  });

  const products = await prisma.product.count();
  const sales = await prisma.sale.count();
  const categories = await prisma.category.count();
  console.log(JSON.stringify({ products, sales, categories }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
