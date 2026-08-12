import { parentPort, workerData } from 'worker_threads';
import { FasterWhisperSpeechProvider } from '../providers/speech/faster-whisper.speech.provider';
import { getConfig } from '../config';

async function run() {
  const { audioPath, language } = workerData;
  try {
    const config = getConfig();
    const provider = new FasterWhisperSpeechProvider(config);
    const result = await provider.transcribe(audioPath, language);
    parentPort?.postMessage({ success: true, result });
  } catch (error) {
    parentPort?.postMessage({ success: false, error: String(error) });
  }
}
run();
