import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from './projectService';
import api from './api';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const mockProject = {
  id: 'p1', name: 'Test Project', description: 'Desc', leadUserId: 'u1', leadUserName: 'Alice',
};

const mockProjectRaw = {
  ...mockProject,
  category: null, status: null, progress: undefined, completedTasks: undefined, totalTasks: undefined, team: undefined,
};

describe('projectService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getProjects', () => {
    it('maps projects with defaults for missing fields', async () => {
      (api.get as any).mockResolvedValueOnce({ data: [mockProjectRaw] });
      const result = await projectService.getProjects();
      expect(api.get).toHaveBeenCalledWith('/projects');
      expect(result[0].category).toBe('General');
      expect(result[0].status).toBe('in_progress');
      expect(result[0].progress).toBe(0);
      expect(result[0].completedTasks).toBe(0);
      expect(result[0].totalTasks).toBe(0);
      expect(result[0].team).toEqual([]);
    });

    it('preserves existing field values', async () => {
      const rich = { ...mockProject, category: 'Backend', status: 'done', progress: 50, completedTasks: 3, totalTasks: 6, team: ['a', 'b'] };
      (api.get as any).mockResolvedValueOnce({ data: [rich] });
      const result = await projectService.getProjects();
      expect(result[0].category).toBe('Backend');
      expect(result[0].status).toBe('done');
      expect(result[0].progress).toBe(50);
      expect(result[0].team).toEqual(['a', 'b']);
    });
  });

  describe('getProjectById', () => {
    it('returns mapped project when found', async () => {
      (api.get as any).mockResolvedValueOnce({ data: mockProjectRaw });
      const result = await projectService.getProjectById('p1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('p1');
      expect(result!.category).toBe('General');
      expect(result!.team).toEqual([]);
    });

    it('returns null when response.data is falsy', async () => {
      (api.get as any).mockResolvedValueOnce({ data: null });
      const result = await projectService.getProjectById('p1');
      expect(result).toBeNull();
    });

    it('returns null on 404 error', async () => {
      (api.get as any).mockRejectedValueOnce({ response: { status: 404 } });
      const result = await projectService.getProjectById('missing');
      expect(result).toBeNull();
    });

    it('re-throws on non-404 errors', async () => {
      (api.get as any).mockRejectedValueOnce({ response: { status: 500 } });
      await expect(projectService.getProjectById('p1')).rejects.toMatchObject({ response: { status: 500 } });
    });
  });

  describe('createProject', () => {
    it('creates project and applies defaults', async () => {
      (api.post as any).mockResolvedValueOnce({ data: mockProjectRaw });
      const result = await projectService.createProject({ name: 'Test Project' });
      expect(api.post).toHaveBeenCalledWith('/projects', { name: 'Test Project' });
      expect(result.category).toBe('General');
      expect(result.status).toBe('in_progress');
    });
  });

  describe('updateProject', () => {
    it('updates and returns merged project', async () => {
      (api.put as any).mockResolvedValueOnce({});
      const result = await projectService.updateProject('p1', { name: 'New Name' });
      expect(api.put).toHaveBeenCalledWith('/projects/p1', { name: 'New Name' });
      expect(result.id).toBe('p1');
      expect(result.name).toBe('New Name');
    });
  });

  describe('deleteProject', () => {
    it('deletes and returns true', async () => {
      (api.delete as any).mockResolvedValueOnce({});
      const result = await projectService.deleteProject('p1');
      expect(api.delete).toHaveBeenCalledWith('/projects/p1');
      expect(result).toBe(true);
    });
  });

  describe('progress entries', () => {
    it('getProgressEntries returns data or empty array', async () => {
      (api.get as any).mockResolvedValueOnce({ data: [{ id: 1, description: 'Step 1' }] });
      const result = await projectService.getProgressEntries('p1');
      expect(result).toHaveLength(1);

      (api.get as any).mockResolvedValueOnce({ data: null });
      const empty = await projectService.getProgressEntries('p1');
      expect(empty).toEqual([]);
    });

    it('addProgressEntry calls post and returns data', async () => {
      (api.post as any).mockResolvedValueOnce({ data: { id: 1, description: 'New step' } });
      const result = await projectService.addProgressEntry('p1', 'New step');
      expect(api.post).toHaveBeenCalledWith('/projects/p1/progress', { description: 'New step' });
      expect(result.description).toBe('New step');
    });

    it('updateProgressEntry calls put and returns data', async () => {
      (api.put as any).mockResolvedValueOnce({ data: { id: 1, description: 'Updated' } });
      const result = await projectService.updateProgressEntry('p1', 1, 'Updated');
      expect(api.put).toHaveBeenCalledWith('/projects/p1/progress/1', { description: 'Updated' });
      expect(result.description).toBe('Updated');
    });

    it('deleteProgressEntry calls delete and returns true', async () => {
      (api.delete as any).mockResolvedValueOnce({});
      const result = await projectService.deleteProgressEntry('p1', 1);
      expect(api.delete).toHaveBeenCalledWith('/projects/p1/progress/1');
      expect(result).toBe(true);
    });
  });
});
