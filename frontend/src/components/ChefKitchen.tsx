import { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * A 3D chef illustration (react-three-fiber) that cooks behind a cooker and
 * reacts to the cursor.
 *
 * On load — with the cursor untouched — the chef is already cooking *hard*:
 * both arms drive a spoon round the pot, the whole torso rocks into it, steam
 * pours off. As the pointer moves, the head/gaze track it and the stir eases
 * back a little (he glances at you) then ramps up again when you settle.
 *
 * Built entirely from Three primitives — no external model to load — so it
 * renders instantly and stays fully riggable. Honours prefers-reduced-motion.
 */

const SKIN = '#f0c9a8';
const WHITES = '#f4f4f2';
const ACCENT = '#ff7a3d';
const DARK = '#26262b';

function useReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Chef() {
  const reduce = useReducedMotion();
  const { pointer } = useThree();

  // Rig refs
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const spoon = useRef<THREE.Group>(null);
  const steam = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);

  // How "settled" the pointer is: 1 = still (cook hard), dips when moving.
  const intensity = useRef(1);
  const lastPointer = useRef(new THREE.Vector2(0, 0));

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // --- measure pointer motion → cooking intensity ---
    const moved = Math.hypot(pointer.x - lastPointer.current.x, pointer.y - lastPointer.current.y);
    lastPointer.current.set(pointer.x, pointer.y);
    // spikes toward 0 (distracted) on movement, recovers toward 1 (heads-down cooking)
    const target = Math.max(0.35, 1 - moved * 40);
    intensity.current += (target - intensity.current) * Math.min(1, delta * 4);
    const heat = reduce ? 0.55 : intensity.current;

    if (!reduce) {
      // --- vigorous stir: both arms + spoon orbit the pot, torso rocks in ---
      const stirSpeed = 6.5;
      const stir = t * stirSpeed;
      const amp = 0.5 + heat * 0.55; // harder when settled

      if (spoon.current) {
        // spoon tip circles the pot rim
        spoon.current.position.x = Math.cos(stir) * 0.12;
        spoon.current.position.z = 0.34 + Math.sin(stir) * 0.1;
        spoon.current.rotation.z = Math.sin(stir) * 0.5;
      }
      if (armR.current) {
        armR.current.rotation.x = -0.9 - Math.sin(stir) * amp * 0.5;
        armR.current.rotation.z = -0.5 + Math.cos(stir) * amp * 0.35;
      }
      if (armL.current) {
        armL.current.rotation.x = -0.8 - Math.cos(stir) * amp * 0.35;
        armL.current.rotation.z = 0.55 - Math.sin(stir) * amp * 0.25;
      }
      if (torso.current) {
        // rock into the work + a little bounce
        torso.current.rotation.x = 0.12 + Math.sin(stir) * 0.05 * amp;
        torso.current.position.y = Math.abs(Math.sin(stir * 2)) * 0.02 * heat;
      }

      // --- steam billows (faster/denser while cooking hard) ---
      if (steam.current) {
        steam.current.children.forEach((puff, i) => {
          const p = puff as THREE.Mesh;
          const phase = (t * (0.5 + heat * 0.5) + i * 0.28) % 1.4;
          p.position.y = -0.1 + phase * 0.7;
          p.position.x = Math.sin((t + i) * 1.5) * 0.06;
          const s = 0.5 + phase * 0.9; // scales the small base sphere
          p.scale.setScalar(s);
          (p.material as THREE.MeshBasicMaterial).opacity =
            Math.max(0, 1 - phase / 1.4) * 0.22 * heat;
        });
      }
    }

    // --- head + gaze track the cursor (always) ---
    if (head.current) {
      const tx = pointer.x * 0.5;
      const ty = pointer.y * 0.3;
      head.current.rotation.y += (tx - head.current.rotation.y) * Math.min(1, delta * 6);
      head.current.rotation.x += (-ty * 0.5 + 0.04 - head.current.rotation.x) * Math.min(1, delta * 6);
    }
    if (eyes.current) {
      // tiny darts within the sockets (eyes are children of the head group)
      eyes.current.position.x = pointer.x * 0.02;
      eyes.current.position.y = 0.02 + pointer.y * 0.015;
    }
    // gentle idle sway of the whole chef
    if (root.current && !reduce) {
      root.current.rotation.y = Math.sin(t * 0.4) * 0.04;
    }
  });

  return (
    <group ref={root} position={[0, -0.9, 0]}>
      {/* ---------------- COOKER ---------------- */}
      <group position={[0, 0, 0.55]}>
        {/* body */}
        <mesh castShadow receiveShadow position={[0, 0.35, 0]}>
          <boxGeometry args={[1.5, 0.7, 0.8]} />
          <meshStandardMaterial color={DARK} roughness={0.5} metalness={0.3} />
        </mesh>
        {/* cooktop */}
        <mesh position={[0, 0.72, 0]} receiveShadow>
          <boxGeometry args={[1.5, 0.06, 0.8]} />
          <meshStandardMaterial color="#3a3a41" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* pot */}
        <mesh castShadow position={[0, 0.9, 0.02]}>
          <cylinderGeometry args={[0.34, 0.3, 0.34, 32]} />
          <meshStandardMaterial color="#4a4a52" roughness={0.35} metalness={0.7} />
        </mesh>
        {/* bubbling contents */}
        <mesh position={[0, 1.06, 0.02]}>
          <cylinderGeometry args={[0.31, 0.31, 0.04, 32]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.35} roughness={0.6} />
        </mesh>
        {/* knobs */}
        {[-0.4, -0.2].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0.42]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 16]} />
            <meshStandardMaterial color={i === 0 ? ACCENT : '#e8e8ec'} emissive={i === 0 ? ACCENT : '#000'} emissiveIntensity={i === 0 ? 0.6 : 0} />
          </mesh>
        ))}

        {/* steam — additive so it reads as a soft glow, never a dark blob */}
        <group ref={steam} position={[0, 1.0, 0.02]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshBasicMaterial
                color="#ffffff"
                transparent
                opacity={0.18}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* ---------------- CHEF (behind the cooker) ---------------- */}
      <group position={[0, 0.18, -0.4]}>
        <group ref={torso}>
          {/* legs */}
          <mesh castShadow position={[-0.16, 0.18, 0]}>
            <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
            <meshStandardMaterial color={DARK} roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0.16, 0.18, 0]}>
            <capsuleGeometry args={[0.1, 0.32, 6, 12]} />
            <meshStandardMaterial color={DARK} roughness={0.7} />
          </mesh>

          {/* torso — chef whites */}
          <mesh castShadow position={[0, 0.62, 0]}>
            <capsuleGeometry args={[0.32, 0.42, 8, 16]} />
            <meshStandardMaterial color={WHITES} roughness={0.85} />
          </mesh>
          {/* neckerchief */}
          <mesh position={[0, 0.86, 0.24]} rotation={[0.5, 0, 0]}>
            <coneGeometry args={[0.14, 0.16, 3]} />
            <meshStandardMaterial color={ACCENT} roughness={0.7} />
          </mesh>
          {/* buttons */}
          {[0.72, 0.58, 0.44].map((y, i) => (
            <mesh key={i} position={[0.07, y, 0.3]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#c7c7cd" />
            </mesh>
          ))}

          {/* arms — pivot at shoulders */}
          <group ref={armL} position={[-0.34, 0.82, 0.05]}>
            <mesh castShadow position={[0, -0.22, 0.12]} rotation={[0.3, 0, 0]}>
              <capsuleGeometry args={[0.08, 0.4, 6, 12]} />
              <meshStandardMaterial color={WHITES} roughness={0.85} />
            </mesh>
            <mesh position={[0, -0.42, 0.28]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
          </group>

          <group ref={armR} position={[0.34, 0.82, 0.05]}>
            <mesh castShadow position={[0, -0.22, 0.12]} rotation={[0.3, 0, 0]}>
              <capsuleGeometry args={[0.08, 0.4, 6, 12]} />
              <meshStandardMaterial color={WHITES} roughness={0.85} />
            </mesh>
            {/* hand */}
            <mesh position={[0, -0.42, 0.28]}>
              <sphereGeometry args={[0.075, 12, 12]} />
              <meshStandardMaterial color={SKIN} roughness={0.6} />
            </mesh>
            {/* spoon held in right hand, dipping into the pot */}
            <group ref={spoon} position={[0, -0.42, 0.34]}>
              <mesh position={[0, -0.12, 0]} rotation={[0.2, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
                <meshStandardMaterial color="#8a5a2b" roughness={0.8} />
              </mesh>
              <mesh position={[0, -0.28, 0.03]}>
                <sphereGeometry args={[0.05, 12, 12]} />
                <meshStandardMaterial color="#8a5a2b" roughness={0.8} />
              </mesh>
            </group>
          </group>

          {/* head */}
          <group ref={head} position={[0, 1.02, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.26, 24, 24]} />
              <meshStandardMaterial color={SKIN} roughness={0.5} />
            </mesh>
            {/* eyes */}
            <group ref={eyes} position={[0, 0.02, 0]}>
              {[-0.1, 0.1].map((x, i) => (
                <group key={i} position={[x, 0.02, 0.23]}>
                  <mesh>
                    <sphereGeometry args={[0.055, 16, 16]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0, 0.045]}>
                    <sphereGeometry args={[0.026, 12, 12]} />
                    <meshStandardMaterial color="#1a1a1e" />
                  </mesh>
                </group>
              ))}
            </group>
            {/* rosy cheeks */}
            {[-0.15, 0.15].map((x, i) => (
              <mesh key={i} position={[x, -0.06, 0.21]}>
                <sphereGeometry args={[0.045, 12, 12]} />
                <meshStandardMaterial color="#ff9d6e" transparent opacity={0.55} />
              </mesh>
            ))}
            {/* moustache */}
            <mesh position={[0, -0.1, 0.23]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.16, 0.04, 0.04]} />
              <meshStandardMaterial color="#5a3818" roughness={0.9} />
            </mesh>
            {/* nose */}
            <mesh position={[0, -0.02, 0.26]}>
              <sphereGeometry args={[0.04, 12, 12]} />
              <meshStandardMaterial color="#eabf99" roughness={0.6} />
            </mesh>

            {/* toque (chef hat) */}
            <mesh castShadow position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.22, 0.24, 0.14, 24]} />
              <meshStandardMaterial color={WHITES} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0.42, 0]}>
              <sphereGeometry args={[0.26, 20, 20]} />
              <meshStandardMaterial color={WHITES} roughness={0.9} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function ChefKitchen() {
  return (
    <div className="chef" aria-hidden="true">
      <Canvas
        className="chef__canvas"
        shadows
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 1.1, 4.2], fov: 42 }}
      >
        <hemisphereLight args={['#ffffff', '#2a2a30', 0.9]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 2, 2]} intensity={0.7} color="#bcd4ff" />
        {/* frontal fill so the face + toque never fall into shadow */}
        <directionalLight position={[0, 2.5, 5]} intensity={1.1} color="#fff4ec" />
        <pointLight position={[0, 1.2, 1.5]} intensity={2} color={ACCENT} distance={4} />
        <Suspense fallback={null}>
          <Chef />
        </Suspense>
        <ContactShadows position={[0, -0.9, 0]} opacity={0.5} scale={5} blur={2.4} far={2} />
      </Canvas>
    </div>
  );
}
