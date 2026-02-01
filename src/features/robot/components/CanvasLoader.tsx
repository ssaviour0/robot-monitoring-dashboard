import { Box, Typography, CircularProgress } from '@mui/material';

export const CanvasLoader = () => {
    return (
        <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(10, 25, 41, 0.8)',
            zIndex: 10,
            borderRadius: '12px',
        }}>
            <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 600, letterSpacing: 1.5 }}>
                LOADING DIGITAL TWIN
            </Typography>
            <Typography variant="caption" color="text.secondary">
                Optimizing 3D Assets...
            </Typography>
        </Box>
    );
};
