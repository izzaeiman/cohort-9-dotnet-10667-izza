import api from './api';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  leadUserId: string;
  leadUserName: string;
  category?: string;
  status?: any;
  dueDate?: string;
  completedTasks?: number;
  totalTasks?: number;
  team?: any;
  progress?: number;
}

export const projectService = {
  async getProjects(): Promise<ProjectItem[]> {
    const response = await api.get('/projects');
    return (response.data || []).map((p: any) => ({
      ...p,
      category: p.category || 'General',
      status: p.status || 'in_progress',
      progress: p.progress ?? 0,
      completedTasks: p.completedTasks ?? 0,
      totalTasks: p.totalTasks ?? 0,
      team: Array.isArray(p.team) ? p.team : [],
    }));
  },

  async getProjectById(id: string): Promise<ProjectItem | null> {
    try {
      const response = await api.get(`/projects/${id}`);
      if (!response.data) return null;
      const p = response.data;
      return {
        ...p,
        category: p.category || 'General',
        status: p.status || 'in_progress',
        progress: p.progress ?? 0,
        completedTasks: p.completedTasks ?? 0,
        totalTasks: p.totalTasks ?? 0,
        team: Array.isArray(p.team) ? p.team : [],
      };
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  async createProject(newProjectData: { name: string; description?: string }): Promise<ProjectItem> {
    const response = await api.post('/projects', newProjectData);
    const p = response.data;
    return {
      ...p,
      category: p?.category || 'General',
      status: p?.status || 'in_progress',
      progress: p?.progress ?? 0,
      completedTasks: p?.completedTasks ?? 0,
      totalTasks: p?.totalTasks ?? 0,
      team: Array.isArray(p?.team) ? p.team : [],
    };
  },

  async updateProject(id: string, updatedData: { name: string; description?: string }): Promise<ProjectItem> {
    const response = await api.put(`/projects/${id}`, updatedData);
    const p = response?.data;
    if (p && p.id) {
      return {
        ...p,
        category: p.category || 'General',
        status: p.status || 'in_progress',
        progress: p.progress ?? 0,
        completedTasks: p.completedTasks ?? 0,
        totalTasks: p.totalTasks ?? 0,
        team: Array.isArray(p.team) ? p.team : [],
      };
    }
    return { ...updatedData, id, leadUserId: '', leadUserName: '', category: 'General', status: 'in_progress', progress: 0, completedTasks: 0, totalTasks: 0, team: [] } as ProjectItem;
  },

  async deleteProject(id: string): Promise<boolean> {
    await api.delete(`/projects/${id}`);
    return true;
  },

  async getProgressEntries(projectId: string): Promise<any[]> {
    const response = await api.get(`/projects/${projectId}/progress`);
    return response.data || [];
  },

  async addProgressEntry(projectId: string, description: string): Promise<any> {
    const response = await api.post(`/projects/${projectId}/progress`, { description });
    return response.data;
  },

  async updateProgressEntry(projectId: string, entryId: number, description: string): Promise<any> {
    const response = await api.put(`/projects/${projectId}/progress/${entryId}`, { description });
    return response.data;
  },

  async deleteProgressEntry(projectId: string, entryId: number): Promise<boolean> {
    await api.delete(`/projects/${projectId}/progress/${entryId}`);
    return true;
  },
};
