import { Box, Typography, Divider } from '@mui/material';
import { Bolt, Thermostat, Info } from '@mui/icons-material';
import { useRobotStore } from '../store/robotStore';
import { TelemetryCard } from './TelemetryCard';
import { JointControlPanel } from './JointControlPanel';

export const SidePanel = () => {
    const telemetry = useRobotStore((state) => state.telemetry);

    return (
        <Box
            sx={{
                width: 320,
                height: '100%',
                bgcolor: 'background.default',
                borderRight: { md: '1px solid rgba(255, 255, 255, 0.1)' },
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: 'primary.main', px: 1 }}>
                    ROBOT STATUS
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <TelemetryCard
                    label="Power"
                    value={telemetry.powerConsumption}
                    unit="W"
                    icon={<Bolt sx={{ color: telemetry.powerConsumption > 500 ? 'warning.main' : 'success.main' }} />}
                    progress={(telemetry.powerConsumption / 615) * 100}
                    color={telemetry.powerConsumption > 500 ? 'warning' : 'success'}
                />

                <TelemetryCard
                    label="Core Temp"
                    value={telemetry.temperature}
                    unit="°C"
                    icon={<Thermostat sx={{ color: telemetry.temperature > 50 ? 'warning.main' : 'primary.main' }} />}
                    color={telemetry.temperature > 50 ? 'warning' : 'primary'}
                />

                <TelemetryCard
                    label="Status"
                    value={telemetry.status.toUpperCase()}
                    icon={<Info sx={{ color: 'primary.main' }} />}
                />

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary', px: 1 }}>
                    SPECIFICATIONS
                </Typography>
                <Box sx={{ px: 1, color: 'text.secondary' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Model: UR10e (Standard)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Weight: 33.3 kg (Arm Only)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        • Input: 100-240 VAC, 47-440 Hz
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>
                        • Average Power: 350 W
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: 'text.primary', px: 1 }}>
                    JOINT CONTROL
                </Typography>

                <JointControlPanel />
            </Box>
        </Box>
    );
};
