import * as THREE from 'three';

/**
 * CCD (Cyclic Coordinate Descent) Inverse Kinematics Solver
 *
 * UR10 로봇의 6축 관절 체인에서 엔드 이펙터를 목표 위치로
 * 이동시키기 위한 각 관절의 각도를 역산출합니다.
 *
 * 작동 원리:
 * 1. 관절 체인을 끝(wrist_3)에서 처음(shoulder_pan)까지 역순 순회
 * 2. 각 관절에서 "현재 관절→엔드 이펙터" 벡터와 "현재 관절→목표" 벡터의 각도를 계산
 * 3. 관절의 회전축에 투영하여 실제 회전 가능한 각도만 추출
 * 4. 관절 제한(limits)을 적용하여 유효 범위 내로 클램핑
 * 5. 수렴할 때까지 반복 (또는 최대 반복 횟수에 도달)
 */

export interface IKJointConfig {
    /** URDF joint THREE.Object3D */
    joint: THREE.Object3D & { axis?: THREE.Vector3; angle?: number; setJointValue?: (v: number) => void };
    /** Joint index in UR10_JOINT_DEFS */
    index: number;
    /** Lower angle limit (radians) */
    limitLower: number;
    /** Upper angle limit (radians) */
    limitUpper: number;
}

export interface IKResult {
    /** 수렴 여부 */
    converged: boolean;
    /** 실제 반복 횟수 */
    iterations: number;
    /** 최종 엔드 이펙터↔타겟 거리 */
    distance: number;
    /** 각 관절의 최종 각도 */
    angles: number[];
}

export interface IKSolverOptions {
    /** 최대 반복 횟수 (기본: 20) */
    maxIterations?: number;
    /** 수렴 허용 거리 (미터, 기본: 0.001 = 1mm) */
    tolerance?: number;
    /** 1번 반복당 최대 각도 변화 (rad, 기본: 0.3 ≈ 17°) — 부드러운 움직임 */
    maxStepAngle?: number;
    /** damping factor (0~1, 기본: 0.8) — 오버슈트 방지 */
    damping?: number;
}

const DEFAULT_OPTIONS: Required<IKSolverOptions> = {
    maxIterations: 20,
    tolerance: 0.002, // 2mm
    maxStepAngle: 0.25, // ~14° per step — smooth
    damping: 0.7,
};

/**
 * CCD IK 솔버
 *
 * @param joints 관절 체인 배열 (base → tip 순서, 즉 shoulder_pan → wrist_3)
 * @param endEffector 엔드 이펙터 3D 오브젝트 (ee_link 또는 마지막 관절 끝)
 * @param targetWorldPos 드래그 목표 월드 좌표
 * @param options 솔버 옵션
 * @returns IKResult
 */
