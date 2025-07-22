import { Vector3 } from 'three'
import { extend } from '@react-three/fiber'
import { Mesh, PlaneGeometry } from 'three'

// Extend will make these available as JSX elements
extend({ Mesh, PlaneGeometry })

// @ts-ignore - Suppress TypeScript errors for three.js JSX elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // @ts-ignore
      mesh: {
        position?: Vector3
        scale?: number[]
        rotation?: number[]
        ref?: React.RefObject<Mesh>
        children?: React.ReactNode
      }
      // @ts-ignore
      planeGeometry: {
        args?: [number, number]
        attach?: string
      }
      // @ts-ignore
      primitive: {
        object: any
        attach?: string
      }
    }
  }
}
