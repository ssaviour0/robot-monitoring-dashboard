export interface RobotState {
    // 6-axis joint angles in radians
    jointAngles: [number, number, number, number, number, number];

    // Base position and rotation
    basePose: {
        position: [number, number, number];
        rotation: [number, number, number];
    };

    // Telemetry data
    telemetry: {
        powerConsumption: number; // in Watts (W)
        voltage: number;          // in Volts (V)
        speed: number;            // current speed factor
        temperature: number;      // in Celsius
        status: 'idle' | 'running' | 'error' | 'e-stop';
    };
    settings: {
        darkMode: boolean;
    };
}

export interface RobotActions {
    setJointAngle: (index: number, angle: number) => void;
    updateTelemetry: (data: Partial<RobotState['telemetry']>) => void;
    setBasePose: (pose: Partial<RobotState['basePose']>) => void;
    toggleDarkMode: () => void;
    resetRobot: () => void;
}

export type RobotStore = RobotState & RobotActions;
