# Environment Variable Report

## Overview
This report lists the changes made to `.env` and `.env.example` following the removal of OpenAI and integration of local models.

## Changes Made
1.  **Deleted Variables:**
    *   `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`, `OPENAI_MAX_TOKENS`, `OPENAI_TEMPERATURE`, `OPENAI_TIMEOUT_MS`
    *   `WHISPER_PROVIDER`, `WHISPER_MODEL`
    *   `AI_PROVIDER` (Deprecated monolithic provider).
2.  **Updated Variables (Provider Routing):**
    *   `LLM_PROVIDER=gemini`
    *   `SPEECH_PROVIDER=faster-whisper`
    *   `EMBEDDING_PROVIDER=local`
3.  **Added Variables (Local Models):**
    *   `FASTER_WHISPER_MODEL=Xenova/whisper-base`
    *   `LOCAL_EMBEDDING_MODEL=Xenova/nomic-embed-text-v1.5`

## Validation Checks
*   `Joi` schemas in `config/index.ts` and `validators/index.ts` have been updated to remove OpenAI defaults and correctly handle `gemini` and `faster-whisper` validation states.
