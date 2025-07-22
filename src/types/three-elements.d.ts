// @ts-ignore - Suppress TypeScript errors for three.js elements
import * as THREE from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // @ts-ignore
      mesh: any
      // @ts-ignore
      planeGeometry: any
      // @ts-ignore
      primitive: any
    }
  }
}
