import { describe, it, expect } from 'vitest';

import { createApiResponse } from '../../src/dto/index';

describe('DTOs', () => {
  describe('createApiResponse', () => {
    it('wraps data with success: true', () => {
      const response = createApiResponse({ id: '123', name: 'test' });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: '123', name: 'test' });
      expect(response.meta).toBeUndefined();
    });

    it('includes meta when provided', () => {
      const response = createApiResponse(
        [{ id: '1' }],
        { page: 1, pageSize: 10, total: 50 },
      );

      expect(response.success).toBe(true);
      expect(response.meta?.page).toBe(1);
      expect(response.meta?.total).toBe(50);
    });

    it('wraps null data', () => {
      const response = createApiResponse(null);
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('wraps primitive data', () => {
      const response = createApiResponse(42);
      expect(response.data).toBe(42);
    });
  });
});
