import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { id: 'user-a', companyName: 'User A Company' },
    { id: 'user-b', companyName: 'User B Company' },
    { id: 'user-c', companyName: 'User C Company' },
    { id: 'user-d', companyName: 'User D Company' },
    { id: 'user-e', companyName: 'User E Company' },
  ]

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { companyName: user.companyName },
      create: user,
    })
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
