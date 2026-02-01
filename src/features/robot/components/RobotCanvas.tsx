import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { useRosBridge } from '../hooks/useRosBridge';
import { useRobotStore } from '../store/robotStore';
import { UR10Robot } from './UR10Robot';
import { CanvasLoader } from './CanvasLoader';

export const RobotCanvas = () => {
    // Initialize ROS2 simulation bridge
    useRosBridge();

    const darkMode = useRobotStore((state) => state.settings.darkMode);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '400px', // Ensure visibility on tall mobile screens
            background: darkMode
                ? 'radial-gradient(circle, #1a2c3e 0%, #0a1929 100%)'
                : 'radial-gradient(circle, #f0f4f8 0%, #d9e2ec 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: darkMode
                ? 'inset 0 0 50px rgba(0,0,0,0.5)'
                : 'inset 0 0 50px rgba(0,0,0,0.05)',
            border: darkMode
                ? '1px solid rgba(255, 255, 255, 0.05)'
                : '1px solid rgba(0, 0, 0, 0.05)'
        }}>
            <Suspense fallback={<CanvasLoader />}>
                <Canvas shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
                    <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={50} />
                    <OrbitControls
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.75}
                        enableZoom={true}
                        minDistance={2}
                        maxDistance={20}
                        target={[0, 0.5, 0]}
                    />

                    <gridHelper args={[20, 20, darkMode ? 0x444444 : 0xcccccc, darkMode ? 0x222222 : 0xeeeeee]} />
                    <axesHelper args={[2]} />

                    <UR10Robot />

                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={darkMode ? 0.6 : 0.3}
                        scale={10}
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
                    <pointLight position={[-10, 10, -10]} intensity={1} color={darkMode ? "#00e5ff" : "#007bb2"} />
                    <spotLight
                        position={[10, 20, 10]}
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


