import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { Buffer } from 'buffer';


// usage e.g:

// (async () => {
//     const capi = new CloudinaryAPI(
//         'cloud_name',
//         'api_key',
//         'api_secret'
//     );

//     await capi.uploadVideo('sample-vid',
//         '/path/to/video/sample.mp4'); // also supports https urls

//     if (await capi.videoExists('sample-vid')) {
//         let audiourl = await capi.getAudioURL('sample-vid');
//         console.log("url:", audiourl);
//         const dst = '/path/to/audio/extracted_audio.mp3';
//         await capi.downloadFile(audiourl, dst);
//     } else {
//         console.log("video doesn't exist");
//     }
// })();

// See above for example
export class CloudinaryAPI {
    constructor(cloud_name, api_key, api_secret) {
        this.clname = cloud_name;
        this.apik = api_key;
        this.apis = api_secret;

        cloudinary.config({
            cloud_name: this.clname,
            api_key: this.apik,
            api_secret: this.apis
        });
    }

    async uploadVideo(videoId, videoUrl) {
        const uploadResult = await cloudinary.uploader
            .upload(videoUrl, {
                public_id: videoId,
                resource_type: 'video',
            })
            .catch((error) => {
                console.log(error);
                throw error;
            });
        console.log(`uploaded ${videoId}`);
        return uploadResult;
    }

    async searchVideoId(videoId) {
        try {
            const result = await cloudinary.search
                .expression(`resource_type:video AND public_id:${videoId}`)
                .execute();
            return result.resources;
        } catch (error) {
            console.error("search failed:", error);
            return [];
        }
    }

    async videoExists(videoId) {
        const resources = await this.searchVideoId(videoId);
        return resources.length > 0;
    }

    async getAudioURL(videoId) {
        const audioOnlyUrl = cloudinary.url(videoId, {
            resource_type: 'video',
            format: 'mp3'
        });
        return audioOnlyUrl;
    }

    async downloadFile(url, outputFilePath) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`failed to fetch: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            fs.writeFileSync(outputFilePath, buffer);
            console.log(`successfully downloaded to: ${outputFilePath}`);
        } catch (error) {
            console.error("download failed:", error);
            throw error;
        }
    }
}
