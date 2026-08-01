/**
 * WarpField — a GPU starfield you fly through.
 *
 * Each star is an instanced ribbon (a 2-triangle quad) rather than a point,
 * because points can't stretch. The vertex shader:
 *
 *   • marches every star toward the camera along +Z and wraps it with mod(),
 *     so the field is infinite without ever re-uploading a buffer;
 *   • orients each ribbon's *width* along the radial perpendicular of the star's
 *     XY position, and its *length* along Z. That's what produces the classic
 *     warp look for free — stars near the centre are foreshortened into dots,
 *     stars near the edges rake into long streaks;
 *   • scales streak length by the throttle uniform, so "speed" is one number.
 *
 * All motion is uniform-driven, so the whole field costs one draw call and the
 * CPU only writes a couple of floats per frame.
 */

import { useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 4000;
const DEPTH = 260;
const RADIUS = 90;

const vertexShader = /* glsl */ `
  attribute vec3 aStar;    // xy = position on the disc, z = start depth
  attribute float aSeed;   // 0..1, per-star jitter

  uniform float uTime;
  uniform float uSpeed;    // 0 = drifting, 1 = full warp
  uniform float uDepth;
  uniform float uSize;

  varying float vFade;
  varying float vCore;
  varying float vSeed;

  void main() {
    // March toward the camera and wrap. Faster stars at higher throttle.
    float travel = uTime * (3.0 + uSpeed * 150.0);
    float z = mod(aStar.z + travel, uDepth) - uDepth * 0.5;

    // Ribbon width runs perpendicular to the star's radial direction; length
    // trails behind it along -Z.
    vec2 radial = normalize(aStar.xy + vec2(0.0001, 0.0001));
    vec2 perp = vec2(-radial.y, radial.x);

    float streak = uSize * (0.9 + uSpeed * uSpeed * 40.0) * (0.6 + aSeed * 0.8);
    float width  = uSize * (1.0 - uSpeed * 0.45);

    vec3 offset = vec3(perp * position.x * width, 0.0)
                + vec3(0.0, 0.0, -position.y * streak);

    vec4 mv = modelViewMatrix * vec4(vec3(aStar.xy, z) + offset, 1.0);
    gl_Position = projectionMatrix * mv;

    // Fade in from the far plane, and out as the star sweeps past the camera.
    float near = smoothstep(0.0, 18.0, -mv.z);
    float far  = 1.0 - smoothstep(uDepth * 0.34, uDepth * 0.5, -mv.z);
    vFade = near * far;
    vCore = 1.0 - abs(position.x) * 2.0;
    vSeed = aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uSpeed;

  varying float vFade;
  varying float vCore;
  varying float vSeed;

  void main() {
    // Soft falloff across the ribbon's width so streaks read as light, not bars.
    float core = pow(max(vCore, 0.0), 1.6);
    float alpha = core * vFade * (0.35 + vSeed * 0.65);
    if (alpha < 0.004) discard;

    // A minority of stars pick up the accent as the throttle opens.
    float hot = step(0.86, vSeed) * uSpeed;
    vec3 color = mix(uColor, uHot, hot * 0.8);
    gl_FragColor = vec4(color, alpha);
  }
`;

function Stars({ speedRef, reduce }: { speedRef: RefObject<number>; reduce: boolean }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  const [geometry, material] = useMemo(() => {
    // One quad: x spans the ribbon width, y runs from the star head backwards.
    const quad = new Float32Array([
      -0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0,
      -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0,
    ]);

    const stars = new Float32Array(STAR_COUNT * 3);
    const seeds = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      // sqrt() keeps the disc evenly filled instead of clumping at the centre.
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * RADIUS + 1.5;
      stars[i * 3] = Math.cos(angle) * r;
      stars[i * 3 + 1] = Math.sin(angle) * r;
      stars[i * 3 + 2] = Math.random() * DEPTH;
      seeds[i] = Math.random();
    }

    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = STAR_COUNT;
    geo.setAttribute('position', new THREE.BufferAttribute(quad, 3));
    geo.setAttribute('aStar', new THREE.InstancedBufferAttribute(stars, 3));
    geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1));
    // Streaks extend well past the instance origin, so bound generously or
    // three.js frustum-culls the whole field the moment the camera tilts.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), DEPTH);

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: 0 },
        uDepth: { value: DEPTH },
        uSize: { value: 0.42 },
        uColor: { value: new THREE.Color('#f4f4f2') },
        uHot: { value: new THREE.Color('#ff3b30') },
      },
    });

    return [geo, mat] as const;
  }, []);

  useFrame((state, delta) => {
    const mat = materialRef.current;
    if (!mat) return;

    const speed = speedRef.current ?? 0;
    mat.uniforms.uSpeed.value = speed;
    // Reduced motion: hold the field still but keep it rendered.
    mat.uniforms.uTime.value += reduce ? 0 : Math.min(delta, 0.05);

    // Steer: the field banks toward the pointer, damped so it feels weighty.
    const g = groupRef.current;
    if (g && !reduce) {
      const k = 1 - Math.pow(0.001, delta);
      g.rotation.y += (pointer.x * 0.22 - g.rotation.y) * k;
      g.rotation.x += (-pointer.y * 0.16 - g.rotation.x) * k;
      state.camera.position.x += (pointer.x * 3.2 - state.camera.position.x) * k;
      state.camera.position.y += (pointer.y * 2.4 - state.camera.position.y) * k;
      state.camera.lookAt(0, 0, -40);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} frustumCulled={false}>
        <primitive object={material} attach="material" ref={materialRef} />
      </mesh>
    </group>
  );
}

export default function WarpField({ speedRef }: { speedRef: RefObject<number> }) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <Canvas
      className="osp__canvas"
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 75, near: 0.1, far: 400, position: [0, 0, 0] }}
    >
      <Stars speedRef={speedRef} reduce={reduce} />
    </Canvas>
  );
}
