import { useEffect } from 'react';
import { useRobotStore } from '../store/robotStore';
import { MockRosService } from '../services/mockRosService';
import { JointState, Odometry, DiagnosticStatus } from '../types/ros';
import type { JointStateMap } from '../types/robot';

/**
 * useRosBridge
 * Bridges the MockRosService with the Zustand robot store.
 * 관절 데이터를 인덱스 기반 + 이름 기반으로 동시 업데이트
 */
export const useRosBridge = () => {
    const setJointAngle = useRobotStore(state => state.setJointAngle);
    const setJointStateMap = useRobotStore(state => state.setJointStateMap);
    const setConnectionStatus = useRobotStore(state => state.setConnectionStatus);
    const updateTelemetry = useRobotStore(state => state.updateTelemetry);
    const setBasePose = useRobotStore(state => state.setBasePose);
    const isManualMode = useRobotStore(state => state.settings.isManualMode);

    useEffect(() => {
        const ros = MockRosService.getInstance();
        setConnectionStatus('CONNECTED');

        // 1. Joint States — 인덱스 기반 + 이름 기반 동시 업데이트
        // 수동 모드일 때는 관절 각도 업데이트를 건너뜀
        const unsubJoints = ros.subscribe<JointState>('/joint_states', (msg) => {
            if (isManualMode) return;

            // 레거시: 인덱스 기반 (6축 배열)
            msg.position.forEach((angle, index) => {
                setJointAngle(index, angle);
            });

            // 신규: 이름 기반 JointStateMap (URDF 연동용)
            const map: JointStateMap = {};
            msg.name.forEach((name, i) => {
                if (i < msg.position.length) map[name] = msg.position[i];
            });
            setJointStateMap(map);
        });

        // 2. Odometry
        const unsubOdom = ros.subscribe<Odometry>('/odom', (msg) => {
            setBasePose({
                position: [msg.pose.pose.position.x, msg.pose.pose.position.y, msg.pose.pose.position.z],
                rotation: [msg.pose.pose.orientation.x, msg.pose.pose.orientation.y, msg.pose.pose.orientation.z],
            });
        });

        // 3. Diagnostics
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
            setConnectionStatus('DISCONNECTED');
        };
    }, [setJointAngle, setJointStateMap, setConnectionStatus, updateTelemetry, setBasePose, isManualMode]);
};
