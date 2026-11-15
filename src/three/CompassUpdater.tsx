import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** Rotates the DOM compass needle (#compass-needle) to point at true north. */
export function CompassUpdater({ rotation }: { rotation: number }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }) => {
    const el = document.getElementById('compass-needle')
    if (!el) return
    camera.getWorldDirection(v)
    const f = new THREE.Vector2(v.x, v.z).normalize()
    // North in the scene: -z rotated with the map.
    const n = new THREE.Vector2(-Math.sin(rotation), -Math.cos(rotation))
    const right = new THREE.Vector2(-f.y, f.x)
    const deg = (Math.atan2(n.dot(right), n.dot(f)) * 180) / Math.PI
    el.style.transform = `rotate(${deg.toFixed(1)}deg)`
  })
  return null
}
