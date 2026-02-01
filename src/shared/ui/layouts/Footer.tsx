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
                height: 32,
                bgcolor: 'background.paper',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                justifyContent: 'space-between',
                zIndex: 1000,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
                    SIMULATED MODE
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                <Typography variant="caption" color="text.secondary">
                    LATENCY: &lt;10ms
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                <Typography variant="caption" color="text.secondary">
                    FPS: 60
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    LAST UPDATE: {time.toLocaleString()}
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 12, my: 'auto' }} />
                <Typography variant="caption" color="text.secondary">
                    © DONGHOON
                </Typography>
            </Box>
        </Box>
    );
};
