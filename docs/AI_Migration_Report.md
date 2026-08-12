# AI Migration Report

## Overview
This document summarizes the migration of the application's AI architecture away from OpenAI.

## Original Architecture
*   **Speech Recognition:** OpenAI Whisper API (remote).
*   **Embeddings:** OpenAI Embeddings API (`text-embedding-3-small`) (remote).
*   **LLM:** OpenAI (`gpt-4o`) alongside Gemini.

## New Architecture
*   **Speech Recognition:** Local Whisper model execution using `@xenova/transformers` (Faster-Whisper local).
*   **Embeddings:** Local Embedding model execution (`Xenova/nomic-embed-text-v1.5`) via `@xenova/transformers`.
*   **LLM:** Google Gemini API (`gemini-2.5-pro` / `gemini-1.5-pro`).

## Technical Changes
1.  **Removed Packages:** Uninstalled `openai` SDK to eliminate remote dependency for transcriptions and embeddings.
2.  **Installed Packages:** Added `@xenova/transformers` for local model execution in Node.js.
3.  **Provider Refactoring:** 
    *   Replaced `OpenAILLMProvider` entirely.
    *   Implemented `FasterWhisperSpeechProvider` to execute `Xenova/whisper-base` locally.
    *   Implemented `LocalEmbeddingProvider` to generate vectors using `nomic-embed-text-v1.5` locally.
4.  **Factory Refactoring:** Updated `provider.factory.ts` to instantiate local and Gemini providers. Removed all `openai` cases.

## Results
*   **Cost Reduction:** Speech transcription and embedding generation are now 100% free and run locally without API limits.
*   **Clean Architecture:** Kept the application's Strategy/Factory patterns fully intact. Modifying the backend logic did not break the `BullMQ` orchestrator or `MongoDB` dependencies.
