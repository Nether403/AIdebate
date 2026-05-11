import 'dotenv/config'
import { db } from '@/lib/db/client'
import { models } from '@/lib/db/schema'

async function main() {
  const allModels = await db.select().from(models)
  console.log('Models in database:')
  console.log(JSON.stringify(allModels, null, 2))
  process.exit(0)
}

main()
