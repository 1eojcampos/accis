import * as THREE from 'three'
import { Object3DNode } from '@react-three/fiber'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>
      planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>
      primitive: Object3DNode<THREE.Object3D, typeof THREE.Object3D> & {
        object: THREE.Object3D
        attach?: string
      }
    }
  }
}
