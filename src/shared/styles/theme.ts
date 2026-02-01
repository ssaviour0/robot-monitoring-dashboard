import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'dark' | 'light') => createTheme({
    palette: {
        mode,
        primary: {
            main: mode === 'dark' ? '#00e5ff' : '#007bb2',
        },
        secondary: {
            main: '#f50057',
        },
        background: {
            default: mode === 'dark' ? '#0a1929' : '#f4f6f8',
            paper: mode === 'dark' ? '#10253d' : '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontSize: '2rem', fontWeight: 600 },
        h2: { fontSize: '1.5rem', fontWeight: 600 },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: mode === 'dark' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                },
            },
        },
    },
});

