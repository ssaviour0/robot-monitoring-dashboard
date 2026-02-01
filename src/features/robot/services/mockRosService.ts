import { JointState, Odometry, DiagnosticStatus } from '../types/ros';

/**
 * MockRosService
 * Generates simulated ROS2-compliant data streams.
 */
export class MockRosService {
    private static instance: MockRosService;
    private subscribers: Map<string, Array<(data: unknown) => void>> = new Map();

    private constructor() {
        this.startStreaming();
    }

    public static getInstance(): MockRosService {
        if (!MockRosService.instance) {
            MockRosService.instance = new MockRosService();
        }
        return MockRosService.instance;
    }

    public subscribe<T>(topic: string, callback: (data: T) => void) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic)?.push(callback as (data: unknown) => void);

        return () => {
            const subs = this.subscribers.get(topic);
            if (subs) {
                this.subscribers.set(topic, subs.filter(s => s !== (callback as unknown as (data: unknown) => void)));
            }
        };
    }

    private startStreaming() {
        let frame = 0;
        const poses = [
            [0, -1.57, 0, -1.57, 0, 0],         // Home
            [0.5, -1.0, 1.2, -1.0, 1.57, 0],    // Picking
            [0.5, -1.2, 0.8, -0.8, 1.57, 0],    // Lifting
            [-0.5, -1.0, 1.2, -1.0, 1.57, 0],   // Placing
            [-0.5, -1.2, 0.8, -0.8, 1.57, 0],   // Lifting (return)
            [0, -1.3, 0.5, -0.5, 0.8, 0.5]      // Scanning
        ];

        let currentPoseIdx = 0;
        let nextPoseIdx = 1;
        let progress = 0;
        const currentJoints = [...poses[0]];

        const loop = () => {
            frame++;
            const time = Date.now() / 1000;
            const secs = Math.floor(time);
            const nsecs = Math.floor((time - secs) * 1e9);

            // Coordinated Natural Motion
            progress += 0.005; // Adjust speed here
            if (progress >= 1) {
                progress = 0;
                currentPoseIdx = nextPoseIdx;
                nextPoseIdx = (nextPoseIdx + 1) % poses.length;
            }

            // Linear interpolation with easing
            const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            for (let i = 0; i < currentJoints.length; i++) {
                currentJoints[i] = poses[currentPoseIdx][i] + (poses[nextPoseIdx][i] - poses[currentPoseIdx][i]) * ease;
            }

            const jointState: JointState = {
                header: { stamp: { secs, nsecs }, frame_id: 'base_link' },
                name: ['shoulder_pan', 'shoulder_lift', 'elbow', 'wrist_1', 'wrist_2', 'wrist_3'],
                position: [...currentJoints],
                velocity: [],
                effort: []
            };
            this.publish('/joint_states', jointState);

            // 2. Odometry (Fixed position)
            const odom: Odometry = {
                header: { stamp: { secs, nsecs }, frame_id: 'odom' },
                child_frame_id: 'base_footprint',
                pose: {
                    pose: {
                        position: { x: 0, y: 0, z: 0 },
                        orientation: { x: 0, y: 0, z: 0, w: 1 }
                    }
                }
            };
            this.publish('/odom', odom);

            // 3. Diagnostics (Update less frequently for readability, e.g., every 30 frames)
            if (frame % 30 === 0) {
                const diag: DiagnosticStatus = {
                    level: Math.random() > 0.99 ? 2 : (Math.random() > 0.95 ? 1 : 0),
                    name: 'robot_health',
                    message: 'System running',
                    hardware_id: 'ur10_arm',
                    values: [
                        { key: 'power', value: `${(350 + Math.sin(time * 0.05) * 30 + Math.random() * 5).toFixed(1)}W` },
                        { key: 'voltage', value: `${(230 + Math.sin(time * 0.1) * 1).toFixed(1)}V` },
                        { key: 'temperature', value: `${(45 + Math.sin(time * 0.02) * 3).toFixed(1)}°C` }
                    ]
                };
                this.publish('/diagnostics', diag);
            }

            requestAnimationFrame(loop);
        };

        loop();
    }

    private publish(topic: string, data: unknown) {
        this.subscribers.get(topic)?.forEach(callback => (callback as (d: unknown) => void)(data));
    }
}
