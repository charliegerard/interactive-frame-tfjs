import React, { useRef } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";

const lookAtCubePosition = new THREE.Vector3();

function MyBox() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current.position.x > 3) {
      ref.current.position.x = -3;
    } else {
      ref.current.position.x += delta * 1;
    }
  });

  useFrame((state) => {
    lookAtCubePosition.x = ref.current.position.y;
    state.camera.lookAt(lookAtCubePosition);
  });

  return (
    <mesh position={[0, 0, 0]} ref={ref}>
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshNormalMaterial attach="material" />
    </mesh>
  );
}

export default function App4() {
  return (
    <section className="canvas">
      <Canvas
        shadows
        gl={{ alpha: false, antialias: false }}
        camera={{ fov: 75, position: [0, 0, 60], near: 10, far: 150 }}
        style={{ height: 600, width: 600 }}
        camera={{ position: [0, 0, 3] }}
      >
        <MyBox />
      </Canvas>
    </section>
  );
}
