import { app } from './app.js'
import { migrateLegacyNewsletterSubscribers } from './newsletter-migration.js'
import { migrateFanclubMembers } from './fanclub-member-migration.js'

const port = Number(process.env.PORT) || 3001

await migrateLegacyNewsletterSubscribers()
await migrateFanclubMembers()

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})
