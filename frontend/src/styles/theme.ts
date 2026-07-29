import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF7A1A',
      light: '#FFF5EC',
      dark: '#E55F00',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#5B7FFF',
      light: '#EEF1FF',
      dark: '#3D5FCC',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF5A5A',
      light: '#FFEBEE',
    },
    warning: {
      main: '#FFC107',
      light: '#FFF8E1',
    },
    success: {
      main: '#4CAF50',
      light: '#E8F5E9',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#222222',
      secondary: '#777777',
      disabled: '#AAAAAA',
    },
    divider: '#EAEAEA',
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.25rem', letterSpacing: '-0.02em', color: '#222222' },
    h2: { fontWeight: 700, fontSize: '1.875rem', letterSpacing: '-0.01em', color: '#222222' },
    h3: { fontWeight: 600, fontSize: '1.5rem', letterSpacing: '-0.01em', color: '#222222' },
    h4: { fontWeight: 600, fontSize: '1.25rem', color: '#222222' },
    h5: { fontWeight: 600, fontSize: '1.125rem', color: '#222222' },
    h6: { fontWeight: 600, fontSize: '1rem', color: '#222222' },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500, color: '#222222' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, color: '#777777' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6, color: '#222222' },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#777777' },
    caption: { fontSize: '0.75rem', color: '#777777', fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '10px',
          fontWeight: 600,
          boxShadow: 'none',
          padding: '9px 20px',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(255, 122, 26, 0.25)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #FF7A1A 0%, #FF5F00 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF8C35 0%, #FF7A1A 100%)',
            boxShadow: '0 6px 20px rgba(255, 122, 26, 0.4)',
          },
        },
        outlined: {
          borderColor: '#EAEAEA',
          color: '#222222',
          '&:hover': {
            borderColor: '#FF7A1A',
            color: '#FF7A1A',
            background: '#FFF5EC',
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          border: '1px solid #EAEAEA',
          transition: 'box-shadow 0.25s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            fontSize: '0.9rem',
            '& fieldset': { borderColor: '#EAEAEA' },
            '&:hover fieldset': { borderColor: '#FF7A1A' },
            '&.Mui-focused fieldset': {
              borderColor: '#FF7A1A',
              borderWidth: '1.5px',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#FF7A1A',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: '10px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF7A1A',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#FF7A1A',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          border: '1px solid #EAEAEA',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '2px 6px',
          padding: '8px 12px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: '#FFF5EC',
            color: '#FF7A1A',
          },
          '&.Mui-selected': {
            backgroundColor: '#FFF5EC',
            color: '#FF7A1A',
            fontWeight: 600,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          '&.Mui-selected': {
            fontWeight: 700,
            color: '#FF7A1A',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#FF7A1A',
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          height: 6,
          backgroundColor: '#EAEAEA',
        },
        bar: {
          borderRadius: 9999,
          background: 'linear-gradient(90deg, #FF7A1A, #FF5F00)',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#F8F8F8',
            fontWeight: 600,
            fontSize: '0.8rem',
            color: '#777777',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #EAEAEA',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #F0F0F0',
          padding: '14px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: '#FAFAFA',
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#222222',
          fontSize: '0.75rem',
          borderRadius: '6px',
          padding: '6px 10px',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .Mui-checked': {
            color: '#FF7A1A',
            '& + .MuiSwitch-track': {
              backgroundColor: '#FF7A1A',
            },
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        separator: {
          color: '#AAAAAA',
        },
      },
    },
  },
});

export default theme;
