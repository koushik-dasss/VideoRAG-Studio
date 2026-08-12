import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';

export interface VideoMetadata {
  duration?: number;
  width?: number;
  height?: number;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  fps?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  container?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export class VideoMetadataService {
  async extractMetadata(filePath: string): Promise<VideoMetadata> {
    const stats = await fs.stat(filePath);
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) return reject(err);

        const format = metadata.format;
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        let fps: number | undefined;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && parseInt(parts[1], 10) !== 0) {
            fps = Math.round(parseInt(parts[0], 10) / parseInt(parts[1], 10));
          }
        }

        const result: VideoMetadata = {
          duration: format.duration,
          width: videoStream?.width,
          height: videoStream?.height,
          resolution: videoStream?.width && videoStream?.height ? `${videoStream.width}x${videoStream.height}` : undefined,
          videoCodec: videoStream?.codec_name,
          audioCodec: audioStream?.codec_name,
          fps,
          bitrate: format.bit_rate ? Number(format.bit_rate) : undefined,
          sampleRate: audioStream?.sample_rate ? Number(audioStream.sample_rate) : undefined,
          channels: audioStream?.channels,
          container: format.format_name,
          sizeBytes: stats.size
        };

        resolve(result);
      });
    });
  }

  async generateThumbnail(videoPath: string, outputDir: string, timestamp: string = '50%'): Promise<string> {
    const filename = `thumb-${path.basename(videoPath, path.extname(videoPath))}.jpg`;
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('end', () => resolve(filename))
        .on('error', (err) => reject(err))
        .screenshots({
          count: 1,
          timestamps: [timestamp],
          folder: outputDir,
          filename: filename,
          size: '640x360'
        });
    });
  }

  async extractAudio(videoPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          '-vn',
          '-acodec pcm_s16le',
          '-ar 16000',
          '-ac 1'
        ])
        .save(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
  }
}
