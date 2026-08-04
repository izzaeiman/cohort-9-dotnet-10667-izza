import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdSearch, MdFolderOpen } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import StatusBadge from '../../components/ui/StatusBadge';
import AvatarGroup from '../../components/ui/AvatarGroup';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import styles from './Projects.module.css';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
  lead: { id: string; name: string; avatar: string };
  team: { id: string; name: string; avatar: string }[];
  status: 'in_progress' | 'completed' | 'pending';
}

const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'PRJ-01',
    name: 'Task Management System SaaS',
    description: 'React 19 + TypeScript + ASP.NET Core Web API fullstack internship project.',
    category: 'Full Stack',
    progress: 78,
    completedTasks: 18,
    totalTasks: 23,
    dueDate: 'Aug 15, 2026',
    lead: { id: 'u3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    team: [
      { id: 'u3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
      { id: 'u1', name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'u2', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
    ],
    status: 'in_progress',
  },
  {
    id: 'PRJ-02',
    name: 'JWT & EF Core Infrastructure',
    description: 'Secure authentication, role authorization, and SQL Server migrations.',
    category: 'Backend',
    progress: 45,
    completedTasks: 9,
    totalTasks: 20,
    dueDate: 'Aug 22, 2026',
    lead: { id: 'u2', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
    team: [
      { id: 'u2', name: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=12' },
      { id: 'u5', name: 'David Miller', avatar: 'https://i.pravatar.cc/150?img=59' },
    ],
    status: 'in_progress',
  },
  {
    id: 'PRJ-03',
    name: 'UI/UX Glassmorphism Design System',
    description: 'Figma tokens, color variables, reusable components, and responsive layouts.',
    category: 'Design',
    progress: 100,
    completedTasks: 14,
    totalTasks: 14,
    dueDate: 'Jul 30, 2026',
    lead: { id: 'u1', name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=32' },
    team: [
      { id: 'u1', name: 'Sarah Connor', avatar: 'https://i.pravatar.cc/150?img=32' },
      { id: 'u3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
    ],
    status: 'completed',
  },
];

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<ProjectItem[]>(MOCK_PROJECTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'Full Stack',
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [projects, searchTerm]);

  const handleCreateProject = async (data: CreateProjectFormData) => {
    // TODO: Connect to ASP.NET Core Web API → await projectService.createProject(data);
    await new Promise((res) => setTimeout(res, 600));

    const newProject: ProjectItem = {
      id: `PRJ-0${projects.length + 1}`,
      name: data.name,
      description: data.description,
      category: data.category,
      progress: 0,
      completedTasks: 0,
      totalTasks: 10,
      dueDate: data.dueDate,
      lead: { id: 'u3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' },
      team: [{ id: 'u3', name: 'Izza Eiman', avatar: 'https://i.pravatar.cc/150?img=68' }],
      status: 'in_progress',
    };

    setProjects((prev) => [newProject, ...prev]);
    setIsModalOpen(false);
    reset();
    setToastMessage(`Project "${data.name}" created successfully!`);
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            Overview of all active engineering projects, milestones, and progress
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => setIsModalOpen(true)}
        >
          New Project
        </AppButton>
      </header>

      {/* ── Stats Summary ─────────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Projects</span>
          <span className={styles.statVal}>{projects.length}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>In Progress</span>
          <span className={styles.statVal}>
            {projects.filter((p) => p.status === 'in_progress').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Completed</span>
          <span className={styles.statVal}>
            {projects.filter((p) => p.status === 'completed').length}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Team Members</span>
          <span className={styles.statVal}>5</span>
        </div>
      </div>

      {/* ── Search Bar ────────────────────────────────────────────────────── */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Project Cards Grid ────────────────────────────────────────────── */}
      {filteredProjects.length > 0 ? (
        <div className={styles.projectsGrid}>
          {filteredProjects.map((project) => (
            <div key={project.id} className={styles.projectCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.projectTitle}>{project.name}</h3>
                  <p className={styles.projectDesc}>{project.description}</p>
                </div>
                <StatusBadge status={project.status} size="sm" />
              </div>

              <div className={styles.progressWrap}>
                <div className={styles.progressHeader}>
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className={styles.track}>
                  <div className={styles.fill} style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span>
                  {project.completedTasks} / {project.totalTasks} Tasks
                </span>
                <AvatarGroup assignees={project.team} size={26} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MdFolderOpen />}
          title="No projects found"
          description="No projects match your search criteria. Create a new project to get started!"
          actionLabel="Create Project"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* ── Create Project Modal ─────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleCreateProject)} noValidate>
          <AppInput
            id="proj-name"
            label="Project Name"
            placeholder="e.g. Real-Time SignalR Notification System"
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            id="proj-desc"
            label="Description"
            placeholder="Brief overview of project goals and deliverables"
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="proj-category"
            label="Category"
            options={[
              { value: 'Full Stack', label: 'Full Stack' },
              { value: 'Frontend', label: 'Frontend' },
              { value: 'Backend', label: 'Backend' },
              { value: 'Design', label: 'Design' },
              { value: 'DevOps', label: 'DevOps' },
            ]}
            error={errors.category?.message}
            {...register('category')}
          />

          <AppInput
            id="proj-duedate"
            label="Target Completion Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Create Project
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ProjectsPage;
