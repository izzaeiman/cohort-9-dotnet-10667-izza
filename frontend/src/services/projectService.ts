import { INITIAL_PROJECTS, type ProjectItem } from '../data/projects';
import { INITIAL_USERS } from '../data/users';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

let projectsStore: ProjectItem[] = [...INITIAL_PROJECTS];

let lastProjectId = Math.max(...projectsStore.map(p => {
  const num = parseInt(p.id.replace('PRJ-', ''), 10);
  return isNaN(num) ? 0 : num;
}), 4);

export const projectService = {
  /**
   * Fetch all projects
   */
  async getProjects(): Promise<ProjectItem[]> {
    // TODO: ASP.NET Core API Integration -> GET /api/projects
    await delay();
    return [...projectsStore];
  },

  /**
   * Fetch single project by ID
   */
  async getProjectById(id: string): Promise<ProjectItem | null> {
    // TODO: ASP.NET Core API Integration -> GET /api/projects/{id}
    await delay();
    const project = projectsStore.find((p) => p.id === id);
    return project ? { ...project } : null;
  },

  /**
   * Create a new project
   */
  async createProject(newProjectData: Omit<ProjectItem, 'id' | 'progress' | 'completedTasks' | 'totalTasks' | 'lead' | 'team' | 'status'>): Promise<ProjectItem> {
    // TODO: ASP.NET Core API Integration -> POST /api/projects
    await delay();
    lastProjectId++;
    const leadUser = INITIAL_USERS.find(u => u.id === 'usr-1') || {
      id: 'usr-1',
      name: 'Izza Eiman',
      avatar: 'https://i.pravatar.cc/150?img=68'
    };
    const newProject: ProjectItem = {
      ...newProjectData,
      id: `PRJ-${lastProjectId.toString().padStart(2, '0')}`,
      progress: 0,
      completedTasks: 0,
      totalTasks: 10,
      lead: { id: leadUser.id, name: leadUser.name, avatar: leadUser.avatar },
      team: [{ id: leadUser.id, name: leadUser.name, avatar: leadUser.avatar }],
      status: 'in_progress',
    };
    projectsStore = [newProject, ...projectsStore];
    return newProject;
  },

  /**
   * Update an existing project
   */
  async updateProject(id: string, updatedData: Partial<ProjectItem>): Promise<ProjectItem> {
    // TODO: ASP.NET Core API Integration -> PUT /api/projects/{id}
    await delay();
    const index = projectsStore.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Project with ID ${id} not found`);
    }
    const updatedProject = { ...projectsStore[index], ...updatedData };
    projectsStore[index] = updatedProject;
    return updatedProject;
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<boolean> {
    // TODO: ASP.NET Core API Integration -> DELETE /api/projects/{id}
    await delay();
    const initialLength = projectsStore.length;
    projectsStore = projectsStore.filter((p) => p.id !== id);
    return projectsStore.length < initialLength;
  },
};
