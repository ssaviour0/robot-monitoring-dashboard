import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import { useGraph } from '@react-three/fiber';

export const ModelDebugger = () => {
    const { scene } = useGLTF('/assets/models/robot.glb');
    const { nodes } = useGraph(scene);

    useEffect(() => {
        console.log('--- Robot Model Nodes ---');
        Object.keys(nodes).forEach(name => {
            console.log(name);
        });
        console.log('-------------------------');
    }, [nodes]);

    return null;
};
