import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type MachineStorageLocation = {
  id: string;
  ownerUserId: string;
  name: string;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  addressLine: string | null;
  handlingFeePerUnit: number | null;
  shippingFeesByRegion: Prisma.JsonValue | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

async function tableExists(tableName: string) {
  const result = await prisma.$queryRaw<{ exists: boolean }[]>(
    Prisma.sql`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${tableName}) AS exists;`
  );

  return result[0]?.exists ?? false;
}

async function fetchMachineStorageLocations() {
  return prisma.$queryRaw<MachineStorageLocation[]>(Prisma.sql`
    SELECT id,
           "ownerUserId",
           name,
           "postalCode",
           prefecture,
           city,
           "addressLine",
           "handlingFeePerUnit",
           "shippingFeesByRegion",
           "isActive",
           "createdAt",
           "updatedAt"
    FROM "MachineStorageLocation"
  `);
}

async function findDuplicateStorageLocation(row: MachineStorageLocation) {
  const duplicate = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id
    FROM "StorageLocation"
    WHERE "ownerUserId" = ${row.ownerUserId}
      AND name = ${row.name}
      AND COALESCE("address", '') = COALESCE(${row.addressLine ?? ""}, '')
      AND COALESCE("city", '') = COALESCE(${row.city ?? ""}, '')
      AND COALESCE("prefecture", '') = COALESCE(${row.prefecture ?? ""}, '')
      AND COALESCE("postalCode", '') = COALESCE(${row.postalCode ?? ""}, '')
    LIMIT 1;
  `);

  return duplicate[0]?.id ?? null;
}

async function migrateMachineStorageLocations() {
  const exists = await tableExists("MachineStorageLocation");
  if (!exists) {
    console.log("No MachineStorageLocation table found. Nothing to migrate.");
    return;
  }

  const machineLocations = await fetchMachineStorageLocations();
  if (machineLocations.length === 0) {
    console.log("MachineStorageLocation table is empty. Dropping table.");
    await prisma.$executeRaw(Prisma.sql`DROP TABLE IF EXISTS "MachineStorageLocation";`);
    return;
  }

  console.log(`Migrating ${machineLocations.length} machine storage locations...`);
  for (const location of machineLocations) {
    const duplicateId = await findDuplicateStorageLocation(location);
    const targetId = duplicateId ?? location.id;

    if (duplicateId) {
      await prisma.storageLocation.update({
        where: { id: duplicateId },
        data: {
          name: location.name,
          postalCode: location.postalCode,
          prefecture: location.prefecture,
          city: location.city,
          addressLine: location.addressLine,
          handlingFeePerUnit: location.handlingFeePerUnit,
          shippingFeesByRegion: location.shippingFeesByRegion,
          isActive: location.isActive ?? true,
          updatedAt: location.updatedAt,
        },
      });
    } else {
      await prisma.storageLocation.upsert({
        where: { id: location.id },
        update: {
          name: location.name,
          postalCode: location.postalCode,
          prefecture: location.prefecture,
          city: location.city,
          addressLine: location.addressLine,
          handlingFeePerUnit: location.handlingFeePerUnit,
          shippingFeesByRegion: location.shippingFeesByRegion,
          isActive: location.isActive ?? true,
          updatedAt: location.updatedAt,
        },
        create: {
          id: location.id,
          ownerUserId: location.ownerUserId,
          name: location.name,
          postalCode: location.postalCode,
          prefecture: location.prefecture,
          city: location.city,
          addressLine: location.addressLine,
          handlingFeePerUnit: location.handlingFeePerUnit,
          shippingFeesByRegion: location.shippingFeesByRegion,
          isActive: location.isActive ?? true,
          createdAt: location.createdAt,
          updatedAt: location.updatedAt,
        },
      });
    }

    if (targetId !== location.id) {
      await prisma.listing.updateMany({
        where: { storageLocationId: location.id },
        data: { storageLocationId: targetId },
      });
    }
  }

  await prisma.$executeRaw(Prisma.sql`DROP TABLE IF EXISTS "MachineStorageLocation";`);
  console.log("Migration complete. MachineStorageLocation table dropped.");
}

migrateMachineStorageLocations()
  .catch((error) => {
    console.error("Failed to migrate storage locations", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
