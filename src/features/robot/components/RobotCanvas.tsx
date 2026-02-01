import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { useRosBridge } from '../hooks/useRosBridge';
import { UR10Robot } from './UR10Robot';
import { CanvasLoader } from './CanvasLoader';

export const RobotCanvas = () => {
    // Initialize ROS2 simulation bridge
    useRosBridge();

    return (
        <div style={{ width: '100%', height: 'calc(100vh - 120px)', background: '#0a1929', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <Suspense fallback={<CanvasLoader />}>
                <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[6, 5, 6]} fov={50} />
                    <OrbitControls
                        makeDefault
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 1.75}
                        enableZoom={true}
                        minDistance={2}
                        maxDistance={20}
                        target={[0, 1, 0]}
                    />

                    <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                    <axesHelper args={[5]} />

                    <UR10Robot />

                    <ContactShadows
                        position={[0, 0, 0]}
                        opacity={0.4}
                        scale={10}
                        blur={2}
                        far={4.5}
                    />

                    <Environment preset="city" />
                    <ambientLight intensity={0.7} />
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={1}
                        castShadow
                    />
                </Canvas>
            </Suspense>
        </div>
    );
};


