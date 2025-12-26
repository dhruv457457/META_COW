import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { useRef } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three-stdlib';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

function Model({ mouse }) {
  const modelRef = useRef();
  const gltf = useLoader(GLTFLoader, '/models/metacoww.glb', loader => {
    loader.setDRACOLoader(dracoLoader);
  });

  useFrame(() => {
    const t = performance.now() / 1000;
    if (modelRef.current) {
      modelRef.current.rotation.y += (mouse.x * 0.3 - modelRef.current.rotation.y) * 0.1;
      modelRef.current.rotation.x += (mouse.y * 0.15 - modelRef.current.rotation.x) * 0.1;
      modelRef.current.scale.setScalar(1.2 + 0.02 * Math.sin(t * 2)); // breathing effect
    }
  });

  return (
    <primitive
      object={gltf.scene}
      ref={modelRef}
      scale={2.2}
      position={[0, -0.2, 0]}
    />
  );
}

export default function MetaCowModel({ mouse }) {
  return (
    <div className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] mx-auto">
      <Canvas camera={{ position: [0, 0, 6], fov: 30 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 5, 5]} intensity={5} />
        <Model mouse={mouse} />
      </Canvas>
    </div>
  );
}
