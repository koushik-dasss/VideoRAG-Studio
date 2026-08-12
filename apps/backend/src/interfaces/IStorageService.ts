export interface IStorageService {
  saveFile(fileBuffer: Buffer, fileName: string, folder: string): Promise<string>;
  moveFile(tempPath: string, fileName: string, folder: string): Promise<string>;
  uploadStream(fileStream: NodeJS.ReadableStream, fileName: string, folder: string): Promise<string>;
  getFileUrl(fileName: string, folder: string): string;
  deleteFile(fileName: string, folder: string): Promise<void>;
}
