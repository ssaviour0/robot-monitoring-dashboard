import { Box, Card, Typography, LinearProgress } from '@mui/material';


import { useMemo } from 'react';

interface TelemetryCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ReactNode;
    progress?: number;
    color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
    showChart?: boolean;
}

const MiniChart = ({ color = 'primary' }: { color?: string }) => {
    // Generate random-ish path for the mini chart
    const points = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => ({
            x: i * 10,
            y: 10 + Math.random() * 20
        }));
    }, []);

    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L')}`;

    return (
        <Box sx={{ width: 80, height: 30, ml: 'auto' }}>
            <svg width="100%" height="100%" viewBox="0 0 90 40">
                <path
                    d={pathData}
                    fill="none"
                    stroke={`var(--mui-palette-${color}-main)`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 2px rgba(0, 229, 255, 0.3))' }}
                />
            </svg>
        </Box>
    );
};

export const TelemetryCard = ({ label, value, unit, icon, progress, color = 'primary', showChart = true }: TelemetryCardProps) => {
    return (
        <Card sx={{
            p: 2,
            mb: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 37, 61, 0.7)' : 'background.paper',
            backdropFilter: 'blur(10px)',
            borderLeft: `4px solid`,
            borderColor: `${color}.main`,
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
            borderLeftWidth: '4px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0 2px 8px rgba(0,0,0,0.05)',
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {icon}
                <Typography variant="subtitle2" sx={{ ml: 1, color: 'text.secondary', fontWeight: 600 }}>
                    {label.toUpperCase()}
                </Typography>
                {showChart && <MiniChart color={color} />}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </Typography>
                {unit && (
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                        {unit}
                    </Typography>
                )}
            </Box>
            {progress !== undefined && (
                <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate" value={progress} color={color} sx={{ height: 4, borderRadius: 2, opacity: 0.8 }} />
                </Box>
            )}
        </Card>
    );
};

