declare module 'urdf-loader/src/URDFDragControls' {
    import { Object3D, Camera, Raycaster, Vector3, Ray } from 'three';

    export class URDFDragControls {
        enabled: boolean;
        scene: Object3D;
        raycaster: Raycaster;
        initialGrabPoint: Vector3;
        hitDistance: number;
        hovered: Object3D | null;
        manipulating: Object3D | null;

        constructor(scene: Object3D);

        update(): void;
        updateJoint(joint: any, angle: number): void;
        moveRay(toRay: Ray): void;
        setGrabbed(grabbed: boolean): void;

        onDragStart(joint: any): void;
        onDragEnd(joint: any): void;
        onHover(joint: any): void;
        onUnhover(joint: any): void;
    }

    export class PointerURDFDragControls extends URDFDragControls {
        camera: Camera;
        domElement: HTMLElement;

        constructor(scene: Object3D, camera: Camera, domElement: HTMLElement);
        dispose(): void;
    }
}
