import { useEffect } from 'react';
import { useRobotStore } from '../store/robotStore';
import { MockRosService } from '../services/mockRosService';
import { JointState, Odometry, DiagnosticStatus } from '../types/ros';

/**
 * useRosBridge
 * Bridges the MockRosService with the Zustand robot store.
 */
export const useRosBridge = () => {
    const setJointAngle = useRobotStore(state => state.setJointAngle);
    const updateTelemetry = useRobotStore(state => state.updateTelemetry);
    const setBasePose = useRobotStore(state => state.setBasePose);

    useEffect(() => {
        const ros = MockRosService.getInstance();

        // 1. Subscribe to Joint States
        const unsubJoints = ros.subscribe<JointState>('/joint_states', (msg) => {
            msg.position.forEach((angle, index) => {
                setJointAngle(index, angle);
            });
        });

        // 2. Subscribe to Odometry
        const unsubOdom = ros.subscribe<Odometry>('/odom', (msg) => {
            setBasePose({
                position: [msg.pose.pose.position.x, msg.pose.pose.position.y, msg.pose.pose.position.z],
                rotation: [msg.pose.pose.orientation.x, msg.pose.pose.orientation.y, msg.pose.pose.orientation.z],
            });
        });

        // 3. Subscribe to Diagnostics
        const unsubDiag = ros.subscribe<DiagnosticStatus>('/diagnostics', (msg) => {
            const powerConsumption = parseFloat(msg.values.find(v => v.key === 'power')?.value || '350');
            const voltage = parseFloat(msg.values.find(v => v.key === 'voltage')?.value || '230');
            const temperature = parseFloat(msg.values.find(v => v.key === 'temperature')?.value || '35');

            let status: 'idle' | 'running' | 'error' | 'e-stop' = 'idle';
            if (msg.level === 0) status = 'running';
            if (msg.level === 1) status = 'idle';
            if (msg.level === 2) status = 'error';

            updateTelemetry({
                powerConsumption,
                voltage,
                temperature,
                status,
                speed: status === 'running' ? 0.5 : 0
            });
        });

        return () => {
            unsubJoints();
            unsubOdom();
            unsubDiag();
        };
    }, [setJointAngle, updateTelemetry, setBasePose]);
};
