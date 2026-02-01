export interface Header {
    stamp: {
        secs: number;
        nsecs: number;
    };
    frame_id: string;
}

export interface JointState {
    header: Header;
    name: string[];
    position: number[];
    velocity: number[];
    effort: number[];
}

export interface Odometry {
    header: Header;
    child_frame_id: string;
    pose: {
        pose: {
            position: { x: number; y: number; z: number };
            orientation: { x: number; y: number; z: number; w: number };
        };
    };
}

export interface DiagnosticStatus {
    level: number; // 0: OK, 1: WARN, 2: ERROR, 3: STALE
    name: string;
    message: string;
    hardware_id: string;
    values: { key: string; value: string }[];
}
