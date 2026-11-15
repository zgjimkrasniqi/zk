import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'

export const GLB_URL = 'models/residential-complex.glb'

/**
 * Loads the downloaded placeholder model and fits it onto the site footprint.
 * The model is a stand-in, not the real HAB 13 architecture, and it is not
 * assumed to contain separate buildings/floors/apartments — selection is done
 * with overlay volumes (see <Block mode="overlay" />).
 */
export function GlbModel() {
  const { scene } = useGLTF(GLB_URL)
  const model = useMemo(() => scene.clone(true), [scene])

  useLayoutEffect(() => {
    model.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    // Fit into roughly the site footprint (~84 m across), sit on the ground.
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    const centre = box.getCenter(new THREE.Vector3())
    const scale = 84 / Math.max(size.x, size.z, 1e-3)
    model.scale.setScalar(scale)
    model.position.set(-centre.x * scale, -box.min.y * scale, -centre.z * scale)
  }, [model])

  return <primitive object={model} />
}
