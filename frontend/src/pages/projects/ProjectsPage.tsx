import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MdAdd,
  MdSearch,
  MdFolderOpen,
  MdGridView,
  MdFormatListBulleted,
  MdMoreVert,
} from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import StatusBadge from '../../components/ui/StatusBadge';
import AvatarGroup from '../../components/ui/AvatarGroup';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import Pagination from '../../components/shared/Pagination';
import ConfirmationDialog from '../../components/shared/ConfirmationDialog';
import PageLoader from '../../components/common/PageLoader';

import { projectService } from '../../services/projectService';
import { getLocalDate } from '../../utils/dateHelpers';
import type { ProjectItem } from '../../data/projects';
import styles from './Projects.module.css';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  dueDate: z.string().min(1, 'Due date is required'),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

const PAGE_SIZE = 6;

export const ProjectsPage = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals & Active Menus
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

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
      dueDate: getLocalDate(),
    },
  });

  useEffect(() => {
    let isMounted = true;
    projectService.getProjects().then((data) => {
      if (isMounted) {
        setProjects(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProjects.slice(start, start + PAGE_SIZE);
  }, [filteredProjects, currentPage]);

  const handleCreateProject = async (data: CreateProjectFormData) => {
    const created = await projectService.createProject(data);
    setProjects((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    reset();
    setToastMessage(`Project "${created.name}" created successfully!`);
  };

  const handleEditProject = async (data: CreateProjectFormData) => {
    if (!editingProject) return;
    const updated = await projectService.updateProject(editingProject.id, data);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProject(null);
    setToastMessage('Project details updated successfully!');
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    await projectService.deleteProject(deletingProject.id);
    setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
    setDeletingProject(null);
    setToastMessage('Project deleted successfully!');
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Projects</h1>
          <p className={styles.subtitle}>
            Overview of all active engineering projects, milestones, and deliverables
          </p>
        </div>

        <AppButton
          variant="primary"
          size="md"
          leftIcon={<MdAdd size={20} />}
          onClick={() => {
            reset({
              name: '',
              description: '',
              category: 'Full Stack',
              dueDate: getLocalDate(),
            });
            setIsCreateModalOpen(true);
          }}
        >
          New Project
        </AppButton>
      </header>

      {/* ── Summary Stats Grid ────────────────────────────────────────────── */}
      <div className={styles.statsGrid} aria-label="Project metrics">
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
          <span className={styles.statLabel}>Pending</span>
          <span className={styles.statVal}>
            {projects.filter((p) => p.status === 'pending').length}
          </span>
        </div>
      </div>

      {/* ── Controls Bar: Search, Category Filter, View Mode Toggle ───────── */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden="true">
            <MdSearch size={18} />
          </span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search projects..."
            aria-label="Search projects by name or category"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className={styles.selectFilter}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter projects by category"
          >
            <option value="all">All Categories</option>
            <option value="Full Stack">Full Stack</option>
            <option value="Frontend">Frontend</option>
            <option value="Backend">Backend</option>
            <option value="Design">Design</option>
          </select>

          <select
            className={styles.selectFilter}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter projects by status"
          >
            <option value="all">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid #ECECEC', borderRadius: '10px', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'grid' ? '#FFF5EC' : '#ffffff',
                color: viewMode === 'grid' ? '#FF7A1A' : '#666',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Grid View"
              aria-label="Grid view"
            >
              <MdGridView size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 12px',
                background: viewMode === 'list' ? '#FFF5EC' : '#ffffff',
                color: viewMode === 'list' ? '#FF7A1A' : '#666',
                border: 'none',
                cursor: 'pointer',
              }}
              title="List View"
              aria-label="List view"
            >
              <MdFormatListBulleted size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content: Grid View or List View ──────────────────────────── */}
      {paginatedProjects.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className={styles.projectsGrid}>
              {paginatedProjects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.cardHeader}>
                    <div>
                      <h3 className={styles.projectTitle}>{project.name}</h3>
                      <p className={styles.projectDesc}>{project.description}</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                        onClick={() => setActiveMenuId((prev) => (prev === project.id ? null : project.id))}
                        aria-label={`Project options for ${project.name}`}
                      >
                        <MdMoreVert size={20} />
                      </button>

                      {activeMenuId === project.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            background: '#fff',
                            border: '1px solid #ECECEC',
                            borderRadius: '10px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                            padding: '4px',
                            zIndex: 10,
                            width: '130px',
                          }}
                        >
                          <button
                            type="button"
                            style={{
                              width: '100%',
                              padding: '8px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingProject(project);
                              reset({
                                name: project.name,
                                description: project.description,
                                category: project.category,
                                dueDate: project.dueDate,
                              });
                            }}
                          >
                            Edit Project
                          </button>
                          <button
                            type="button"
                            style={{
                              width: '100%',
                              padding: '8px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#D32F2F',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeletingProject(project);
                            }}
                          >
                            Delete Project
                          </button>
                        </div>
                      )}
                    </div>
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
            <div className={styles.projectCard} style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #F0F0F0' }}>
                    <th style={{ padding: '12px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                      Project
                    </th>
                    <th style={{ padding: '12px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                      Category
                    </th>
                    <th style={{ padding: '12px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                      Progress
                    </th>
                    <th style={{ padding: '12px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>
                      Team
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.75rem', color: '#888' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F8F8F8' }}>
                      <td style={{ padding: '14px 12px', fontWeight: 700 }}>{p.name}</td>
                      <td style={{ padding: '14px 12px', color: '#666' }}>{p.category}</td>
                      <td style={{ padding: '14px 12px', fontWeight: 700, color: '#FF7A1A' }}>
                        {p.progress}%
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        <AvatarGroup assignees={p.team} size={24} />
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}
                          onClick={() => setEditingProject(p)}
                        >
                          <MdMoreVert size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProjects.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <EmptyState
          icon={<MdFolderOpen />}
          title="No projects found"
          description="No projects match your search criteria. Create a new project to get started!"
          actionLabel="Create Project"
          onAction={() => setIsCreateModalOpen(true)}
        />
      )}

      {/* ── Create Project Modal ─────────────────────────────────────────── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Project">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleCreateProject)} noValidate>
          <AppInput
            id="create-proj-name"
            label="Project Name"
            placeholder="e.g. Real-Time SignalR Notification System"
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            id="create-proj-desc"
            label="Description"
            placeholder="Brief overview of project goals and deliverables"
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="create-proj-category"
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
            id="create-proj-duedate"
            label="Target Completion Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Create Project
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Edit Project Modal ───────────────────────────────────────────── */}
      <Modal isOpen={!!editingProject} onClose={() => setEditingProject(null)} title="Edit Project">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleEditProject)} noValidate>
          <AppInput
            id="edit-proj-name"
            label="Project Name"
            error={errors.name?.message}
            {...register('name')}
          />

          <AppInput
            id="edit-proj-desc"
            label="Description"
            error={errors.description?.message}
            {...register('description')}
          />

          <AppSelect
            id="edit-proj-category"
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
            id="edit-proj-duedate"
            label="Target Completion Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setEditingProject(null)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Save Changes
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete project "${deletingProject?.name}"?`}
        confirmLabel="Delete Project"
        isDanger
      />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default ProjectsPage;
