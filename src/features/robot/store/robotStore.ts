import { create } from 'zustand';
import { RobotStore, RobotState } from '../types/robot';

const initialState: RobotState = {
    jointAngles: [0, 0, 0, 0, 0, 0],
    jointStateMap: {},
    connectionStatus: 'DISCONNECTED',
    latencyMs: 0,
    lastUpdateTimestamp: null,
    selectedJointIndex: -1,
    basePose: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
    },
    telemetry: {
        powerConsumption: 350,
        voltage: 230,
        speed: 0,
        temperature: 35,
        status: 'idle',
    },
    settings: {
        darkMode: false,
        showWireframe: false,
        showCollision: false,
        isManualMode: false,
        isIKMode: false,
    },
};

export const useRobotStore = create<RobotStore>((set) => ({
    ...initialState,

    setJointAngle: (index, angle) =>
        set((state) => {
            const newAngles = [...state.jointAngles] as [number, number, number, number, number, number];
            newAngles[index] = angle;

            const newMap = { ...state.jointStateMap };
            const standardizedName = [
                'shoulder_pan_joint', 'shoulder_lift_joint', 'elbow_joint',
                'wrist_1_joint', 'wrist_2_joint', 'wrist_3_joint'
            ][index];

            if (standardizedName) newMap[standardizedName] = angle;

            return { jointAngles: newAngles, jointStateMap: newMap };
        }),

    setJointStateMap: (map) =>
        set({ jointStateMap: map, lastUpdateTimestamp: Date.now() }),

    setConnectionStatus: (status) =>
        set({ connectionStatus: status }),

    setManualMode: (mode) =>
        set((state) => ({
            settings: { ...state.settings, isManualMode: mode }
        })),

    setSelectedJoint: (index) =>
        set({ selectedJointIndex: index }),

    updateTelemetry: (data) =>
        set((state) => ({
            telemetry: { ...state.telemetry, ...data },
        })),

    setBasePose: (pose) =>
        set((state) => ({
            basePose: { ...state.basePose, ...pose },
        })),

    toggleDarkMode: () =>
        set((state) => ({
            settings: { ...state.settings, darkMode: !state.settings.darkMode },
        })),

    toggleWireframe: () =>
        set((state) => ({
            settings: { ...state.settings, showWireframe: !state.settings.showWireframe },
        })),

    toggleCollision: () =>
        set((state) => ({
            settings: { ...state.settings, showCollision: !state.settings.showCollision },
        })),

    toggleIKMode: () =>
        set((state) => ({
            settings: { ...state.settings, isIKMode: !state.settings.isIKMode },
        })),

    resetRobot: () => set(initialState),
}));
