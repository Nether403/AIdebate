import 'dotenv/config'
import { db } from '@/lib/db/client'
import { debates } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const debateId = process.argv[2]

async function main() {
  const debate = await db.query.debates.findFirst({
    where: eq(debates.id, debateId),
  })
  
  console.log(JSON.stringify(debate, null, 2))
  process.exit(0)
}

main()
