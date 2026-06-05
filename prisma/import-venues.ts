import { PrismaClient } from "@prisma/client";
import { importVenues } from "../src/lib/venues";

const prisma = new PrismaClient();

// Import manuel des lieux (dev). En prod, c'est appelé automatiquement par la synchro.
async function main() {
  const r = await importVenues(prisma);
  console.log(`✓ Lieux importés : ${r.matched}/${r.total}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
