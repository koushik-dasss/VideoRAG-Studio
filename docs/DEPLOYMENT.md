# 🚀 Production Deployment Specification Guide

This document outlines the infrastructure requirements, environmental dependencies, and operational considerations for deploying **VideoRAG Studio** to a production cloud environment.

---

## 1. Required Infrastructure & External Services

| Subsystem | Requirement | Recommendation |
| :--- | :--- | :--- |
| **Database** | MongoDB Atlas (Cluster tier M10 or higher) | Enforce TLS 1.3, Atlas Vector Search enabled (`vector_index`) |
| **Task Queue & Cache** | Managed Redis Server | AWS ElastiCache / Redis Enterprise / Upstash Redis |
| **LLM Intelligence** | Google Gemini API Key | Production key with paid quota on Gemini 3.5 Flash |
| **Vector Embeddings** | Ollama / Dedicated Embedding Server | Dedicated Ollama container serving `nomic-embed-text` (768-dim) |
| **Media Processing** | FFmpeg & FFprobe | Installed in container image (`apt-get install ffmpeg`) |
| **Speech Worker** | GPU Worker Node | NVIDIA GPU worker (T4, V100, or A10G) for Faster-Whisper |
| **Object Storage** | Cloud Storage Bucket | AWS S3 or Google Cloud Storage (replaces local disk uploads) |

---

## 2. Environment Variables Matrix

| Variable Name | Required | Description | Production Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `PORT` | Yes | HTTP API server port | `3000` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection URI | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `REDIS_URL` | Yes | Managed Redis connection string | `redis://user:pass@redis-host:6379` |
| `GEMINI_API_KEY` | Yes | Production Google Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Yes | Gemini LLM Model name | `gemini-3.5-flash` |
| `OLLAMA_BASE_URL` | Yes | URL of Ollama embedding service | `http://ollama-service:11434` |
| `OLLAMA_EMBEDDING_MODEL` | Yes | Embedding model identifier | `nomic-embed-text` |
| `SPEECH_PROVIDER` | Yes | Speech-to-text provider | `faster-whisper` |
| `JWT_SECRET` | Yes | Secret key for auth tokens | `<random-64-char-hex>` |
| `COOKIE_SECRET` | Yes | Secret key for session cookies | `<random-64-char-hex>` |

---

## 3. Storage Architecture Note

In local development, uploaded videos are saved to `apps/backend/uploads/videos/`.
For production deployments across containerized cloud environments (e.g. AWS ECS, GCP Cloud Run, or Kubernetes):
* Ephemeral local filesystems will reset upon container restart.
* **Production Requirement**: Implement a persistent Object Storage adapter (such as AWS S3 or Google Cloud Storage) to store raw video files, generated audio WAV files, and video thumbnails.

---

## 4. GPU Acceleration & Background Worker Scaling

* The speech transcription engine utilizes Faster-Whisper ONNX runtime pipelines.
* Worker threads should be deployed on container instances equipped with NVIDIA GPUs (CUDA 12+).
* BullMQ queue workers can be scaled horizontally independently of the Express API HTTP instances.
