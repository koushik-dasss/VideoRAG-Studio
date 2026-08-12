import { pipeline, env } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Log ONNX Runtime environment
console.log('ONNX Backend:', env.backends.onnx);
console.log('ONNX Wasm:', env.backends.onnx.wasm);

async function checkGPU() {
    console.log('\n--- SYSTEM GPU CHECK ---');
    try {
        const smi = execSync('nvidia-smi --query-gpu=name,memory.total,utilization.gpu,memory.used --format=csv,noheader').toString();
        console.log('NVIDIA-SMI:', smi.trim());
    } catch(e) {
        console.log('nvidia-smi not available');
    }
}

async function testTranscription() {
    await checkGPU();
    console.log('\n--- LOADING MODEL ---');
    
    // We explicitly request webgpu or cuda if possible in ONNX, but xenova defaults to CPU or WebAssembly in Node unless onnxruntime-node is used.
    // Let's see what it does.
    const startTime = Date.now();
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        device: 'gpu' // Let's try gpu
    });
    console.log('Model loaded in', Date.now() - startTime, 'ms');

    // Check what device it actually instantiated
    // The device property on the model might tell us
    // @ts-ignore
    console.log('Model execution providers:', transcriber.model?.session?.executionProviders);

    // Let's use a smaller audio chunk for a quick test so we don't wait 7 minutes
    // Actually, we need to see GPU utilization, so let's run it async and check nvidia-smi in the middle
    console.log('\n--- STARTING TRANSCRIPTION ---');
    const audioPath = path.resolve(__dirname, 'uploads/videos/audio-f2effa9b-afd4-4fbe-80f9-8afbe13b8706.wav');
    
    let isTranscribing = true;
    
    // Poll nvidia-smi every 2 seconds
    const interval = setInterval(() => {
        if (!isTranscribing) {
            clearInterval(interval);
            return;
        }
        try {
            const processes = execSync('nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv,noheader').toString();
            console.log('[POLL] GPU Processes:\n' + (processes.trim() || 'None'));
            const usage = execSync('nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader').toString();
            console.log('[POLL] GPU Usage:', usage.trim());
        } catch(e) {}
    }, 2000);

    const transStart = Date.now();
    try {
        // Just transcribe a piece of it or the whole thing? We will transcribe for up to 30 seconds and see.
        // Actually pipeline reads the whole file. Let's just do it.
        const result = await transcriber(audioPath, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'english',
            task: 'transcribe',
        });
        
        isTranscribing = false;
        const duration = (Date.now() - transStart) / 1000;
        console.log('\n--- RESULT ---');
        console.log('Transcription time:', duration, 'seconds');
        
        // Let's get the file duration
        // We'll estimate from size if it's 16khz 16bit mono
        // Size: 21129122 bytes. 2 bytes per sample, 16000 samples per sec = 32000 bytes/sec
        // duration = 21129122 / 32000 = ~660 seconds (11 minutes)
        const audioDurationSec = 660; 
        console.log('Audio duration:', audioDurationSec, 'seconds');
        console.log('RTF (Real-Time Factor):', (duration / audioDurationSec).toFixed(3));
        
        console.log('GPU ACCELERATION = ' + (duration < 60 ? 'REAL' : 'NOT REAL'));
    } catch(err) {
        isTranscribing = false;
        console.error('Error:', err);
    }
}

testTranscription();
