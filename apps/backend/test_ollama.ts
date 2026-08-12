import { OllamaEmbeddingProvider } from './src/providers/embedding/ollama.embedding.provider';

async function testOllama() {
  const config = {
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'nomic-embed-text'
    }
  } as any;

  const provider = new OllamaEmbeddingProvider(config);
  
  console.log("Checking availability...");
  const isAvailable = await provider.isAvailable();
  console.log(`Available: ${isAvailable}`);

  if (isAvailable) {
    const text = "This is a test of the Ollama embedding system for MongoDB Atlas.";
    console.log(`Embedding text: "${text}"`);
    const start = Date.now();
    try {
      const result = await provider.embed(text);
      const end = Date.now();
      console.log(`Success: true`);
      console.log(`Response Time: ${end - start}ms`);
      console.log(`Dimension: ${result.vector.length}`);
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }
}

testOllama().catch(console.error);
