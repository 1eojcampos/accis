import { FC } from 'react';
import { Mesh, PlaneGeometry, Object3D } from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: JSX.IntrinsicElements['div'] & {
        ref?: React.Ref<Mesh>;
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
}
