import os
import sys
import time
import subprocess
import threading

# Inject NVIDIA library paths for Windows
try:
    nvidia_base = os.path.join(os.path.dirname(sys.executable), "Lib", "site-packages", "nvidia")
    cudnn_path = os.path.join(nvidia_base, "cudnn", "bin")
    cublas_path = os.path.join(nvidia_base, "cublas", "bin")

    if os.path.exists(cudnn_path):
        os.add_dll_directory(cudnn_path)
    if os.path.exists(cublas_path):
        os.add_dll_directory(cublas_path)

    os.environ["PATH"] = cudnn_path + os.pathsep + cublas_path + os.pathsep + os.environ.get("PATH", "")
except Exception as e:
    print(f"Warning setting DLL path: {e}")

from faster_whisper import WhisperModel

# Path to audio file
audio_path = os.path.join(os.path.dirname(__file__), "uploads", "videos", "audio-f2effa9b-afd4-4fbe-80f9-8afbe13b8706.wav")

def poll_gpu():
    is_running = True
    def run_poll():
        while is_running:
            try:
                # Poll processes
                res = subprocess.run(
                    ['nvidia-smi', '--query-compute-apps=pid,process_name,used_memory', '--format=csv,noheader'],
                    capture_output=True, text=True
                )
                print(f"[POLL] GPU Processes:\n{res.stdout.strip()}")
                
                # Poll utilization
                res2 = subprocess.run(
                    ['nvidia-smi', '--query-gpu=utilization.gpu,memory.used', '--format=csv,noheader'],
                    capture_output=True, text=True
                )
                print(f"[POLL] GPU Usage: {res2.stdout.strip()}")
            except Exception as e:
                pass
            time.sleep(2)
    t = threading.Thread(target=run_poll)
    t.daemon = True
    t.start()
    return lambda: setattr(poll_gpu, 'is_running', False) # simple way to stop, but daemon thread dies with main

print("Loading model on GPU...")
start_load = time.time()
model_size = "base"

# Run on GPU with FP16
model = WhisperModel(model_size, device="cuda", compute_type="float16")
print(f"Model loaded in {time.time() - start_load:.2f} seconds")

print("Starting transcription...")
# Start GPU polling
poll_gpu()

start_transcribe = time.time()
segments, info = model.transcribe(audio_path, beam_size=5, language="en")

# Force evaluation of the generator to actually transcribe
segment_list = list(segments)
transcribe_time = time.time() - start_transcribe

print("\n--- RESULT ---")
print(f"Transcription time: {transcribe_time:.2f} seconds")
print(f"Audio duration: {info.duration:.2f} seconds")
print(f"Language: {info.language} with probability {info.language_probability:.2f}")
print(f"RTF (Real-Time Factor): {(transcribe_time / info.duration):.3f}")

print("GPU ACCELERATION = " + ("REAL" if transcribe_time < 60 else "NOT REAL"))
