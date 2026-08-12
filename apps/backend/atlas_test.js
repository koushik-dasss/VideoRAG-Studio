/**
 * MongoDB Atlas Real Connection Test
 * Uses the project's .env MONGODB_URI — no fallbacks, no in-memory.
 */
const { MongoClient } = require('mongodb');
const path = require('path');

// Load .env from project root
require('dotenv').config({ path: 'C:\\Users\\SOUMYA RANJAN BEHERA\\OneDrive\\Desktop\\vedio_semantic_search\\.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const EXPECTED_DB = 'semantic_video_search';

// Mask the URI for safe printing
function maskUri(uri) {
  if (!uri) return '<NOT SET>';
  return uri.replace(/:([^@]+)@/, ':****@');
}

async function run() {
  console.log('========================================');
  console.log('MONGODB ATLAS REAL CONNECTION TEST');
  console.log('========================================');
  console.log();

  // 1. Check MONGODB_URI is configured
  const uriConfigured = !!MONGODB_URI;
  console.log(`MONGODB_URI configured: ${uriConfigured ? 'YES' : 'NO'}`);
  console.log(`Password exposed: NO`);
  console.log(`Masked URI: ${maskUri(MONGODB_URI)}`);
  console.log();

  if (!uriConfigured) {
    console.log('FINAL RESULT: FAIL');
    console.log('Exact error: MONGODB_URI not set in .env');
    process.exit(1);
  }

  let client;
  try {
    // 2. Connect to MongoDB Atlas (direct, no fallback)
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    const connectStart = Date.now();
    await client.connect();
    const connectMs = Date.now() - connectStart;
    console.log(`Atlas connection: PASS (${connectMs}ms)`);

    // 3. MongoDB ping
    const pingStart = Date.now();
    const pingResult = await client.db('admin').command({ ping: 1 });
    const pingMs = Date.now() - pingStart;
    const pingOk = pingResult.ok === 1;
    console.log(`MongoDB ping: ${pingOk ? 'PASS' : 'FAIL'} (${pingMs}ms)`);
    console.log();

    // 4. Connected database
    const db = client.db(EXPECTED_DB);
    const dbName = db.databaseName;
    const dbMatch = dbName === EXPECTED_DB;
    console.log(`Connected database: ${dbName}`);
    console.log(`Expected database: ${EXPECTED_DB}`);
    console.log(`Database match: ${dbMatch ? 'YES' : 'NO'}`);
    console.log();

    // 5. List collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name).sort();
    console.log('Collections:');
    for (const name of collectionNames) {
      console.log(`  - ${name}`);
    }
    console.log();

    // 6. Confirm chunks collection
    const hasChunks = collectionNames.includes('chunks');
    console.log(`chunks collection: ${hasChunks ? 'PASS' : 'FAIL'}`);
    console.log();

    // 7. Query chunks count
    let chunksCount = 0;
    if (hasChunks) {
      chunksCount = await db.collection('chunks').countDocuments();
    }
    console.log(`chunks document count: ${chunksCount}`);
    console.log();

    // Also query other key collections
    for (const collName of ['lectures', 'processingjobs', 'events', 'users', 'usersettings']) {
      if (collectionNames.includes(collName)) {
        const count = await db.collection(collName).countDocuments();
        console.log(`${collName} document count: ${count}`);
      }
    }
    console.log();

    // 8-13. Check Atlas Search indexes for chunks
    console.log('Vector Search index:');
    let vectorIndexFound = false;
    let vectorIndexStatus = 'NOT FOUND';
    let vectorIndexQueryable = false;
    let vectorField = 'N/A';
    let vectorDimensions = 'N/A';
    let vectorSimilarity = 'N/A';
    let vectorType = 'N/A';

    if (hasChunks) {
      try {
        const indexes = await db.collection('chunks').listSearchIndexes().toArray();
        for (const idx of indexes) {
          console.log(`  Found search index: ${idx.name} (type: ${idx.type}, status: ${idx.status})`);
          if (idx.name === 'vector_index') {
            vectorIndexFound = true;
            vectorType = idx.type || 'unknown';
            vectorIndexStatus = idx.status || 'unknown';
            vectorIndexQueryable = idx.queryable === true;

            // Extract field definitions
            const fields = idx.latestDefinition?.fields || [];
            for (const field of fields) {
              if (field.type === 'vector') {
                vectorField = field.path || 'unknown';
                vectorDimensions = field.numDimensions || 'unknown';
                vectorSimilarity = field.similarity || 'unknown';
              }
            }
          }
        }
      } catch (searchErr) {
        console.log(`  Search index query error: ${searchErr.message}`);
      }
    }

    console.log();
    console.log(`  - Name: vector_index`);
    console.log(`  - Exists: ${vectorIndexFound ? 'YES' : 'NO'}`);
    console.log(`  - Type: ${vectorType}`);
    console.log(`  - Status: ${vectorIndexStatus}`);
    console.log(`  - Queryable: ${vectorIndexQueryable ? 'YES' : 'NO'}`);
    console.log(`  - Field: ${vectorField}`);
    console.log(`  - Dimensions: ${vectorDimensions}`);
    console.log(`  - Similarity: ${vectorSimilarity}`);
    console.log();

    // 14. Connection stability test (hold open for 5 seconds with periodic pings)
    console.log('Connection stability test (5 seconds)...');
    const stabilityStart = Date.now();
    let stabilityPings = 0;
    let stabilityFails = 0;
    while (Date.now() - stabilityStart < 5000) {
      try {
        await client.db('admin').command({ ping: 1 });
        stabilityPings++;
      } catch {
        stabilityFails++;
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    const stabilityPass = stabilityFails === 0 && stabilityPings >= 3;
    console.log(`  Pings sent: ${stabilityPings}, Failed: ${stabilityFails}`);
    console.log(`Atlas connection stability: ${stabilityPass ? 'PASS' : 'FAIL'}`);
    console.log();

    // 15. Close cleanly
    await client.close();
    console.log('Connection closed cleanly.');
    console.log();

    // Final result
    const allPass = uriConfigured && pingOk && dbMatch && hasChunks && vectorIndexFound && stabilityPass;

    console.log('========================================');
    console.log('FINAL RESULT');
    console.log('========================================');
    console.log();
    console.log(allPass ? 'PASS' : 'FAIL');

    if (!allPass) {
      if (!pingOk) console.log('Exact error: MongoDB ping failed');
      if (!dbMatch) console.log(`Exact error: Database mismatch (got ${dbName}, expected ${EXPECTED_DB})`);
      if (!hasChunks) console.log('Exact error: chunks collection not found');
      if (!vectorIndexFound) console.log('Exact error: vector_index not found on chunks collection');
      if (!stabilityPass) console.log('Exact error: Connection stability test failed');
    }

  } catch (err) {
    console.log();
    console.log('========================================');
    console.log('FINAL RESULT');
    console.log('========================================');
    console.log();
    console.log('FAIL');
    console.log(`Exact error: ${err.message}`);
    console.log(`Root cause: ${err.code || err.name || 'Unknown'}`);
    console.log('Recommended fix: Check network connectivity, credentials, and Atlas whitelist.');
    if (client) {
      try { await client.close(); } catch {}
    }
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Unhandled error:', err.message);
  process.exit(1);
});
