import { useGLTF, Outlines, Center } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { useRobotStore } from '../store/robotStore';

/**
 * UR10Robot Component
 * Loads and animates the Universal Robotics UR-10 model with precise joint mapping.
 */
export const UR10Robot = () => {
    const { scene } = useGLTF('/assets/models/robot.glb');
    const { nodes } = useGraph(scene);
    const robotRef = useRef<THREE.Group>(null);
    const jointAngles = useRobotStore((state) => state.jointAngles);

    // Log bounding box to debug scale issues
    useEffect(() => {
        if (scene) {
            const box = new THREE.Box3().setFromObject(scene);
            const size = new THREE.Vector3();
            box.getSize(size);
            console.log('Robot Model Bounding Box Size:', size);
            console.log('Robot Model Bounding Box Center:', box.getCenter(new THREE.Vector3()));
        }
    }, [scene]);

    // Precise mapping for standard exported glTF models
    const joints = useMemo(() => {
        return [
            nodes.shoulder_pan_joint || nodes.shoulder_link || nodes.Base || nodes.base_link,
            nodes.shoulder_lift_joint || nodes.upper_arm_link || nodes.Shoulder || nodes.shoulder_link_1,
            nodes.elbow_joint || nodes.forearm_link || nodes.UpperArm || nodes.upper_arm_link_1,
            nodes.wrist_1_joint || nodes.wrist_1_link || nodes.Forearm || nodes.forearm_link_1,
            nodes.wrist_2_joint || nodes.wrist_2_link || nodes.Wrist1 || nodes.wrist_1_link_1,
            nodes.wrist_3_joint || nodes.wrist_3_link || nodes.Wrist2 || nodes.wrist_2_link_1,
        ];
    }, [nodes]);

    useFrame(() => {
        if (!robotRef.current) return;

        joints.forEach((joint, index) => {
            if (joint && index < jointAngles.length) {
                // UR10 Standard Kinematics Pivot Mapping
                if (index === 0 || index === 4) {
                    joint.rotation.y = jointAngles[index];
                } else {
                    joint.rotation.z = jointAngles[index];
                }
            }
        });
    });

    return (
        <Center top>
            <primitive
                ref={robotRef}
                object={scene}
                scale={[0.0012, 0.0012, 0.0012]} // Slightly enlarged from 0.001
                position={[0, 0, 0]}
                castShadow
                receiveShadow
            >
                <Outlines thickness={2} color="#00e5ff" />
            </primitive>
        </Center>
    );
};

// Preload to avoid popping
useGLTF.preload('/assets/models/robot.glb');
