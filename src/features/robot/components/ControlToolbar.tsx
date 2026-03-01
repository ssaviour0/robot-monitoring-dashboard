import { Box, IconButton, Tooltip } from '@mui/material';
import { Home, GridOn, ViewInAr, KeyboardArrowUp, KeyboardArrowDown, TouchApp, PanTool } from '@mui/icons-material';
import { useRobotStore } from '../store/robotStore';
import { useMediaQuery } from '@mui/material';
import { UR10_JOINT_DEFS } from '../types/robot';

interface ControlToolbarProps {
    onResetCamera: () => void;
}

/**
 * ControlToolbar (v2)
 * 3D 뷰포트 우하단 도구모음 — 관절 퀵 네비게이션, 카메라, 뷰 모드 토글
 */
export const ControlToolbar = ({ onResetCamera }: ControlToolbarProps) => {
    const showWireframe = useRobotStore((s) => s.settings.showWireframe);
    const showCollision = useRobotStore((s) => s.settings.showCollision);
    const isManualMode = useRobotStore((s) => s.settings.isManualMode);
    const selectedJointIndex = useRobotStore((s) => s.selectedJointIndex);
    const toggleWireframe = useRobotStore((s) => s.toggleWireframe);
    const toggleCollision = useRobotStore((s) => s.toggleCollision);
    const isIKMode = useRobotStore((s) => s.settings.isIKMode);
    const toggleIKMode = useRobotStore((s) => s.toggleIKMode);
    const setSelectedJoint = useRobotStore((s) => s.setSelectedJoint);
    const setManualMode = useRobotStore((s) => s.setManualMode);

    const isMobile = useMediaQuery('(max-width:900px)');

    const handleToggleIK = () => {
        toggleIKMode();
        if (!isManualMode) setManualMode(true);
    };

    const handleToggleManual = () => {
        const next = !isManualMode;
        setManualMode(next);
        if (!next) setSelectedJoint(-1);
    };

    const handlePrevJoint = () => {
        if (!isManualMode) setManualMode(true);
        const prev = selectedJointIndex <= 0 ? UR10_JOINT_DEFS.length - 1 : selectedJointIndex - 1;
        setSelectedJoint(prev);
    };

    const handleNextJoint = () => {
        if (!isManualMode) setManualMode(true);
        const next = selectedJointIndex >= UR10_JOINT_DEFS.length - 1 ? 0 : selectedJointIndex + 1;
        setSelectedJoint(next);
    };

    const btnBase = {
        width: isMobile ? 38 : 36,
        height: isMobile ? 38 : 36,
        // Minimum touch target for mobile (Apple/Google recommend ~44px, but 42px fits better here)
        minWidth: isMobile ? 38 : 36,
        minHeight: isMobile ? 38 : 36,
        transition: 'all 0.15s ease',
    };

    const btnStyle = (active: boolean) => ({
        ...btnBase,
        bgcolor: active ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255,255,255,0.05)',
        color: active ? '#00e5ff' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${active ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
        '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.25)' },
        '&:active': { transform: 'scale(0.92)' },
    });

    return (
        <Box sx={{
            position: 'absolute',
            bottom: { xs: 12, md: 16 },
            right: { xs: 12, md: 16 },
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? 0.6 : 0.5,
            // 경량화: 투명도 높임
            bgcolor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 0.6,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
            {/* 관절 네비게이션 (수직) */}
            <Tooltip title="Previous Joint" placement="left">
                <IconButton size="small" onClick={handlePrevJoint} sx={btnStyle(false)}>
                    <KeyboardArrowUp fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title={isManualMode ? 'Exit Manual' : 'Manual Mode'} placement="left">
                <IconButton size="small" onClick={handleToggleManual} sx={btnStyle(isManualMode)}>
                    <TouchApp fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Next Joint" placement="left">
                <IconButton size="small" onClick={handleNextJoint} sx={btnStyle(false)}>
                    <KeyboardArrowDown fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* IK 모드 토글 */}
            <Tooltip title={isIKMode ? 'IK Mode (ON)' : 'IK Mode (drag end-effector)'} placement="left">
                <IconButton size="small" onClick={handleToggleIK} sx={{
                    ...btnStyle(isIKMode),
                    ...(isIKMode ? {
                        bgcolor: 'rgba(255, 107, 53, 0.2)',
                        color: '#ff6b35',
                        border: '1px solid rgba(255, 107, 53, 0.4)',
                        '&:hover': { bgcolor: 'rgba(255, 107, 53, 0.35)' },
                    } : {}),
                }}>
                    <PanTool fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* 구분선 */}
            <Box sx={{ my: 0.3, borderTop: '1px solid rgba(255,255,255,0.08)' }} />

            {/* 뷰 컨트롤 */}
            <Tooltip title="Reset Camera" placement="left">
                <IconButton size="small" onClick={onResetCamera} sx={btnStyle(false)}>
                    <Home fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Wireframe" placement="left">
                <IconButton size="small" onClick={toggleWireframe} sx={btnStyle(showWireframe)}>
                    <GridOn fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Collision Mesh" placement="left">
                <IconButton size="small" onClick={toggleCollision} sx={btnStyle(showCollision)}>
                    <ViewInAr fontSize="small" />
                </IconButton>
            </Tooltip>
        </Box>
    );
};
