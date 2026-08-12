import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: any[];
  timestamp: string;
  requestId: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    errors: [],
    timestamp: new Date().toISOString(),
    requestId: (res.req?.headers['x-request-id'] as string) || 'unknown',
  };
  return res.status(statusCode).json(response);
}
