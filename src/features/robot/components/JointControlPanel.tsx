import { Box, Typography, Slider, FormControlLabel, Switch } from '@mui/material';
import { useRobotStore } from '../store/robotStore';
import { UR10_JOINT_DEFS } from '../types/robot';
import { radToDeg, degToRad } from '../utils/joint.utils';

export const JointControlPanel = () => {
    const { jointAngles, setJointAngle, settings, setManualMode, selectedJointIndex, setSelectedJoint } = useRobotStore();
    const isManualMode = settings.isManualMode;

    const handleJointSelect = (index: number) => {
        if (!isManualMode) setManualMode(true);
        setSelectedJoint(selectedJointIndex === index ? -1 : index);
    };

    return (
        <Box sx={{
            mt: 2,
            p: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 37, 61, 0.4)' : 'rgba(0, 0, 0, 0.02)',
            borderRadius: '12px',
            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
            backdropFilter: 'blur(4px)'
        }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                px: 0.5,
                borderBottom: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                pb: 1
            }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isManualMode ? 'primary.main' : 'text.secondary', letterSpacing: 0.5 }}>
                    {isManualMode ? 'MANUAL CONTROL' : 'SIMULATION MODE'}
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={isManualMode}
                            onChange={(e) => {
                                setManualMode(e.target.checked);
                                if (!e.target.checked) setSelectedJoint(-1);
                            }}
                            color="primary"
                        />
                    }
                    label={<Typography variant="caption" sx={{ fontWeight: 700, opacity: isManualMode ? 1 : 0.5 }}>MANUAL</Typography>}
                    labelPlacement="start"
                    sx={{ m: 0 }}
                />
            </Box>

            <Box sx={{
                px: 0.5,
                opacity: isManualMode ? 1 : 0.6,
                transition: 'all 0.3s ease'
            }}>
                {UR10_JOINT_DEFS.map((def) => {
                    const angle = jointAngles[def.index] ?? 0;
                    const degreeValue = radToDeg(angle);
                    const isSelected = def.index === selectedJointIndex;

                    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                            const radians = degToRad(val);
                            const clamped = Math.max(def.limitLower, Math.min(def.limitUpper, radians));
                            setJointAngle(def.index, clamped);
                        }
                    };

                    return (
                        <Box
                            key={def.name}
                            sx={{
                                mb: 2,
                                p: 1,
                                borderRadius: '8px',
                                bgcolor: isSelected ? 'rgba(0, 229, 255, 0.08)' : 'transparent',
                                border: isSelected ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid transparent',
                                transition: 'all 0.15s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(0, 229, 255, 0.03)',
                                },
                            }}
                            onClick={() => handleJointSelect(def.index)}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="caption" sx={{
                                    fontWeight: isSelected ? 800 : 600,
                                    color: isSelected ? 'primary.main' : 'text.secondary',
                                }}>
                                    {isSelected ? '● ' : ''}{def.shortName}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <input
                                        type="number"
                                        value={degreeValue}
                                        onChange={handleInputChange}
                                        disabled={!isManualMode}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            width: '50px',
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: isManualMode ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                                            color: isManualMode ? (isSelected ? '#00e5ff' : '#00b8d4') : 'grey',
                                            fontSize: '0.75rem',
                                            textAlign: 'right',
                                            outline: 'none',
                                            fontWeight: 700,
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                    <Typography variant="caption" color="primary" sx={{ opacity: isManualMode ? 0.8 : 0.3, fontSize: '0.7rem' }}>°</Typography>
                                </Box>
                            </Box>
                            <Slider
                                size="small"
                                value={angle}
                                min={def.limitLower}
                                max={def.limitUpper}
                                step={0.01}
                                disabled={!isManualMode}
                                onChange={(_, value) => {
                                    setJointAngle(def.index, value as number);
                                    if (!isSelected) setSelectedJoint(def.index);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                    color: isSelected ? '#00e5ff' : 'primary.main',
                                    py: 1,
                                    '& .MuiSlider-thumb': {
                                        width: isSelected ? 14 : 10,
                                        height: isSelected ? 14 : 10,
                                        transition: 'all 0.15s',
                                    },
                                    '& .MuiSlider-track': {
                                        height: isSelected ? 4 : 2,
                                        transition: 'height 0.15s',
                                    },
                                    '& .MuiSlider-rail': {
                                        height: isSelected ? 4 : 2,
                                    },
                                    '&.Mui-disabled': {
                                        color: 'rgba(0, 229, 255, 0.2)',
                                    },
                                    // 모바일 터치 영역 확대
                                    '& .MuiSlider-thumb::after': {
                                        width: 28,
                                        height: 28,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>
            {!isManualMode && (
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1, color: 'text.disabled', fontStyle: 'italic' }}>
                    Enable Manual mode to adjust joints
                </Typography>
            )}
        </Box>
    );
};