export function solveCCDIK(
    joints: IKJointConfig[],
    endEffector: THREE.Object3D,
    targetWorldPos: THREE.Vector3,
    options?: IKSolverOptions,
): IKResult {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const angles = joints.map(j => j.joint.angle ?? 0);

    let converged = false;
    let iterations = 0;
    let distance = Infinity;

    // 재사용 벡터 (GC 방지)
    const eeWorldPos = new THREE.Vector3();
    const jointWorldPos = new THREE.Vector3();
    const toEE = new THREE.Vector3();
    const toTarget = new THREE.Vector3();
    const jointWorldQuat = new THREE.Quaternion();
    const invQuat = new THREE.Quaternion();

    for (let iter = 0; iter < opts.maxIterations; iter++) {
        iterations = iter + 1;

        // CCD: 끝 관절부터 역순으로 처리
        for (let i = joints.length - 1; i >= 0; i--) {
            const { joint, limitLower, limitUpper } = joints[i];

            // 1. 현재 엔드 이펙터 월드 위치
            endEffector.getWorldPosition(eeWorldPos);

            // 이미 충분히 가까우면 이 관절 건너뜀
            distance = eeWorldPos.distanceTo(targetWorldPos);
            if (distance < opts.tolerance) {
                converged = true;
                break;
            }

            // 2. 현재 관절의 월드 위치와 방향
            joint.getWorldPosition(jointWorldPos);
            joint.getWorldQuaternion(jointWorldQuat);

            // 3. 관절 → 엔드이펙터 / 관절 → 타겟 벡터 (관절 로컬 공간)
            invQuat.copy(jointWorldQuat).invert();

            toEE.copy(eeWorldPos).sub(jointWorldPos).applyQuaternion(invQuat);
            toTarget.copy(targetWorldPos).sub(jointWorldPos).applyQuaternion(invQuat);

            // 4. 회전축 (URDF joint axis, 기본 Z)
            const localAxis = joint.axis
                ? new THREE.Vector3(joint.axis.x, joint.axis.y, joint.axis.z)
                : new THREE.Vector3(0, 0, 1);

            // 5. 벡터를 회전축 평면에 투영
            const projEE = projectOntoPlane(toEE, localAxis);
            const projTarget = projectOntoPlane(toTarget, localAxis);

            if (projEE.length() < 1e-6 || projTarget.length() < 1e-6) continue;

            // 6. 두 투영 벡터 사이의 각도 계산 (부호 포함)
            let angle = signedAngleBetween(projEE, projTarget, localAxis);

            // 7. 댐핑 적용
            angle *= opts.damping;

            // 8. 최대 스텝 제한
            angle = clamp(angle, -opts.maxStepAngle, opts.maxStepAngle);

            // 9. 현재 관절 각도에 추가하고 범위 클램핑
            const currentAngle = angles[i];
            const newAngle = clamp(currentAngle + angle, limitLower, limitUpper);

            // 10. 실제 적용
            angles[i] = newAngle;
            if (joint.setJointValue) {
                joint.setJointValue(newAngle);
            }
        }

        // 수렴 체크
        endEffector.getWorldPosition(eeWorldPos);
        distance = eeWorldPos.distanceTo(targetWorldPos);
        if (distance < opts.tolerance) {
            converged = true;
            break;
        }
    }

    return { converged, iterations, distance, angles };
}

// ─── 유틸리티 함수 ────────────────────────

/** 벡터를 축 평면에 투영 (축에 직교하는 성분만 남김) */
function projectOntoPlane(v: THREE.Vector3, normal: THREE.Vector3): THREE.Vector3 {
    const proj = v.clone();
    const dot = proj.dot(normal);
    proj.sub(normal.clone().multiplyScalar(dot));
    return proj;
}

/** 축 기준 부호 있는 각도 (radians) */
function signedAngleBetween(a: THREE.Vector3, b: THREE.Vector3, axis: THREE.Vector3): number {
    const an = a.clone().normalize();
    const bn = b.clone().normalize();

    let angle = Math.acos(clamp(an.dot(bn), -1, 1));
    const cross = new THREE.Vector3().crossVectors(an, bn);
    if (cross.dot(axis) < 0) angle = -angle;
    return angle;
}

/** 값 클램핑 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * 3D 씬의 드래그 포인트를 평면(dragPlane)에 투영하여 타겟 위치를 계산합니다.
 * 카메라 방향에 수직인 평면을 사용하여 직관적인 드래그를 제공합니다.
 *
 * @param raycaster Raycaster (이미 카메라 기준으로 설정됨)
 * @param camera 현재 카메라
 * @param anchorPoint 드래그 시작 시의 엔드 이펙터 월드 위치
 * @returns 월드 좌표의 드래그 타겟 위치, 또는 null (히트 실패 시)
 */
export function computeDragTarget(
    raycaster: THREE.Raycaster,
    camera: THREE.Camera,
    anchorPoint: THREE.Vector3,
): THREE.Vector3 | null {
    // 카메라 방향에 수직인 드래그 평면 생성
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    const plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(cameraDir, anchorPoint);

    const target = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(plane, target);
    return hit ? target : null;
}
