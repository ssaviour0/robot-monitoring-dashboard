import { useEffect, useRef, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import URDFLoader from 'urdf-loader';
import { useRobotStore } from '../store/robotStore';
import { UR10_JOINT_NAMES, UR10_JOINT_DEFS } from '../types/robot';
import { solveCCDIK, computeDragTarget, IKJointConfig } from '../utils/ikSolver';

/**
 * UR10Robot — URDF 기반 + 향상된 인터랙션 시스템 + IK 드래그
 *
 * 기능:
 * 1. 3D 관절 마커(토러스 링) — 개별 관절 클릭/드래그
 * 2. 터치 + 마우스 통합 포인터 이벤트
 * 3. IK 모드 — 엔드 이펙터를 잡고 드래그하면 모든 관절이 자연스럽게 연쇄 이동
 * 4. 선택 상태 Store 연동 — JointPanel/JointControlPanel과 양방향 동기화
 */
interface UR10RobotProps {
    onLoaded?: () => void;
    onError?: (error: string) => void;
    orbitControlsRef?: React.RefObject<any>;
}

// 색상 상수
const COLORS = {
    markerDefault: new THREE.Color(0x00e5ff),
    markerHover: new THREE.Color(0x00ffcc),
    markerSelected: new THREE.Color(0x00ff88),
    emissiveHover: new THREE.Color(0x003344),
    emissiveSelected: new THREE.Color(0x004422),
    emissiveNone: new THREE.Color(0x000000),
    // IK 전용
    eeMarkerDefault: new THREE.Color(0xff6b35),  // 오렌지
    eeMarkerHover: new THREE.Color(0xff9500),     // 밝은 오렌지
    eeMarkerDrag: new THREE.Color(0xff3d00),      // 빨간 오렌지
    ikTrail: new THREE.Color(0xff6b35),           // IK 궤적 색상
} as const;

// 마커 머티리얼 (재사용)
const createMarkerMaterial = (color: THREE.Color, opacity: number) =>
    new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthTest: true,
        side: THREE.DoubleSide,
    });

