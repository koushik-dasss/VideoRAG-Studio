import type { IStorageService } from '../../interfaces/IStorageService';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const renameAsync = promisify(fs.rename);

export class LocalStorageService implements IStorageService {
  private baseUploadPath: string;

  constructor(baseUploadPath: string = path.join(process.cwd(), 'uploads')) {
    this.baseUploadPath = baseUploadPath;
  }

  private ensureDirectoryExists(folderPath: string): void {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  async saveFile(fileBuffer: Buffer, fileName: string, folder: string): Promise<string> {
    const folderPath = path.join(this.baseUploadPath, folder);
    this.ensureDirectoryExists(folderPath);
    
    const filePath = path.join(folderPath, fileName);
    await writeFileAsync(filePath, fileBuffer);
    
    // Return relative path or URL
    return `/uploads/${folder}/${fileName}`;
  }

  async moveFile(tempPath: string, fileName: string, folder: string): Promise<string> {
    const folderPath = path.join(this.baseUploadPath, folder);
    this.ensureDirectoryExists(folderPath);
    
    const filePath = path.join(folderPath, fileName);
    await renameAsync(tempPath, filePath);
    
    return `/uploads/${folder}/${fileName}`;
  }

  async uploadStream(fileStream: NodeJS.ReadableStream, fileName: string, folder: string): Promise<string> {
    const folderPath = path.join(this.baseUploadPath, folder);
    this.ensureDirectoryExists(folderPath);
    
    const filePath = path.join(folderPath, fileName);
    const writeStream = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      fileStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', () => {
        resolve(`/uploads/${folder}/${fileName}`);
      });
    });
  }

  getFileUrl(fileName: string, folder: string): string {
    return `/uploads/${folder}/${fileName}`;
  }

  async deleteFile(fileName: string, folder: string): Promise<void> {
    const filePath = path.join(this.baseUploadPath, folder, fileName);
    if (fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
  }
}
