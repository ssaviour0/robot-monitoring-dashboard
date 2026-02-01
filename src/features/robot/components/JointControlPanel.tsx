import { Box, Typography, Slider } from '@mui/material';
import { useRobotStore } from '../store/robotStore';

export const JointControlPanel = () => {
    const { jointAngles, setJointAngle } = useRobotStore();

    return (
        <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 37, 61, 0.4)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(4px)'
        }}>
            <Box sx={{ px: 0.5 }}>
                {jointAngles.map((angle, index) => {
                    const degreeValue = Math.round(angle * (180 / Math.PI));

                    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                            const radians = val * (Math.PI / 180);
                            setJointAngle(index, Math.max(-Math.PI, Math.min(Math.PI, radians)));
                        }
                    };

                    return (
                        <Box key={index} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                    JOINT {index + 1}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <input
                                        type="number"
                                        value={degreeValue}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '50px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
                                            color: '#00e5ff',
                                            fontSize: '0.75rem',
                                            textAlign: 'right',
                                            outline: 'none',
                                            fontWeight: 700,
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <Typography variant="caption" color="primary" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>°</Typography>
                                </Box>
                            </Box>
                            <Slider
                                size="small"
                                value={angle}
                                min={-Math.PI}
                                max={Math.PI}
                                step={0.01}
                                onChange={(_, value) => setJointAngle(index, value as number)}
                                sx={{
                                    color: 'primary.main',
                                    py: 1, // Add vertical padding to slider for better legibility
                                    '& .MuiSlider-thumb': {
                                        width: 10,
                                        height: 10,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