export const UR10Robot = ({ onLoaded, onError, orbitControlsRef }: UR10RobotProps) => {
    const { scene, camera, gl } = useThree();
    const robotRef = useRef<any>(null);
    const markersRef = useRef<THREE.Mesh[]>([]);
    const eeMarkerRef = useRef<THREE.Mesh | null>(null);      // 엔드이펙터 마커
    const eeTargetRef = useRef<THREE.Mesh | null>(null);       // IK 타겟 시각화 (작은 구)
    const isDraggingRef = useRef(false);
    const isIKDraggingRef = useRef(false);                     // IK 드래그 중
    const dragStartRef = useRef<{ x: number; y: number; angle: number; jointIndex: number } | null>(null);
    const ikDragAnchorRef = useRef<THREE.Vector3>(new THREE.Vector3()); // IK 드래그 시작점
    const raycasterRef = useRef(new THREE.Raycaster());

    const jointStateMap = useRobotStore((s) => s.jointStateMap);
    const isManualMode = useRobotStore((s) => s.settings.isManualMode);
    const isIKMode = useRobotStore((s) => s.settings.isIKMode);
    const showWireframe = useRobotStore((s) => s.settings.showWireframe);
    const showCollision = useRobotStore((s) => s.settings.showCollision);
    const selectedJointIndex = useRobotStore((s) => s.selectedJointIndex);
    const setJointAngle = useRobotStore((s) => s.setJointAngle);
    const setManualMode = useRobotStore((s) => s.setManualMode);
    const setSelectedJoint = useRobotStore((s) => s.setSelectedJoint);

    // 모바일에서 IK + Manual 모드 자동 활성화 (오렌지 볼 드래그가 메인 조작)
    const isMobileQuery = typeof window !== 'undefined' && window.matchMedia('(max-width:900px)').matches;
    useEffect(() => {
        if (isMobileQuery && !isIKMode) {
            useRobotStore.getState().toggleIKMode();
        }
        if (isMobileQuery && !isManualMode) {
            setManualMode(true);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // jointDef 기반 limit 조회 유틸
    const getJointLimit = useCallback((index: number) => {
        const def = UR10_JOINT_DEFS[index];
        return def ? { lower: def.limitLower, upper: def.limitUpper } : { lower: -Math.PI, upper: Math.PI };
    }, []);

    // ─── 관절 메쉬 하이라이트 ───
    const setJointEmissive = useCallback((jointObj: THREE.Object3D | null, color: THREE.Color) => {
        if (!jointObj) return;
        jointObj.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => {
                    if ('emissive' in mat) {
                        (mat as THREE.MeshStandardMaterial).emissive.copy(color);
                    }
                });
            }
        });
    }, []);

    // ─── 관절의 3D 오브젝트 가져오기 ───
    const getJointObject = useCallback((index: number): any | null => {
        const robot = robotRef.current;
        if (!robot || !robot.joints) return null;
        const name = UR10_JOINT_NAMES[index];
        return robot.joints[name] || null;
    }, []);

    // ─── 엔드 이펙터 3D 오브젝트 가져오기 ───
    const getEndEffector = useCallback((): THREE.Object3D | null => {
        const robot = robotRef.current;
        if (!robot) return null;
        // URDF에서 ee_link 또는 마지막 링크 찾기
        let ee: THREE.Object3D | null = null;
        robot.traverse((child: THREE.Object3D) => {
            if (child.name === 'ee_link' || child.name === 'ee_fixed_joint') {
                ee = child;
            }
        });
        // 없으면 마지막 관절을 사용
        if (!ee) {
            ee = getJointObject(5); // wrist_3_joint
        }
        return ee;
    }, [getJointObject]);

    // ─── IK 관절 설정 생성 ───
    const buildIKJointConfigs = useCallback((): IKJointConfig[] => {
        return UR10_JOINT_DEFS.map((def) => {
            const joint = getJointObject(def.index);
            return {
                joint,
                index: def.index,
                limitLower: def.limitLower,
                limitUpper: def.limitUpper,
            };
        }).filter(cfg => cfg.joint !== null);
    }, [getJointObject]);

    // ─── NDC → 포인터 좌표 변환 ───
    const getPointerNDC = useCallback((clientX: number, clientY: number) => {
        const rect = gl.domElement.getBoundingClientRect();
        return new THREE.Vector2(
            ((clientX - rect.left) / rect.width) * 2 - 1,
            -((clientY - rect.top) / rect.height) * 2 + 1
        );
    }, [gl]);

    // ─── 마커 히트 테스트 (관절 마커 + EE 마커) ───
    const hitTestMarkers = useCallback((ndc: THREE.Vector2): { type: 'joint' | 'ee'; index: number } | null => {
        raycasterRef.current.setFromCamera(ndc, camera);

        // 1. EE 마커 우선 체크 (IK 모드일 때)
        if (isIKMode && eeMarkerRef.current) {
            const eeHits = raycasterRef.current.intersectObject(eeMarkerRef.current, false);
            if (eeHits.length > 0) {
                return { type: 'ee', index: -1 };
            }
        }

        // 2. 관절 마커 체크
        const intersects = raycasterRef.current.intersectObjects(markersRef.current, false);
        if (intersects.length > 0) {
            const marker = intersects[0].object;
            const idx = markersRef.current.indexOf(marker as THREE.Mesh);
            return idx >= 0 ? { type: 'joint', index: idx } : null;
        }
        return null;
    }, [camera, isIKMode]);

    // ─── IK 실행 ───
    const runIK = useCallback((targetWorldPos: THREE.Vector3) => {
        const ee = getEndEffector();
        if (!ee) return;

        const jointConfigs = buildIKJointConfigs();
        if (jointConfigs.length === 0) return;

        const result = solveCCDIK(jointConfigs, ee, targetWorldPos, {
            maxIterations: 25,
            tolerance: 0.002,
            maxStepAngle: 0.2,
            damping: 0.65,
        });

        // Store에 모든 관절 각도 동기화
        result.angles.forEach((angle, i) => {
            setJointAngle(i, angle);
        });

        // 타겟 시각화 업데이트
        if (eeTargetRef.current) {
            eeTargetRef.current.position.copy(targetWorldPos);
            const mat = eeTargetRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = result.converged ? 0.8 : 0.4;
        }
    }, [getEndEffector, buildIKJointConfigs, setJointAngle]);

    // ─── URDF 로딩 ───
    useEffect(() => {
        const manager = new THREE.LoadingManager();
        manager.setURLModifier((url: string) => url.replace('/meshes/ur10/', '/meshes/'));

        const loader = new URDFLoader(manager);
        loader.packages = { ur_description: '/urdf/ur10' };

        loader.load(
            '/urdf/ur10/ur10.urdf',
            (robot: any) => {
                if (robotRef.current) {
                    markersRef.current.forEach(m => m.removeFromParent());
                    markersRef.current = [];
                    if (eeMarkerRef.current) { eeMarkerRef.current.removeFromParent(); eeMarkerRef.current = null; }
                    if (eeTargetRef.current) { eeTargetRef.current.removeFromParent(); eeTargetRef.current = null; }
                    scene.remove(robotRef.current);
                }
                robotRef.current = robot;
                scene.add(robot);

                // ─── 관절 마커(인터랙션 링) 생성 ───
                const markerGeom = new THREE.TorusGeometry(0.06, 0.012, 8, 24);
                const markers: THREE.Mesh[] = [];

                UR10_JOINT_NAMES.forEach((name, idx) => {
                    const joint = robot.joints?.[name];
                    if (!joint) return;
                    const mat = createMarkerMaterial(COLORS.markerDefault, 0.5);
                    const ring = new THREE.Mesh(markerGeom, mat);
                    ring.name = `joint-marker-${idx}`;
                    ring.userData.jointIndex = idx;
                    ring.renderOrder = 999;
                    const axis = joint.axis || new THREE.Vector3(0, 0, 1);
                    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), axis.clone().normalize());
                    joint.add(ring);
                    markers.push(ring);
                });
                markersRef.current = markers;

                // ─── 엔드 이펙터 마커 (IK 그랩 포인트) ───
                const eeGeom = new THREE.SphereGeometry(0.04, 16, 16);
                const eeMat = createMarkerMaterial(COLORS.eeMarkerDefault, 0.7);
                const eeSphere = new THREE.Mesh(eeGeom, eeMat);
                eeSphere.name = 'ee-marker';
                eeSphere.renderOrder = 1000;

                // ee_link 찾기
                let eeParent: THREE.Object3D | null = null;
                robot.traverse((child: THREE.Object3D) => {
                    if (child.name === 'ee_link' || child.name === 'ee_fixed_joint') {
                        eeParent = child;
                    }
                });
                if (!eeParent) {
                    const lastJoint = robot.joints?.['wrist_3_joint'];
                    if (lastJoint) eeParent = lastJoint;
                }
                if (eeParent) {
                    eeParent.add(eeSphere);
                }
                eeMarkerRef.current = eeSphere;

                // ─── IK 타겟 시각화 (씬 공간의 작은 반투명 구) ───
                const targetGeom = new THREE.SphereGeometry(0.02, 8, 8);
                const targetMat = new THREE.MeshBasicMaterial({
                    color: COLORS.eeMarkerDrag,
                    transparent: true,
                    opacity: 0,
                    depthTest: false,
                });
                const targetSphere = new THREE.Mesh(targetGeom, targetMat);
                targetSphere.name = 'ik-target';
                targetSphere.renderOrder = 1001;
                scene.add(targetSphere);
                eeTargetRef.current = targetSphere;

                onLoaded?.();
            },
            undefined,
            (error: unknown) => {
                const msg = error instanceof Error ? error.message : String(error);
                onError?.(msg);
            }
        );

        return () => {
            markersRef.current.forEach(m => {
                m.removeFromParent();
                m.geometry.dispose();
                (m.material as THREE.Material).dispose();
            });
            markersRef.current = [];
            if (eeMarkerRef.current) {
                eeMarkerRef.current.removeFromParent();
                eeMarkerRef.current.geometry.dispose();
                (eeMarkerRef.current.material as THREE.Material).dispose();
                eeMarkerRef.current = null;
            }
            if (eeTargetRef.current) {
                scene.remove(eeTargetRef.current);
                eeTargetRef.current.geometry.dispose();
                (eeTargetRef.current.material as THREE.Material).dispose();
                eeTargetRef.current = null;
            }
            if (robotRef.current) {
                scene.remove(robotRef.current);
                robotRef.current = null;
            }
        };
    }, [scene, onLoaded, onError]);

    // ─── EE 마커 가시성: 항상 보이되 IK 모드일 때 강조 ───
    useEffect(() => {
        if (eeMarkerRef.current) {
            eeMarkerRef.current.visible = true;
            const mat = eeMarkerRef.current.material as THREE.MeshBasicMaterial;
            mat.color.copy(isIKMode ? COLORS.eeMarkerHover : COLORS.eeMarkerDefault);
            mat.opacity = isIKMode ? 0.85 : 0.4;
            // IK 모드일 때 크기 키우기
            const s = isIKMode ? 1.5 : 1.0;
            eeMarkerRef.current.scale.set(s, s, s);
        }
    }, [isIKMode]);

    // ─── 포인터 이벤트 (마우스 + 터치 통합 + IK 드래그) ───
    useEffect(() => {
        const canvas = gl.domElement;

        const handlePointerDown = (clientX: number, clientY: number, shiftKey: boolean) => {
            // ─── Shift+클릭: 어디서든 IK 드래그 시작 ───
            if (shiftKey) {
                if (!isManualMode) setManualMode(true);

                isIKDraggingRef.current = true;
                const ee = getEndEffector();
                if (ee) {
                    ee.getWorldPosition(ikDragAnchorRef.current);
                }
                // 모든 관절 하이라이트
                UR10_JOINT_NAMES.forEach((name) => {
                    const joint = robotRef.current?.joints?.[name];
                    if (joint) setJointEmissive(joint, COLORS.emissiveSelected);
                });
                if (eeMarkerRef.current) {
                    (eeMarkerRef.current.material as THREE.MeshBasicMaterial).color.copy(COLORS.eeMarkerDrag);
                    eeMarkerRef.current.scale.set(1.8, 1.8, 1.8);
                }
                canvas.style.cursor = 'grabbing';
                if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false;
                return;
            }

            const ndc = getPointerNDC(clientX, clientY);
            const hit = hitTestMarkers(ndc);

            if (!hit) return;

            if (!isManualMode) setManualMode(true);

            if (hit.type === 'ee') {
                // ─── EE 마커 직접 클릭으로도 IK 드래그 가능 ───
                isIKDraggingRef.current = true;
                const ee = getEndEffector();
                if (ee) {
                    ee.getWorldPosition(ikDragAnchorRef.current);
                }
                UR10_JOINT_NAMES.forEach((name) => {
                    const joint = robotRef.current?.joints?.[name];
                    if (joint) setJointEmissive(joint, COLORS.emissiveSelected);
                });
                if (eeMarkerRef.current) {
                    (eeMarkerRef.current.material as THREE.MeshBasicMaterial).color.copy(COLORS.eeMarkerDrag);
                    eeMarkerRef.current.scale.set(1.8, 1.8, 1.8);
                }
                canvas.style.cursor = 'grabbing';
                if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false;

            } else if (hit.type === 'joint' && hit.index >= 0) {
                // ─── 개별 관절 드래그 (기존 로직) ───
                setSelectedJoint(hit.index);
                const joint = getJointObject(hit.index);
                if (joint) {
                    isDraggingRef.current = true;
                    dragStartRef.current = {
                        x: clientX, y: clientY,
                        angle: joint.angle || 0,
                        jointIndex: hit.index,
                    };
                    setJointEmissive(joint, COLORS.emissiveSelected);
                    canvas.style.cursor = 'grabbing';
                    if (orbitControlsRef?.current) orbitControlsRef.current.enabled = false;
                }
            }
        };

        const handlePointerMove = (clientX: number, clientY: number) => {
            if (isIKDraggingRef.current) {
                // ─── IK 드래그 중 ───
                const ndc = getPointerNDC(clientX, clientY);
                raycasterRef.current.setFromCamera(ndc, camera);

                const target = computeDragTarget(raycasterRef.current, camera, ikDragAnchorRef.current);
                if (target) {
                    runIK(target);
                }
                return;
            }

            if (isDraggingRef.current && dragStartRef.current) {
                // ─── 개별 관절 드래그 중 ───
                const dx = clientX - dragStartRef.current.x;
                const sensitivity = 0.008;
                const delta = dx * sensitivity;
                const newAngle = dragStartRef.current.angle + delta;

                const { lower, upper } = getJointLimit(dragStartRef.current.jointIndex);
                const clamped = Math.max(lower, Math.min(upper, newAngle));
                const joint = getJointObject(dragStartRef.current.jointIndex);
                if (joint) {
                    joint.setJointValue(clamped);
                    setJointAngle(dragStartRef.current.jointIndex, clamped);
                }
                return;
            }

            // ─── 호버 감지 ───
            const ndc = getPointerNDC(clientX, clientY);
            const hit = hitTestMarkers(ndc);

            // EE 마커 호버
            if (eeMarkerRef.current && isIKMode) {
                const eeMat = eeMarkerRef.current.material as THREE.MeshBasicMaterial;
                if (hit?.type === 'ee') {
                    eeMat.color.copy(COLORS.eeMarkerHover);
                    eeMat.opacity = 0.9;
                    canvas.style.cursor = 'grab';
                } else {
                    eeMat.color.copy(COLORS.eeMarkerDefault);
                    eeMat.opacity = 0.7;
                }
            }

            // 관절 마커 호버
            markersRef.current.forEach((marker, idx) => {
                const mat = marker.material as THREE.MeshBasicMaterial;
                if (idx === selectedJointIndex) {
                    mat.color.copy(COLORS.markerSelected);
                    mat.opacity = 0.9;
                } else if (hit?.type === 'joint' && hit.index === idx) {
                    mat.color.copy(COLORS.markerHover);
                    mat.opacity = 0.8;
                    canvas.style.cursor = isManualMode ? 'grab' : 'pointer';
                } else {
                    mat.color.copy(COLORS.markerDefault);
                    mat.opacity = isManualMode ? 0.5 : 0.3;
                }
            });

            if (!hit && !isDraggingRef.current && !isIKDraggingRef.current) {
                canvas.style.cursor = 'auto';
            }
        };

        const handlePointerUp = () => {
            if (isIKDraggingRef.current) {
                // ─── IK 드래그 종료 ───
                isIKDraggingRef.current = false;
                // 하이라이트 해제
                UR10_JOINT_NAMES.forEach((name) => {
                    const joint = robotRef.current?.joints?.[name];
                    if (joint) setJointEmissive(joint, COLORS.emissiveNone);
                });
                // EE 마커 원복
                if (eeMarkerRef.current) {
                    (eeMarkerRef.current.material as THREE.MeshBasicMaterial).color.copy(
                        isIKMode ? COLORS.eeMarkerHover : COLORS.eeMarkerDefault
                    );
                    const s = isIKMode ? 1.5 : 1.0;
                    eeMarkerRef.current.scale.set(s, s, s);
                }
                // 타겟 숨기기
                if (eeTargetRef.current) {
                    (eeTargetRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
                }
            }

            if (isDraggingRef.current && dragStartRef.current) {
                const joint = getJointObject(dragStartRef.current.jointIndex);
                if (joint) {
                    setJointEmissive(joint, selectedJointIndex === dragStartRef.current.jointIndex
                        ? COLORS.emissiveSelected : COLORS.emissiveNone);
                }
            }

            isDraggingRef.current = false;
            dragStartRef.current = null;
            canvas.style.cursor = 'auto';
            if (orbitControlsRef?.current) orbitControlsRef.current.enabled = true;
        };

        // --- Mouse Events ---
        const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY, e.shiftKey);
        const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
        const onMouseUp = () => handlePointerUp();

        // --- Touch Events ---
        const onTouchStart = (e: TouchEvent) => {
            // 2손가락 터치 = IK 모드
            if (e.touches.length === 2) {
                e.preventDefault();
                const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                handlePointerDown(midX, midY, true);
                return;
            }
            if (e.touches.length === 1) {
                const t = e.touches[0];
                const ndc = getPointerNDC(t.clientX, t.clientY);
                const hit = hitTestMarkers(ndc);
                if (hit) {
                    e.preventDefault();
                    handlePointerDown(t.clientX, t.clientY, false);
                }
            }
        };
        const onTouchMove = (e: TouchEvent) => {
            if ((isDraggingRef.current || isIKDraggingRef.current) && e.touches.length === 1) {
                e.preventDefault();
                const t = e.touches[0];
                handlePointerMove(t.clientX, t.clientY);
            }
        };
        const onTouchEnd = (e: TouchEvent) => {
            if (isDraggingRef.current || isIKDraggingRef.current) {
                e.preventDefault();
                handlePointerUp();
            }
        };

        canvas.addEventListener('mousedown', onMouseDown);
        canvas.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: false });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd, { passive: false });

        return () => {
            canvas.removeEventListener('mousedown', onMouseDown);
            canvas.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchmove', onTouchMove);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.style.cursor = 'auto';
        };
    }, [gl, camera, isManualMode, isIKMode, selectedJointIndex, getPointerNDC, hitTestMarkers,
        getJointObject, getJointLimit, getEndEffector, setJointAngle, setManualMode, setSelectedJoint,
        setJointEmissive, orbitControlsRef, runIK]);

    // ─── 선택 상태 변경 시 3D 하이라이트 동기화 ───
    useEffect(() => {
        const robot = robotRef.current;
        if (!robot) return;

        UR10_JOINT_NAMES.forEach((name, idx) => {
            const joint = robot.joints?.[name];
            if (!joint) return;
            if (idx === selectedJointIndex) {
                setJointEmissive(joint, COLORS.emissiveSelected);
            } else {
                setJointEmissive(joint, COLORS.emissiveNone);
            }
        });

        markersRef.current.forEach((marker, idx) => {
            const mat = marker.material as THREE.MeshBasicMaterial;
            if (idx === selectedJointIndex) {
                mat.color.copy(COLORS.markerSelected);
                mat.opacity = 0.9;
            } else {
                mat.color.copy(COLORS.markerDefault);
                mat.opacity = isManualMode ? 0.5 : 0.3;
            }
        });
    }, [selectedJointIndex, setJointEmissive, isManualMode]);

    // ─── 매 프레임: 관절 값 업데이트 ───
    useFrame(() => {
        const robot = robotRef.current;
        if (!robot || !robot.setJointValue) return;
        if (isDraggingRef.current || isIKDraggingRef.current) return;

        UR10_JOINT_NAMES.forEach((name) => {
            const value = jointStateMap[name];
            if (value !== undefined) {
                try { robot.setJointValue(name, value); } catch { /* ignore */ }
            }
        });
    });

    // ─── Wireframe 토글 ───
    useEffect(() => {
        const robot = robotRef.current;
        if (!robot) return;
        robot.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh && child.material && !child.name.startsWith('joint-marker') && !child.name.startsWith('ee-') && !child.name.startsWith('ik-')) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial) {
                        mat.wireframe = showWireframe;
                    }
                });
            }
        });
    }, [showWireframe]);

    // ─── Collision 메쉬 가시성 토글 ───
    useEffect(() => {
        const robot = robotRef.current;
        if (!robot) return;
        robot.traverse((child: THREE.Object3D) => {
            if (child.name && (child.name.toLowerCase().includes('collision') || (child as any).isCollision)) {
                child.visible = showCollision;
            }
        });
    }, [showCollision]);

    return null;
};
