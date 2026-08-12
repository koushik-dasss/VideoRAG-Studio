# 🛠️ Complete Setup Guide — VideoRAG Studio

This guide provides complete instructions to set up, configure, and run **VideoRAG Studio** on your local machine.

---

## 📋 Prerequisites

Ensure you have the following installed on your host system:

* **Node.js**: `v20.0.0` or higher ([Download Node.js](https://nodejs.org/))
* **npm**: `v10.0.0` or higher (comes with Node.js)
* **Docker Desktop**: For running Redis ([Download Docker](https://www.docker.com/))
* **Ollama**: For local vector embeddings ([Download Ollama](https://ollama.com/))
* **FFmpeg & FFprobe**: Installed and added to system `PATH` ([Download FFmpeg](https://ffmpeg.org/))
* **NVIDIA Drivers & CUDA Toolkit**: Required for GPU-accelerated speech transcription (Tested on CUDA 12.7 / RTX 3050).

---

## 📥 1. Repository Setup

```bash
git clone https://github.com/your-username/vedio_semantic_search.git
cd vedio_semantic_search

# Install monorepo dependencies across root, backend, and frontend
npm install
```

---

## ⚙️ 2. Environment Variables Setup

Copy `.env.example` to create your active `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your preferred service settings:

```env
# Server Port
PORT=3000

# MongoDB Atlas Database URI
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/semantic_video_search?appName=VideoRAG-Studio
MONGODB_DB_NAME=semantic_video_search
VECTOR_SEARCH_INDEX_NAME=vector_index

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash

# Ollama Local Embedding Provider
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Redis Queue & Cache Connection
REDIS_URL=redis://localhost:6379
```

---

## 🐳 3. Starting Background Infrastructure Services

### 1. Redis Container
Run Redis 7 in a Docker container on port `6379`:

```bash
docker run -d --name redis-server -p 6379:6379 redis:7-alpine
```

Verify Redis is running:
```bash
docker ps
```

### 2. Ollama Local Embedding Model
Start Ollama service and download `nomic-embed-text`:

```bash
ollama serve
# In a new terminal window:
ollama pull nomic-embed-text
```

---

## 🍃 4. MongoDB Atlas Vector Search Index Setup

1. Log into your [MongoDB Atlas Console](https://cloud.mongodb.com).
2. Open your Cluster -> **Atlas Search / Vector Search** tab.
3. Click **Create Search Index** -> Select **JSON Editor**.
4. Select target Database `semantic_video_search` and Collection `chunks`.
5. Name the index `vector_index`.
6. Paste the following configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "lectureId"
    }
  ]
}
```
7. Click **Create Vector Search Index**.

---

## 🚀 5. Running the Application Services

Start the backend API server (which also boots the BullMQ worker) and the frontend dev server:

```bash
# Terminal 1: Backend & Worker Process
npm --prefix apps/backend run dev

# Terminal 2: Frontend Vite React App
npm --prefix apps/frontend run dev
```

Access the application in your browser:
* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:3000](http://localhost:3000)
