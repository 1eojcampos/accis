/// <reference types="@react-three/fiber" />
import { Object3D, Mesh } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      primitive: any;
    }
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    mesh: {
      children?: React.ReactNode;
      ref?: React.RefObject<Mesh>;
    };
    planeGeometry: {
      args?: [number, number];
      attach?: string;
    };
    primitive: {
      object: Object3D;
      attach?: string;
    };
  }
}
