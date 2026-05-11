import 'dotenv/config'

const payload = {
  proModelId: '1d369e36-337a-4689-a0dc-2aa53136aa7d',
  conModelId: 'dff491cf-92ca-43bf-8c74-cf4fb86d6400',
  topicSelection: 'random',
  totalRounds: 1,
  wordLimitPerTurn: 500,
  factCheckMode: 'standard' // Changed from 'off' to 'standard'
}

fetch('http://localhost:3000/api/debate/run', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
})
  .then(res => res.json())
  .then(data => {
    console.log('Response:', JSON.stringify(data, null, 2))
    if (data.debate?.id) {
      console.log('\nDebate ID:', data.debate.id)
      console.log('\nTo test execution, run:')
      console.log(`npx tsx scripts/test-debate-execution.ts ${data.debate.id}`)
    }
  })
  .catch(err => {
    console.error('Error:', err)
  })
