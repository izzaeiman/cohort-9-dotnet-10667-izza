import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdAdd, MdChevronLeft, MdChevronRight, MdAccessTime } from 'react-icons/md';

import AppButton from '../../components/ui/AppButton';
import AppInput from '../../components/ui/AppInput';
import AppSelect from '../../components/ui/AppSelect';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import styles from './Calendar.module.css';

interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'ev-1', day: 5, title: 'Sprint 2 Code Review', time: '10:00 AM', priority: 'high' },
  { id: 'ev-2', day: 8, title: 'xUnit Test Coverage Check', time: '2:30 PM', priority: 'medium' },
  { id: 'ev-3', day: 12, title: 'ASP.NET Core Controller Review', time: '11:00 AM', priority: 'high' },
  { id: 'ev-4', day: 18, title: 'SonarQube Quality Gate Check', time: '4:00 PM', priority: 'low' },
  { id: 'ev-5', day: 22, title: 'SQL Migration Release', time: '3:00 PM', priority: 'high' },
];

const addEventSchema = z.object({
  title: z.string().min(1, 'Event title is required'),
  day: z.number().min(1, 'Day must be between 1 and 31').max(31, 'Day must be between 1 and 31'),
  time: z.string().min(1, 'Time is required'),
  priority: z.enum(['high', 'medium', 'low']),
});

type AddEventFormData = z.infer<typeof addEventSchema>;

export const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [selectedDay, setSelectedDay] = useState<number>(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddEventFormData>({
    resolver: zodResolver(addEventSchema),
    defaultValues: {
      title: '',
      day: 15,
      time: '10:00 AM',
      priority: 'medium',
    },
  });

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const selectedDayEvents = events.filter((e) => e.day === selectedDay);

  const handleAddEvent = async (data: AddEventFormData) => {
    // TODO: Connect to ASP.NET Core Web API → await calendarService.createEvent(data);
    await new Promise((res) => setTimeout(res, 400));

    const newEv: CalendarEvent = {
      id: `ev-${events.length + 1}`,
      title: data.title,
      day: data.day,
      time: data.time,
      priority: data.priority,
    };

    setEvents((prev) => [...prev, newEv]);
    setSelectedDay(data.day);
    setIsModalOpen(false);
    reset();
    setToastMessage(`Event "${data.title}" added to calendar!`);
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
            <button type="button" className={styles.navBtn} aria-label="Previous month">
              <MdChevronLeft size={20} />
            </button>
            <span className={styles.monthTitle}>August 2026</span>
            <button type="button" className={styles.navBtn} aria-label="Next month">
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
              const dayEvs = events.filter((e) => e.day === dayNum);
              const isToday = dayNum === 5;
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
                        ev.priority === 'high'
                          ? styles.eventHigh
                          : ev.priority === 'medium'
                          ? styles.eventMedium
                          : styles.eventLow
                      }`}
                      title={`${ev.time} - ${ev.title}`}
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
          <h3 className={styles.sideTitle}>Events for Aug {selectedDay}, 2026</h3>

          {selectedDayEvents.length > 0 ? (
            <div className={styles.eventList}>
              {selectedDayEvents.map((ev) => (
                <div key={ev.id} className={styles.eventItem}>
                  <span className={styles.itemTitle}>{ev.title}</span>
                  <span className={styles.itemTime}>
                    <MdAccessTime size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {ev.time} ({ev.priority.toUpperCase()} priority)
                  </span>
                </div>
              ))}
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
            label="Day of August"
            type="number"
            placeholder="1 - 31"
            error={errors.day?.message}
            {...register('day', { valueAsNumber: true })}
          />

          <AppInput
            id="ev-time"
            label="Time"
            placeholder="e.g. 10:00 AM"
            error={errors.time?.message}
            {...register('time')}
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

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};

export default CalendarPage;
