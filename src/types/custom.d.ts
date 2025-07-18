import { Group, Mesh, Object3D } from 'three';
import { ReactNode } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      planeGeometry: any;
      primitive: any;
      group: any;
    }
  }
}
