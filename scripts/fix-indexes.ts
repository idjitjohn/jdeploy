#!/usr/bin/env node

import 'dotenv/config'
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/webhook-deployer'

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✓ Connected\n')

    const collections = ['users', 'repositories', 'domains', 'templates', 'deploymentlogs']

    for (const collectionName of collections) {
      try {
        const collection = mongoose.connection.collection(collectionName)
        const indexes = await collection.getIndexes()

        console.log(`📋 ${collectionName} indexes:`)
        const nameIndexes = Object.entries(indexes).filter(([key]) => {
          return key.includes('name') && key !== '_id_'
        })

        if (nameIndexes.length > 1) {
          console.log(`  ⚠️  Found ${nameIndexes.length} name indexes`)
          for (let i = 1; i < nameIndexes.length; i++) {
            const indexName = nameIndexes[i][0]
            try {
              await collection.dropIndex(indexName)
              console.log(`  ✅ Dropped: ${indexName}`)
            } catch (e) {
              console.log(`  ℹ️  Could not drop ${indexName}`)
            }
          }
        } else if (nameIndexes.length === 1) {
          console.log(`  ✓ Single name index: ${nameIndexes[0][0]}`)
        } else {
          console.log(`  ✓ No name indexes`)
        }
      } catch (e) {
        console.log(`ℹ️  Collection ${collectionName} doesn't exist yet`)
      }
    }

    console.log('\n✅ Index check completed')
    await mongoose.disconnect()
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

fixIndexes()
