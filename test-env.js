import fs from 'node:fs'
import { config } from 'dotenv'

// Load environment variables
config()

console.log('PII_PATH from env:', process.env.PII_PATH)
console.log('Current working directory:', process.cwd())
console.log('.env file exists:', fs.existsSync('.env'))

if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8')
  console.log('.env contents:')
  console.log(envContent)
}
