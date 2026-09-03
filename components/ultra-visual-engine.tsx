'use client';

import { useEffect, useMemo, useRef } from 'react';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Color, Mesh } from 'three';
import { mountGlass } from '@liquidglassjs/core';
import '@liquidglassjs/core/css';

const LIQUID_FC_MARK = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect width="600" height="300" fill="transparent"/><text x="300" y="215" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="220" font-weight="900" letter-spacing="-12" fill="white">FC</text></svg>`)}`;

function MotionMark() {
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();
    mesh.current.rotation.x = Math.sin(t * 0.35) * 0.12 + pointer.y * 0.08;
    mesh.current.rotation.y = t * 0.18 + pointer.x * 0.18;
  });

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <torusKnotGeometry args={[0.82, 0.12, 96, 16, 2, 3]} />
      <meshPhysicalMaterial color={new Color('#F4F0E6')} metalness={0.78} roughness={0.2} clearcoat={1} clearcoatRoughness={0.16} />
    </mesh>
  );
}

export function UltraVisualEngine() {
  const glassRef = useRef<HTMLDivElement>(null);
  const refractRef = useRef<HTMLDivElement>(null);
  const liquidMark = useMemo(() => LIQUID_FC_MARK, []);

  useEffect(() => {
    if (!glassRef.current || !refractRef.current) return;
    const instance = mountGlass(glassRef.current, { refract: refractRef.current, mode: 'svg' });
    return () => instance.dispose();
  }, []);

  return (
    <section className="visual-engine" aria-label="UltraWear visual identity">
      <div className="visual-engine__shader" aria-hidden="true">
        <ShaderGradientCanvas pixelDensity={1} fov={45} pointerEvents="none" lazyLoad={false}>
          <ShaderGradient
            animate="on"
            type="sphere"
            shader="defaults"
            uSpeed={0.18}
            uStrength={0.34}
            uDensity={0.72}
            uFrequency={4.8}
            uAmplitude={2.6}
            color1="#1E2D4F"
            color2="#4F7652"
            color3="#C96642"
            reflection={0.24}
            cAzimuthAngle={245}
            cPolarAngle={96}
            cDistance={3.8}
            cameraZoom={1.15}
            lightType="env"
            brightness={0.72}
            envPreset="city"
            grain="on"
            zoomOut={false}
            toggleAxis={false}
          />
        </ShaderGradientCanvas>
      </div>

      <div className="visual-engine__content">
        <div className="visual-engine__copy" ref={glassRef}>
          <div className="visual-engine__copy-inner" ref={refractRef}>
            <p className="eyebrow">ULTRAWEAR FC · FOR COMMUNITY</p>
            <h2>SPORT<br /><em>IS CULTURE.</em></h2>
            <p>One visual system for the game, the people and everything we build beyond it.</p>
          </div>
        </div>

        <div className="visual-engine__mark" aria-hidden="true">
          <img src={liquidMark} alt="" />
          <div className="visual-engine__three"><Canvas camera={{ position: [0, 0, 3.1], fov: 42 }} dpr={[1, 1.25]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
            <ambientLight intensity={1.3} />
            <directionalLight position={[3, 4, 4]} intensity={2.2} />
            <MotionMark />
          </Canvas></div>
        </div>
      </div>

      <div className="visual-engine__footer">
        <span>LIQUID LOGO</span><span>SHADER GRADIENT</span><span>LIQUID GLASS</span><span>R3F / THREE.JS</span>
      </div>
    </section>
  );
}
