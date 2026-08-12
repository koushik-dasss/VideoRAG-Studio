import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

async function checkIndex() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in environment");
    return;
  }
  
  console.log(`Connecting to: ${uri.replace(/:([^:@]{3,})@/, ':***@')}`); // hide password
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected successfully");
    const db = client.db();
    const collection = db.collection('chunks');
    
    // Attempt to list search indexes
    console.log("Listing search indexes for 'chunks' collection...");
    const indexesCursor = collection.listSearchIndexes();
    const indexes = await indexesCursor.toArray();
    
    if (indexes.length === 0) {
      console.log("NO_INDEXES_FOUND");
    } else {
      indexes.forEach(index => {
        console.log(`INDEX_FOUND: ${JSON.stringify(index, null, 2)}`);
      });
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  } finally {
    await client.close();
  }
}

checkIndex().catch(console.error);
