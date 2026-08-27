import { MdHourglassTop } from 'react-icons/md';

export const PageLoader = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '12px',
        color: '#FF7A1A',
      }}
    >
      <MdHourglassTop size={36} />
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>
        Loading workspace...
      </span>
    </div>
  );
};

export default PageLoader;
