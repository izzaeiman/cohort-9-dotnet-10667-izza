import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdChevronLeft, MdChevronRight, MdAccessTime, MdEdit, MdDelete } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import useAuth from '../../hooks/useAuth';
import { taskService } from '../../services/taskService';
import type { DetailedTaskItem } from '../../data/tasks';
import styles from './Calendar.module.css';

const addEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  day: z.number().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31'),
  priority: z.enum(['high', 'medium', 'low', 'critical']),
});

type AddEventFormData = z.infer<typeof addEventSchema>;

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<DetailedTaskItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user, isAdmin } = useAuth();
  const [editingEvent, setEditingEvent] = useState<DetailedTaskItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCalendarTasks = useCallback(async () => {
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchCalendarTasks();
  }, [fetchCalendarTasks]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddEventFormData>({
    resolver: zodResolver(addEventSchema),
    defaultValues: {
      title: '',
      day: new Date().getDate(),
      priority: 'medium',
    },
  });

  useEffect(() => {
    reset({
      title: '',
      day: selectedDay,
      priority: 'medium',
    });
  }, [selectedDay, reset]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDayTasks = (dayNum: number) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
    });
  };

  const selectedDayTasks = getDayTasks(selectedDay);

  const handleAddEvent = async (data: AddEventFormData) => {
    try {
      const eventDate = new Date(year, month, data.day, 12, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        setToastMessage('Due date cannot be in the past.');
        return;
      }

      const isoDate = eventDate.toISOString();

      const created = await taskService.createTask({
        title: data.title,
        description: 'Scheduled Calendar Event',
        dueDate: isoDate,
        priority: data.priority as any,
        category: 'General',
        status: 'pending',
      } as any);

      setTasks((prev) => [...prev, created]);
      setSelectedDay(data.day);
      setIsModalOpen(false);
      reset();
      setToastMessage(`Calendar event "${data.title}" saved!`);
    } catch (err: any) {
      const serverError = err.response?.data?.errors?.DueDate?.[0] || err.response?.data?.message || 'Failed to save calendar event.';
      setToastMessage(serverError);
    }
  };

  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [editStatus, setEditStatus] = useState<any>('pending');

  useEffect(() => {
    if (editingEvent) {
      setEditTitle(editingEvent.title);
      setEditPriority(editingEvent.priority as any);
      setEditStatus(editingEvent.status || 'pending');
    }
  }, [editingEvent]);

  const handleEditEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editTitle.trim()) return;

    try {
      const updated = await taskService.updateTask(editingEvent.id, {
        title: editTitle.trim(),
        priority: editPriority,
        status: editStatus,
      });

      setTasks((prev) => prev.map((t) => (t.id === editingEvent.id ? updated : t)));
      setIsEditModalOpen(false);
      setEditingEvent(null);
      setToastMessage('Calendar event updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update calendar event.');
    }
  };

  const handleDeleteEvent = async (eventId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const stringId = typeof eventId === 'number' ? `TSK-${eventId}` : eventId;
      await taskService.deleteTask(stringId);
      setTasks((prev) => prev.filter((t) => t.id !== stringId));
      setToastMessage('Calendar event deleted successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete calendar event.');
    }
  };

  return (
    <div className={styles.page}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar & Schedules</h1>
          <p className={styles.subtitle}>
            Visualize project deadlines, sprint releases, and team meetings
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className={styles.monthNav}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <MdChevronLeft size={20} />
            </button>
            <span className={styles.monthTitle}>{`${monthName} ${year}`}</span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <MdChevronRight size={20} />
            </button>
          </div>

          <AppButton
            variant="primary"
            size="md"
            leftIcon={<MdAdd size={20} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Event
          </AppButton>
        </div>
      </header>

      {/* ── Calendar Grid + Side Panel ────────────────────────────────────── */}
      <div className={styles.gridWrapper}>
        <div className={styles.calendarCard}>
          <div className={styles.daysHeader}>
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className={styles.daysGrid}>
            {daysInMonth.map((dayNum) => {
              const dayEvs = getDayTasks(dayNum);
              const isToday = dayNum === 5 && month === 7 && year === 2026;
              const isSelected = dayNum === selectedDay;

              return (
                <div
                  key={dayNum}
                  className={`${styles.dayCell} ${isToday ? styles.todayCell : ''}`}
                  style={isSelected ? { outline: '2px solid #FF7A1A' } : undefined}
                  onClick={() => setSelectedDay(dayNum)}
                >
                  <div className={styles.dayNum}>
                    {isToday ? <span className={styles.todayNum}>{dayNum}</span> : dayNum}
                  </div>

                  {dayEvs.map((ev) => (
                    <div
                      key={ev.id}
                      className={`${styles.eventPill} ${
                        ev.priority === 'high' || ev.priority === 'critical'
                          ? styles.eventHigh
                          : ev.priority === 'medium'
                          ? styles.eventMedium
                          : styles.eventLow
                      }`}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Details Panel */}
        <div className={styles.sideCard}>
          <h3 className={styles.sideTitle}>{`Events for ${monthName.slice(0, 3)} ${selectedDay}, ${year}`}</h3>

          {selectedDayTasks.length > 0 ? (
            <div className={styles.eventList}>
              {selectedDayTasks.map((ev) => {
                const canModify = user && (ev.assignedUserId === user.id || isAdmin?.());
                return (
                  <div key={ev.id} className={styles.eventItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span className={styles.itemTitle}>{ev.title}</span>
                      <span className={styles.itemTime}>
                        <MdAccessTime size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {ev.priority.toUpperCase()} priority • {ev.status}
                      </span>
                    </div>
                    {canModify && (
                      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEvent(ev);
                            setIsEditModalOpen(true);
                          }}
                          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px' }}
                          title="Edit Event"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Delete Event"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#888', fontSize: '0.875rem' }}>
              No events scheduled for this date. Click "+ Add Event" to schedule.
            </p>
          )}
        </div>
      </div>

      {/* ── Add Event Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Calendar Event">
        <form className={styles.modalForm} onSubmit={handleSubmit(handleAddEvent)} noValidate>
          <AppInput
            id="ev-title"
            label="Event Title"
            placeholder="e.g. Design review with mentor"
            error={errors.title?.message}
            {...register('title')}
          />

          <AppInput
            id="ev-day"
            label={`Day of ${monthName}`}
            type="number"
            placeholder={`1 - ${totalDays}`}
            error={errors.day?.message}
            {...register('day', { valueAsNumber: true })}
          />

          <AppSelect
            id="ev-priority"
            label="Priority Level"
            options={[
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
            error={errors.priority?.message}
            {...register('priority')}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingBottom: '4px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md" isLoading={isSubmitting}>
              Schedule Event
            </AppButton>
          </div>
        </form>
      </Modal>

      {/* ── Edit Event Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingEvent(null); }} title="Edit Calendar Event">
        <form className={styles.modalForm} onSubmit={handleEditEventSubmit} noValidate>
          <AppInput
            id="edit-ev-title"
            label="Event Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <AppSelect
            id="edit-ev-priority"
            label="Priority Level"
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value as any)}
            options={[
              { value: 'high', label: 'High Priority' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
              { value: 'critical', label: 'Critical Priority' },
            ]}
          />

          <AppSelect
            id="edit-ev-status"
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as any)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px', paddingBottom: '4px' }}>
            <AppButton type="button" variant="outlined" size="md" onClick={() => { setIsEditModalOpen(false); setEditingEvent(null); }}>
              Cancel
            </AppButton>
            <AppButton type="submit" variant="primary" size="md">
              Save Changes
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

export default CalendarPage;
