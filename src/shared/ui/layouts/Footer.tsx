import { Box, Typography, Divider } from '@mui/material';
import { useEffect, useState } from 'react';

export const Footer = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Box
            sx={{
                minHeight: 32,
                py: { xs: 1, md: 0 },
                bgcolor: 'background.paper',
                borderTop: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                px: 2,
                gap: { xs: 1, sm: 0 },
                justifyContent: 'space-between',
                zIndex: 1000,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    SIMULATED MODE
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    LATENCY: &lt;10ms
                </Typography>
                <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
                    <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                    <Typography variant="caption" color="text.secondary">
                        FPS: 60
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                    LAST UPDATE: {time.toLocaleTimeString()}
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                <Typography variant="caption" color="text.secondary">
                    © DONGHOON
                </Typography>
            </Box>
        </Box>
    );
};
