# Provider Configuration Report

## Overview
This report details the updated AI provider configurations utilized by the application after the OpenAI migration.

## 1. LLM Provider (Google Gemini)
*   **Key:** `LLM_PROVIDER=gemini`
*   **Model Options:** `gemini-1.5-pro`, `gemini-2.5-pro`
*   **Purpose:** Summarization, Chapter Generation, and Key-Term Extraction.

## 2. Speech Recognition Provider (Local Faster-Whisper)
*   **Key:** `SPEECH_PROVIDER=faster-whisper`
*   **Model:** `Xenova/whisper-base` (Executed via `@xenova/transformers`)
*   **Purpose:** Accurate word-level transcription and timestamping of video audio.

## 3. Embedding Provider (Local Embedding)
*   **Key:** `EMBEDDING_PROVIDER=local`
*   **Model:** `Xenova/nomic-embed-text-v1.5` (Executed via `@xenova/transformers`)
*   **Vector Size:** 768 dimensions (adjustable based on Nomic models).
*   **Purpose:** Semantic vector generation for semantic chunks of video transcripts.

## 4. Integration
All providers adhere strictly to the internal base interfaces (`ILLMProvider`, `ISpeechRecognitionProvider`, `IEmbeddingProvider`). They are injected dynamically at runtime by the `ProviderFactory` based on configuration constants in `config/index.ts` and `constants/index.ts`.
