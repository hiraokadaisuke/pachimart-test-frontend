import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { id: 'user-a', companyName: 'Company A', contactName: 'Alice' },
    { id: 'user-b', companyName: 'Company B', contactName: 'Bob' },
    { id: 'user-c', companyName: 'Company C', contactName: 'Carol' },
    { id: 'user-d', companyName: 'Company D', contactName: 'Dave' },
    { id: 'user-e', companyName: 'Company E', contactName: 'Eve' }
  ]

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    )
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
