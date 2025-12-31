import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAGS = [
  "Haushalt",
  "Wohnung",
  "Fahrzeuge",
  "Finanzen",
  "Termine",
  "Gesundheit & Familie",
  "IT & Orga"
];

async function main() {
  for (const name of TAGS) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
