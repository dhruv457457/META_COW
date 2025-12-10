"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, Suspense, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { Group } from 'three';

// Pre-load the model
useGLTF.preload('/models/metacoww.glb');

// Adjust these values to customize the 3D model appearance:
const CONFIG = {
  scale: 1.5,           // Model size
  positionY: -0.8,      // Vertical position
  positionZ: 0,         // Depth position
  cameraZ: 5,           // Camera distance
  cameraFOV: 50,        // Field of view
  lightIntensity: 4,    // Overall brightness
};

function Model({ mouse }: { mouse: { x: number; y: number } }) {
  const modelRef = useRef<Group>(null);
  const { scene } = useGLTF('/models/metacoww.glb');

  useFrame(() => {
    if (!modelRef.current) return;
    const t = performance.now() / 1000;
    
    // Smooth rotation based on mouse position
    const targetRotationY = mouse.x * 0.5;
    const targetRotationX = -mouse.y * 0.2;
    
    modelRef.current.rotation.y += (targetRotationY - modelRef.current.rotation.y) * 0.1;
    modelRef.current.rotation.x += (targetRotationX - modelRef.current.rotation.x) * 0.1;
    
    // Gentle breathing animation
    const breathScale = CONFIG.scale + CONFIG.scale * 0.02 * Math.sin(t * 1.5);
    modelRef.current.scale.setScalar(breathScale);
  });

  return (
    <primitive
      object={scene}
      ref={modelRef}
      scale={CONFIG.scale}
      position={[0, CONFIG.positionY, CONFIG.positionZ]}
      rotation={[0, 0, 0]}
    />
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color="#8b5cf6" 
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

function EmojiCow() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-[150px] md:text-[200px] animate-bounce">
        🐮
      </div>
    </div>
  );
}

export default function MetaCowModel({ mouse }: { mouse: { x: number; y: number } }) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLSupported(!!gl);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  // Loading state
  if (webGLSupported === null) {
    return (
      <div className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] mx-auto flex items-center justify-center">
        <div className="text-4xl">🐮</div>
      </div>
    );
  }

  // Fallback for no WebGL support
  if (!webGLSupported) {
    return (
      <div className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] mx-auto">
        <EmojiCow />
      </div>
    );
  }

  return (
    <div className="w-[250px] h-[250px] md:w-[350px] md:h-[350px] mx-auto cursor-pointer">
      <Canvas 
        camera={{ 
          position: [0, 0, CONFIG.cameraZ], 
          fov: CONFIG.cameraFOV 
        }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        {/* Main Lighting Setup */}
        <ambientLight intensity={0.5} />
        
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={CONFIG.lightIntensity} 
          castShadow
        />
        
        <directionalLight 
          position={[-5, 3, -3]} 
          intensity={CONFIG.lightIntensity * 0.6}
        />
        
        <pointLight 
          position={[0, 5, 0]} 
          intensity={CONFIG.lightIntensity * 0.4}
        />

        <Suspense fallback={<LoadingFallback />}>
          <Model mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}