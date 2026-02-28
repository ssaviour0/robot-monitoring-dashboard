import { useRef, useCallback, useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { TouchApp, Close } from '@mui/icons-material';
import { useRobotStore } from '../store/robotStore';
import { UR10_JOINT_DEFS } from '../types/robot';
import { normalizeJointValue, getJointStatusColor, radToDeg } from '../utils/joint.utils';

/**
 * JointPanel (v2) — 인터랙티브 관절 상태 오버레이
 *
 * 개선 사항:
 * 1. 관절 행 클릭 → 해당 관절 선택 (3D 하이라이트 + 하단 조작 UI 표시)
 * 2. 선택된 관절에 회전 다이얼 제공 (터치/드래그)
 * 3. 선택된 관절 강조 표시
 * 4. 모바일 친화: 터치 영역 확대, 포인터 이벤트 활성화
 */
export const JointPanel = () => {
    const jointAngles = useRobotStore((s) => s.jointAngles);
    const connectionStatus = useRobotStore((s) => s.connectionStatus);
    const selectedJointIndex = useRobotStore((s) => s.selectedJointIndex);
    const isManualMode = useRobotStore((s) => s.settings.isManualMode);
    const setSelectedJoint = useRobotStore((s) => s.setSelectedJoint);
    const setJointAngle = useRobotStore((s) => s.setJointAngle);
    const setManualMode = useRobotStore((s) => s.setManualMode);

    const statusColor = connectionStatus === 'CONNECTED' ? '#4caf50'
        : connectionStatus === 'CONNECTING' ? '#ff9800' : '#f44336';

    const selectedDef = selectedJointIndex >= 0 ? UR10_JOINT_DEFS[selectedJointIndex] : null;
    const selectedAngle = selectedDef ? (jointAngles[selectedDef.index] ?? 0) : 0;

    // ─── 관절 행 클릭 핸들러 ───
    const handleJointClick = useCallback((index: number) => {
        if (!isManualMode) setManualMode(true);
        setSelectedJoint(selectedJointIndex === index ? -1 : index);
    }, [isManualMode, selectedJointIndex, setSelectedJoint, setManualMode]);

    // ─── 원형 다이얼 드래그 ───
    const dialRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartDataRef = useRef<{ startX: number; startAngle: number } | null>(null);

    const handleDialDragStart = useCallback((clientX: number) => {
        if (selectedDef === null) return;
        setIsDragging(true);
        dragStartDataRef.current = { startX: clientX, startAngle: selectedAngle };
    }, [selectedDef, selectedAngle]);

    const handleDialDragMove = useCallback((clientX: number) => {
        if (!isDragging || !dragStartDataRef.current || !selectedDef) return;
        const dx = clientX - dragStartDataRef.current.startX;
        const sensitivity = 0.01; // 1px = 0.01 rad
        const newAngle = dragStartDataRef.current.startAngle + dx * sensitivity;
        const clamped = Math.max(selectedDef.limitLower, Math.min(selectedDef.limitUpper, newAngle));
        setJointAngle(selectedDef.index, clamped);
    }, [isDragging, selectedDef, setJointAngle]);

    const handleDialDragEnd = useCallback(() => {
        setIsDragging(false);
        dragStartDataRef.current = null;
    }, []);

    // 전역 마우스/터치 이벤트 (드래그 범위 확장)
    useEffect(() => {
        if (!isDragging) return;
        const onMove = (e: MouseEvent) => handleDialDragMove(e.clientX);
        const onUp = () => handleDialDragEnd();
        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1) handleDialDragMove(e.touches[0].clientX);
        };
        const onTouchEnd = () => handleDialDragEnd();

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, handleDialDragMove, handleDialDragEnd]);

    // ─── + / - 버튼 핸들러 (모바일 편의) ───
    const handleNudge = useCallback((delta: number) => {
        if (!selectedDef) return;
        const newAngle = selectedAngle + delta;
        const clamped = Math.max(selectedDef.limitLower, Math.min(selectedDef.limitUpper, newAngle));
        setJointAngle(selectedDef.index, clamped);
    }, [selectedDef, selectedAngle, setJointAngle]);

    return (
        <Box sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            minWidth: 220,
            maxWidth: 260,
            maxHeight: '75%',
            bgcolor: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            p: 1.5,
            color: '#fff',
            pointerEvents: 'auto',
            overflow: 'auto',
            userSelect: 'none',
            WebkitUserSelect: 'none',
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, px: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TouchApp sx={{ fontSize: '0.85rem', color: isManualMode ? '#00e5ff' : 'rgba(255,255,255,0.3)' }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 1, fontSize: '0.7rem' }}>
                        JOINT CONTROL
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        width: 6, height: 6, borderRadius: '50%',
                        bgcolor: statusColor,
                        boxShadow: `0 0 6px ${statusColor}`,
                    }} />
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: statusColor, fontWeight: 600 }}>
                        {connectionStatus}
                    </Typography>
                </Box>
            </Box>

            {/* Joint Rows — 클릭으로 선택 */}
            {UR10_JOINT_DEFS.map((def) => {
                const value = jointAngles[def.index] ?? 0;
                const normalized = normalizeJointValue(def.name, value);
                const barColor = getJointStatusColor(def.name, value);
                const isSelected = def.index === selectedJointIndex;

                return (
                    <Box
                        key={def.name}
                        onClick={() => handleJointClick(def.index)}
                        sx={{
                            mb: 0.5,
                            p: 0.8,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'transparent',
                            border: isSelected ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                                bgcolor: isSelected ? 'rgba(0, 229, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                            },
                            '&:active': {
                                bgcolor: 'rgba(0, 229, 255, 0.25)',
                                transform: 'scale(0.98)',
                            },
                            // 모바일: 터치 영역 최소 44px
                            minHeight: '36px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                            <Typography variant="caption" sx={{
                                fontSize: '0.65rem', fontWeight: isSelected ? 800 : 600,
                                color: isSelected ? '#00e5ff' : 'rgba(255,255,255,0.7)',
                            }}>
                                {isSelected ? '● ' : ''}{def.shortName}
                            </Typography>
                            <Typography variant="caption" sx={{
                                fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace',
                                color: isSelected ? '#00e5ff' : barColor,
                            }}>
                                {radToDeg(value)}° <span style={{ fontSize: '0.5rem', opacity: 0.6 }}>({value.toFixed(2)})</span>
                            </Typography>
                        </Box>
                        <Box sx={{
                            width: '100%', height: 3, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden'
                        }}>
                            <Box sx={{
                                width: `${normalized * 100}%`, height: '100%',
                                bgcolor: isSelected ? '#00e5ff' : barColor, borderRadius: 2,
                                transition: 'width 0.08s ease-out',
                            }} />
                        </Box>
                    </Box>
                );
            })}

            {/* ─── 선택된 관절 조작 패널 ─── */}
            {selectedDef && (
                <Box sx={{
                    mt: 1,
                    p: 1.5,
                    bgcolor: 'rgba(0, 229, 255, 0.06)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 229, 255, 0.15)',
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#00e5ff', fontSize: '0.7rem' }}>
                            {selectedDef.shortName} CONTROL
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setSelectedJoint(-1)}
                            sx={{ color: 'rgba(255,255,255,0.5)', p: 0.3, '&:hover': { color: '#fff' } }}
                        >
                            <Close sx={{ fontSize: '0.8rem' }} />
                        </IconButton>
                    </Box>

                    {/* 방향 조작: ◀ [드래그 바] ▶ */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {/* - 버튼 */}
                        <Box
                            onClick={() => handleNudge(-0.1)}
                            sx={{
                                width: 32, height: 32, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                fontSize: '1rem', fontWeight: 700, color: '#00e5ff',
                                '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.2)' },
                                '&:active': { bgcolor: 'rgba(0, 229, 255, 0.4)', transform: 'scale(0.9)' },
                                transition: 'all 0.1s',
                                userSelect: 'none', WebkitUserSelect: 'none',
                                flexShrink: 0,
                            }}
                        >
                            −
                        </Box>

                        {/* 드래그 바 */}
                        <Box
                            ref={dialRef}
                            onMouseDown={(e) => handleDialDragStart(e.clientX)}
                            onTouchStart={(e) => {
                                if (e.touches.length === 1) handleDialDragStart(e.touches[0].clientX);
                            }}
                            sx={{
                                flex: 1,
                                height: 36,
                                bgcolor: 'rgba(0, 229, 255, 0.08)',
                                borderRadius: '18px',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                border: isDragging ? '1px solid #00e5ff' : '1px solid rgba(0, 229, 255, 0.15)',
                                transition: 'border 0.1s',
                            }}
                        >
                            {/* 진행 바 */}
                            <Box sx={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: `${normalizeJointValue(selectedDef.name, selectedAngle) * 100}%`,
                                bgcolor: 'rgba(0, 229, 255, 0.2)',
                                transition: isDragging ? 'none' : 'width 0.08s',
                            }} />
                            {/* 중앙 텍스트 */}
                            <Box sx={{
                                position: 'absolute', inset: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                pointerEvents: 'none',
                            }}>
                                <Typography sx={{
                                    fontSize: '0.8rem', fontWeight: 800, fontFamily: 'monospace',
                                    color: '#00e5ff',
                                    textShadow: '0 0 8px rgba(0, 229, 255, 0.5)',
                                }}>
                                    {radToDeg(selectedAngle)}°
                                </Typography>
                            </Box>
                            {/* 드래그 힌트 화살표 */}
                            {!isDragging && (
                                <Box sx={{
                                    position: 'absolute', inset: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    px: 0.8, pointerEvents: 'none', opacity: 0.3,
                                }}>
                                    <Typography sx={{ fontSize: '0.6rem' }}>◀</Typography>
                                    <Typography sx={{ fontSize: '0.6rem' }}>▶</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* + 버튼 */}
                        <Box
                            onClick={() => handleNudge(0.1)}
                            sx={{
                                width: 32, height: 32, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: 'rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                fontSize: '1rem', fontWeight: 700, color: '#00e5ff',
                                '&:hover': { bgcolor: 'rgba(0, 229, 255, 0.2)' },
                                '&:active': { bgcolor: 'rgba(0, 229, 255, 0.4)', transform: 'scale(0.9)' },
                                transition: 'all 0.1s',
                                userSelect: 'none', WebkitUserSelect: 'none',
                                flexShrink: 0,
                            }}
                        >
                            +
                        </Box>
                    </Box>

                    {/* 범위 표시 */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, px: 0.5 }}>
                        <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                            {radToDeg(selectedDef.limitLower)}°
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                            ◀ drag ▶
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>
                            {radToDeg(selectedDef.limitUpper)}°
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* 힌트 텍스트 */}
            {selectedJointIndex < 0 && (
                <Typography variant="caption" sx={{
                    display: 'block', textAlign: 'center', mt: 1,
                    color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', fontSize: '0.55rem'
                }}>
                    Tap a joint to select & control
                </Typography>
            )}
        </Box>
    );
};
