import { Vector3 } from 'three'
import { extend } from '@react-three/fiber'
import { Mesh, PlaneGeometry } from 'three'

// Extend will make these available as JSX elements
extend({ Mesh, PlaneGeometry })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: {
        position?: Vector3
        scale?: number[]
        rotation?: number[]
        ref?: React.RefObject<Mesh>
        children?: React.ReactNode
      }
      planeGeometry: {
        args?: [number, number]
        attach?: string
      }
      primitive: {
        object: any
        attach?: string
      }
    }
  }
}
