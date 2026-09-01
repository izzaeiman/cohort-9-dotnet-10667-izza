import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskService } from './taskService';
import apiClient from './api';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

describe('taskService — progress entries (uncovered 14 lines)', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getProgressEntries', () => {
    it('fetches by string TSK-id', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 1, description: 'Step A' }] });
      const result = await taskService.getProgressEntries('TSK-5');
      expect(apiClient.get).toHaveBeenCalledWith('/tasks/5/progress');
      expect(result).toHaveLength(1);
    });

    it('fetches by numeric id', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: [] });
      const result = await taskService.getProgressEntries(7);
      expect(apiClient.get).toHaveBeenCalledWith('/tasks/7/progress');
      expect(result).toEqual([]);
    });

    it('returns empty array when data is null', async () => {
      (apiClient.get as any).mockResolvedValueOnce({ data: null });
      const result = await taskService.getProgressEntries('TSK-3');
      expect(result).toEqual([]);
    });
  });

  describe('addProgressEntry', () => {
    it('posts by string TSK-id and returns data', async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: { id: 10, description: 'New step' } });
      const result = await taskService.addProgressEntry('TSK-2', 'New step');
      expect(apiClient.post).toHaveBeenCalledWith('/tasks/2/progress', { description: 'New step' });
      expect(result.description).toBe('New step');
    });

    it('posts by numeric id', async () => {
      (apiClient.post as any).mockResolvedValueOnce({ data: { id: 11 } });
      await taskService.addProgressEntry(4, 'Step');
      expect(apiClient.post).toHaveBeenCalledWith('/tasks/4/progress', { description: 'Step' });
    });
  });

  describe('updateProgressEntry', () => {
    it('puts by string TSK-id and returns data', async () => {
      (apiClient.put as any).mockResolvedValueOnce({ data: { id: 1, description: 'Updated' } });
      const result = await taskService.updateProgressEntry('TSK-3', 1, 'Updated');
      expect(apiClient.put).toHaveBeenCalledWith('/tasks/3/progress/1', { description: 'Updated' });
      expect(result.description).toBe('Updated');
    });

    it('puts by numeric id', async () => {
      (apiClient.put as any).mockResolvedValueOnce({ data: { id: 2 } });
      await taskService.updateProgressEntry(5, 2, 'X');
      expect(apiClient.put).toHaveBeenCalledWith('/tasks/5/progress/2', { description: 'X' });
    });
  });

  describe('deleteProgressEntry', () => {
    it('deletes by string TSK-id and returns true', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({});
      const result = await taskService.deleteProgressEntry('TSK-6', 3);
      expect(apiClient.delete).toHaveBeenCalledWith('/tasks/6/progress/3');
      expect(result).toBe(true);
    });

    it('deletes by numeric id and returns true', async () => {
      (apiClient.delete as any).mockResolvedValueOnce({});
      const result = await taskService.deleteProgressEntry(8, 4);
      expect(apiClient.delete).toHaveBeenCalledWith('/tasks/8/progress/4');
      expect(result).toBe(true);
    });
  });

  describe('notifyListeners via create/update/delete', () => {
    it('subscribe/unsubscribe listener is called on task changes', async () => {
      const listener = vi.fn();
      const unsub = taskService.subscribe(listener);

      (apiClient.delete as any).mockResolvedValueOnce({});
      await taskService.deleteTask('TSK-1');
      expect(listener).toHaveBeenCalledTimes(1);

      unsub();
      (apiClient.delete as any).mockResolvedValueOnce({});
      await taskService.deleteTask('TSK-1');
      expect(listener).toHaveBeenCalledTimes(1); // not called again after unsub
    });
  });
});
