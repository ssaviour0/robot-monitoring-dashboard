import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMediaQuery, Drawer, IconButton } from '@mui/material';
import { useState } from 'react';
import { useRobotStore } from '@features/robot/store/robotStore';
import {
    Menu as MenuIcon,
    ChevronRight,
    Refresh as RefreshIcon,
    Replay as ResetIcon,
    Brightness4 as DarkModeIcon
} from '@mui/icons-material';
import { getTheme } from '@shared/styles/theme';
import { Button, Stack } from '@mui/material';
import { useMemo } from 'react';
import { RobotCanvas } from '@features/robot/components/RobotCanvas';
import { SidePanel } from '@features/robot/components/SidePanel';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { Footer } from '@shared/ui/layouts/Footer';
import './styles/index.css';

function App() {
    const isMobile = useMediaQuery('(max-width:900px)');
    const [mobileOpen, setMobileOpen] = useState(false);

    const darkMode = useRobotStore((state) => state.settings.darkMode);
    const toggleDarkMode = useRobotStore((state) => state.toggleDarkMode);
    const powerConsumption = useRobotStore((state) => state.telemetry.powerConsumption);

    const theme = useMemo(() => getTheme(darkMode ? 'dark' : 'light'), [darkMode]);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ErrorBoundary>
                <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>

                    {/* Responsive Side Panel */}
                    {isMobile ? (
                        <Drawer
                            variant="temporary"
                            anchor="left"
                            open={mobileOpen}
                            onClose={handleDrawerToggle}
                            ModalProps={{ keepMounted: true }}
                            sx={{
                                display: { xs: 'block', md: 'none' },
                                '& .MuiDrawer-paper': { width: 320, bgcolor: 'background.default' },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                                <IconButton onClick={handleDrawerToggle}>
                                    <ChevronRight sx={{ transform: 'rotate(180deg)' }} />
                                </IconButton>
                            </Box>
                            <SidePanel />
                        </Drawer>
                    ) : (
                        <SidePanel />
                    )}

                    {/* Main Content Area */}
                    <Box sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        width: { md: `calc(100% - 320px)` },
                        transition: theme.transitions.create(['margin', 'width'], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}>
                        <Box sx={{
                            p: { xs: 2, md: 3 },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Box>
                                    <Typography variant={isMobile ? "subtitle1" : "h5"} color="primary" sx={{ fontWeight: 700, letterSpacing: 1 }}>
                                        ROBOT MONITORING
                                    </Typography>
                                    {!isMobile && (
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                                                Viewer v1.0
                                            </Typography>
                                            <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                                                [READY]
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>

                                {!isMobile && (
                                    <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
                                        <Box>
                                            <Typography variant="caption" display="block">MODE</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>SIMULATED</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" display="block">POWER AVG</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{powerConsumption}W</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" display="block">STATUS</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>NORMAL</Typography>
                                        </Box>
                                    </Stack>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {!isMobile && (
                                    <>
                                        <Button
                                            size="small"
                                            startIcon={<RefreshIcon />}
                                            onClick={() => window.location.reload()}
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            REFRESH
                                        </Button>
                                        <Button
                                            size="small"
                                            startIcon={<ResetIcon />}
                                            onClick={() => useRobotStore.getState().resetRobot()}
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            RESET
                                        </Button>
                                        <IconButton size="small" color="inherit" onClick={toggleDarkMode}>
                                            <DarkModeIcon color={darkMode ? 'primary' : 'inherit'} />
                                        </IconButton>
                                    </>
                                )}
                                {isMobile && (
                                    <IconButton color="primary" onClick={handleDrawerToggle}>
                                        <MenuIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>

                        <Box sx={{ flexGrow: 1, p: { xs: 1, md: 2 }, position: 'relative' }}>
                            <RobotCanvas />
                        </Box>

                        <Footer />
                    </Box>
                </Box>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
