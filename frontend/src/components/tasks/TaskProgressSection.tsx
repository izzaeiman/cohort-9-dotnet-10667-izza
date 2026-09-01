import { useState, useEffect, useCallback } from 'react';
import { MdAdd, MdEdit, MdDelete, MdHistory } from 'react-icons/md';
import { taskService } from '../../services/taskService';
import useAuth from '../../hooks/useAuth';

interface TaskProgressSectionProps {
  taskId: string | number;
}

export const TaskProgressSection = ({ taskId }: TaskProgressSectionProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user, isAdmin } = useAuth();

  const fetchProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await taskService.getProgressEntries(taskId);
      setEntries(data);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      fetchProgress();
    }
  }, [taskId, fetchProgress]);

  const handleAddProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setErrorMsg(null);
    try {
      await taskService.addProgressEntry(taskId, newDesc.trim());
      setNewDesc('');
      await fetchProgress();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to add progress update.');
    }
  };

  const handleUpdateProgress = async (progressId: number) => {
    if (!editDesc.trim()) return;
    setErrorMsg(null);
    try {
      await taskService.updateProgressEntry(taskId, progressId, editDesc.trim());
      setEditingId(null);
      setEditDesc('');
      await fetchProgress();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to update progress.');
    }
  };

  const handleDeleteProgress = async (progressId: number) => {
    if (!window.confirm('Are you sure you want to delete this progress entry?')) return;
    setErrorMsg(null);
    try {
      await taskService.deleteProgressEntry(taskId, progressId);
      await fetchProgress();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete progress entry.');
    }
  };

  return (
    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
      <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>
        <MdHistory size={20} style={{ color: '#FF7A1A' }} />
        Progress & Activity History
      </h4>

      {errorMsg && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '0.875rem', marginBottom: '12px' }}>
          {errorMsg}
        </div>
      )}

      {/* Add Form */}
      <form onSubmit={handleAddProgress} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="What did you accomplish?"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border, #ccc)',
            fontSize: '0.875rem',
            backgroundColor: 'var(--bg-secondary, #fff)',
            color: 'var(--text, #111)',
          }}
        />
        <button
          type="submit"
          disabled={!newDesc.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF7A1A',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: newDesc.trim() ? 1 : 0.6,
          }}
        >
          <MdAdd size={18} />
          Save Progress
        </button>
      </form>

      {/* Timeline List */}
      {isLoading ? (
        <div style={{ fontSize: '0.875rem', color: '#888' }}>Loading progress updates...</div>
      ) : entries.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: '#888', fontStyle: 'italic' }}>
          No progress updates recorded yet. Add your accomplishments above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {entries.map((entry) => {
            const canModify = user && (entry.userId === user.id || isAdmin?.());
            return (
              <div
                key={entry.id}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary, #f9fafb)',
                  border: '1px solid var(--border, #eee)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  {editingId === entry.id ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        style={{ flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(entry.id)}
                        style={{ padding: '4px 10px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ padding: '4px 10px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: 'var(--text, #111)' }}>
                        {entry.description}
                      </p>
                      <span style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', display: 'block' }}>
                        By {entry.userName} • {new Date(entry.createdAt).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>

                {editingId !== entry.id && canModify && (
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(entry.id);
                        setEditDesc(entry.description);
                      }}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px' }}
                      title="Edit entry"
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProgress(entry.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      title="Delete entry"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskProgressSection;
