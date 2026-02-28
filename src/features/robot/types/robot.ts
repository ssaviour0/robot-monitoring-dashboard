/** UR10 URDF 표준 관절 정의 */
export const UR10_JOINT_DEFS = [
    { name: 'shoulder_pan_joint', shortName: 'S.Pan', index: 0, limitLower: -6.2832, limitUpper: 6.2832 },
    { name: 'shoulder_lift_joint', shortName: 'S.Lift', index: 1, limitLower: -6.2832, limitUpper: 6.2832 },
    { name: 'elbow_joint', shortName: 'Elbow', index: 2, limitLower: -3.1416, limitUpper: 3.1416 },
    { name: 'wrist_1_joint', shortName: 'W.1', index: 3, limitLower: -6.2832, limitUpper: 6.2832 },
    { name: 'wrist_2_joint', shortName: 'W.2', index: 4, limitLower: -6.2832, limitUpper: 6.2832 },
    { name: 'wrist_3_joint', shortName: 'W.3', index: 5, limitLower: -6.2832, limitUpper: 6.2832 },
] as const;

/** URDF 표준 관절 이름 배열 (편의용) */
export const UR10_JOINT_NAMES = UR10_JOINT_DEFS.map(j => j.name);

/** 관절명 → 값 매핑 타입 */
export type JointStateMap = Record<string, number>;

/** 연결 상태 리터럴 */
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';

// ─── 기존 인터페이스 (확장) ───

export interface RobotState {
    // 6-axis joint angles in radians (레거시 호환)
    jointAngles: [number, number, number, number, number, number];

    // 이름 기반 관절 상태 (URDF 연동용)
    jointStateMap: JointStateMap;

    // 연결 상태
    connectionStatus: ConnectionStatus;
    latencyMs: number;
    lastUpdateTimestamp: number | null;

    // 선택된 관절 인덱스 (-1 = 선택 없음)
    selectedJointIndex: number;

    // Base position and rotation
    basePose: {
        position: [number, number, number];
        rotation: [number, number, number];
    };

    // Telemetry data
    telemetry: {
        powerConsumption: number;
        voltage: number;
        speed: number;
        temperature: number;
        status: 'idle' | 'running' | 'error' | 'e-stop';
    };

    settings: {
        darkMode: boolean;
        showWireframe: boolean;
        showCollision: boolean;
        isManualMode: boolean;
        isIKMode: boolean;
    };
}

export interface RobotActions {
    setJointAngle: (index: number, angle: number) => void;
    setJointStateMap: (map: JointStateMap) => void;
    setConnectionStatus: (status: ConnectionStatus) => void;
    setManualMode: (mode: boolean) => void;
    setSelectedJoint: (index: number) => void;
    updateTelemetry: (data: Partial<RobotState['telemetry']>) => void;
    setBasePose: (pose: Partial<RobotState['basePose']>) => void;
    toggleDarkMode: () => void;
    toggleWireframe: () => void;
    toggleCollision: () => void;
    toggleIKMode: () => void;
    resetRobot: () => void;
}

export type RobotStore = RobotState & RobotActions;
