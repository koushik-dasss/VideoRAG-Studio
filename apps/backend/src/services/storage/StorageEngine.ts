import type { StorageEngine } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import type { IStorageService } from '../../interfaces/IStorageService';

export class MulterStorageEngine implements StorageEngine {
  constructor(private storageService: IStorageService) {}

  _handleFile(req: Express.Request, file: Express.Multer.File, cb: (error?: unknown, info?: Partial<Express.Multer.File>) => void): void {
    const folder = file.mimetype.startsWith('video') ? 'videos' : 'audio';
    const ext = file.originalname.split('.').pop() ?? '';
    const fileName = `${uuidv4()}.${ext}`;

    this.storageService.uploadStream(file.stream, fileName, folder)
      .then((url) => {
        cb(null, {
          path: url,
          filename: fileName,
          destination: folder,
        });
      })
      .catch((err: unknown) => {
        cb(err as Error | null);
      });
  }

  _removeFile(req: Express.Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    this.storageService.deleteFile(file.filename, file.destination)
      .then(() => cb(null))
      .catch((err: unknown) => cb(err as Error | null));
  }
}
