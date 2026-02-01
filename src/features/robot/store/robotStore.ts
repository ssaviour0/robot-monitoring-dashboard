import { create } from 'zustand';
import { RobotStore, RobotState } from '../types/robot';

const initialState: RobotState = {
    jointAngles: [0, 0, 0, 0, 0, 0],
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
    },
};

export const useRobotStore = create<RobotStore>((set) => ({
    ...initialState,

    setJointAngle: (index, angle) =>
        set((state) => {
            const newAngles = [...state.jointAngles] as [number, number, number, number, number, number];
            newAngles[index] = angle;
            return { jointAngles: newAngles };
        }),

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

    resetRobot: () => set(initialState),
}));
