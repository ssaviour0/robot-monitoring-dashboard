import { UR10_JOINT_DEFS } from '../types/robot';

/**
 * 관절 값을 가동 범위 내 0~1로 정규화
 * JointPanel 프로그레스 바에 사용
 */
export const normalizeJointValue = (jointName: string, value: number): number => {
    const joint = UR10_JOINT_DEFS.find(j => j.name === jointName);
    if (!joint) return 0.5;
    const range = joint.limitUpper - joint.limitLower;
    if (range === 0) return 0.5;
    return Math.max(0, Math.min(1, (value - joint.limitLower) / range));
};

/**
 * 관절 값의 범위 초과 여부 확인
 * JointPanel 색상 결정에 사용
 */
export const isJointOutOfRange = (jointName: string, value: number): boolean => {
    const joint = UR10_JOINT_DEFS.find(j => j.name === jointName);
    if (!joint) return false;
    return value < joint.limitLower || value > joint.limitUpper;
};

/**
 * 관절 값의 경계 근접 여부 (범위의 90% 이상 사용 시)
 * JointPanel 경고 색상(노랑)에 사용
 */
export const isJointNearLimit = (jointName: string, value: number, threshold = 0.9): boolean => {
    const joint = UR10_JOINT_DEFS.find(j => j.name === jointName);
    if (!joint) return false;
    const range = joint.limitUpper - joint.limitLower;
    const distFromCenter = Math.abs(value - (joint.limitLower + range / 2));
    return distFromCenter > (range / 2) * threshold;
};

/**
 * 관절별 프로그레스 바 색상 결정
 * @returns HEX string
 */
export const getJointStatusColor = (jointName: string, value: number): string => {
    if (isJointOutOfRange(jointName, value)) return '#f44336'; // red
    if (isJointNearLimit(jointName, value)) return '#ff9800';  // amber
    return '#00e5ff'; // cyan (primary)
};

/**
 * 라디안 → 도 변환
 */
export const radToDeg = (rad: number): number => Math.round(rad * (180 / Math.PI));

/**
 * 도 → 라디안 변환
 */
export const degToRad = (deg: number): number => deg * (Math.PI / 180);
