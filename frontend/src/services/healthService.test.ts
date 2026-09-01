import { describe, it, expect, vi } from 'vitest';
import { getHealthStatus } from './healthService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('healthService', () => {
  it('calls /health API endpoint', async () => {
    const mockHealth = { status: 'Healthy', message: 'API is running' };
    (apiClient.get as any).mockResolvedValue({ data: mockHealth });

    const result = await getHealthStatus();
    expect(apiClient.get).toHaveBeenCalledWith('/health');
    expect(result).toEqual(mockHealth);
  });
});
