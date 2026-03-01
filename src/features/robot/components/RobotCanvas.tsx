import { Suspense, useCallback, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useRosBridge } from '../hooks/useRosBridge';
import { useRobotStore } from '../store/robotStore';
import { useMediaQuery } from '@mui/material';
import { UR10Robot } from './UR10Robot';
import { CanvasLoader } from './CanvasLoader';
import { JointPanel } from './JointPanel';
import { ControlToolbar } from './ControlToolbar';

export const RobotCanvas = () => {
    // Initialize ROS2 simulation bridge
    useRosBridge();

    const darkMode = useRobotStore((state) => state.settings.darkMode);
    const orbitRef = useRef<OrbitControlsImpl>(null);
    const [modelLoaded, setModelLoaded] = useState(false);

    const handleResetCamera = useCallback(() => {
        if (orbitRef.current) {
            orbitRef.current.reset();
        }
    }, []);

    const handleModelLoaded = useCallback(() => {
        setModelLoaded(true);
    }, []);

    const handleModelError = useCallback((error: string) => {
        console.error('[UR10Robot] URDF 로딩 실패:', error);
    }, []);

    const isMobile = useMediaQuery('(max-width:900px)');

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
            background: darkMode
                ? 'radial-gradient(circle, #1a2c3e 0%, #0a1929 100%)'
                : 'radial-gradient(circle, #f0f4f8 0%, #d9e2ec 100%)',
            borderRadius: isMobile ? '8px' : '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: darkMode
                ? 'inset 0 0 50px rgba(0,0,0,0.5)'
                : 'inset 0 0 50px rgba(0,0,0,0.05)',
            border: darkMode
                ? '1px solid rgba(255, 255, 255, 0.05)'
                : '1px solid rgba(0, 0, 0, 0.05)'
        }}>
            {/* 3D Canvas 위 오버레이 UI — 모델 로딩 후에만 관절 패널 표시 */}
            {modelLoaded && <JointPanel />}

            {/* 컨트롤 바 — 모바일에서는 터치 전용이므로 숨김 */}
            {!isMobile && <ControlToolbar onResetCamera={handleResetCamera} />}

            <Suspense fallback={<CanvasLoader />}>
                <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
                    {/* URDF 모델은 glTF 모델 대비 크기가 다르므로(미터 단위) 카메라 위치 조정 */}
                    <PerspectiveCamera makeDefault position={[2.5, 2.5, 2.5]} fov={50} />
                    <OrbitControls
                        ref={orbitRef}
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.75}
                        enableZoom={true}
                        minDistance={0.5}
                        maxDistance={15}
                        target={[0, 0.5, 0]}
                    />

                    <gridHelper args={[20, 20, darkMode ? 0x444444 : 0xcccccc, darkMode ? 0x222222 : 0xeeeeee]} />
                    <axesHelper args={[0.5]} />

                    <UR10Robot
                        onLoaded={handleModelLoaded}
                        onError={handleModelError}
                        orbitControlsRef={orbitRef}
                    />

                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={darkMode ? 0.6 : 0.3}
                        scale={8}
                        blur={2}
                        far={4.5}
                    />

                    <Environment preset="city" />
                    <ambientLight intensity={darkMode ? 1.5 : 1} />
                    <directionalLight
                        position={[5, 10, 5]}
                        intensity={darkMode ? 2 : 1.5}
                        castShadow
                        shadow-mapSize={[1024, 1024]}
                    />
                    <pointLight position={[-5, 5, -5]} intensity={1} color={darkMode ? "#00e5ff" : "#007bb2"} />
                    <spotLight
                        position={[5, 10, 5]}
                        angle={0.15}
                        penumbra={1}
                        intensity={darkMode ? 2 : 1.5}
                        castShadow
                    />
                </Canvas>
            </Suspense>
        </div>
    );
};
