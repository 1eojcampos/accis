import { Mesh, Object3D } from 'three';

declare module '@react-three/fiber' {
  export interface ThreeElements {
    mesh: JSX.IntrinsicElements['div'] & {
      ref?: React.RefObject<Mesh>;
      children?: React.ReactNode;
    };
    planeGeometry: JSX.IntrinsicElements['div'] & {
      args?: [number, number];
      attach?: string;
    };
    primitive: JSX.IntrinsicElements['div'] & {
      object: Object3D;
      attach?: string;
    };
  }
}
