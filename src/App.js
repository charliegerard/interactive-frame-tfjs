import * as THREE from "three";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, SSAO } from "@react-three/postprocessing";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Physics, usePlane, useSphere } from "@react-three/cannon";

// A physical sphere tied to mouse coordinates without visual representation
function Mouse() {
  const { viewport } = useThree();
  const [, api] = useSphere(() => ({ type: "Kinematic", args: 6 }));
  return useFrame((state) =>
    api.position.set(
      (state.mouse.x * viewport.width) / 2,
      (state.mouse.y * viewport.height) / 2,
      7
    )
  );
}

// Spheres falling down
function InstancedSpheres({ count = 200 }) {
  const { viewport } = useThree();
  const [ref] = useSphere((index) => ({
    mass: 1,
    position: [
      -40 + Math.random() * 80,
      -20 + Math.random() * 40,
      //   -20 + Math.random() * 40,
      0,
      0,
    ],
    args: 1,
  }));
  return (
    <instancedMesh
      ref={ref}
      castShadow
      receiveShadow
      args={[null, null, count]}
    >
      <sphereBufferGeometry args={[1, 32, 32]} />
      <meshLambertMaterial color="#ff7b00" />
    </instancedMesh>
  );
}

function Swarm({ count, rightHandPosition, ...props }) {
  const mesh = useRef();
  const [dummy] = useState(() => new THREE.Object3D());

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -40 + Math.random() * 80;
      const yFactor = -20 + Math.random() * 40;
      const zFactor = -20 + Math.random() * 40;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.max(1.5, Math.cos(t) * 5);

      // particle.mx +=
      //   (state.mouse.x * state.viewport.width - particle.mx) * 0.02;
      // particle.my +=
      //   (state.mouse.y * state.viewport.height - particle.my) * 0.02;

      //   particle.mx +=
      //     (rightHandPosition * state.viewport.width - particle.mx) * 0.02;
      particle.mx += rightHandPosition / 1000;

      //   console.log(particle.mx);
      // particle.my +=
      //   (state.mouse.y * state.viewport.height - particle.my) * 0.02;

      dummy.position.set(
        (particle.mx / 10) * a +
          xFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b +
          yFactor +
          Math.sin((t / 10) * factor) +
          (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b +
          zFactor +
          Math.cos((t / 10) * factor) +
          (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[null, null, count]}
      castShadow
      receiveShadow
      {...props}
    >
      <sphereBufferGeometry args={[1, 32, 32]} />
      <meshStandardMaterial roughness={0} color="#f0f0f0" />
    </instancedMesh>
  );
}

function Plane2({ color, ...props }) {
  return (
    <mesh receiveShadow castShadow {...props}>
      <boxBufferGeometry />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function scaleValue(value, from, to) {
  var scale = (to[1] - to[0]) / (from[1] - from[0]);
  var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];

  return ~~(capped * scale + to[0]);
}

function MoveNet({ video, detector, setRightHandPosition }) {
  const [videoReady, setVideoReady] = useState(false);

  useFrame(async ({ clock, camera }) => {
    if (video) {
      video.onloadedmetadata = async () => {
        video.play();
        setVideoReady(true);
      };
    }
    if (videoReady) {
      const poses = await detector?.estimatePoses(video);
      //   console.log(poses[0]?.keypoints);
      const leftEye = poses[0]?.keypoints.filter(
        (keypoint) => keypoint.name === "left_eye"
      )[0];
      const rightEye = poses[0]?.keypoints.filter(
        (keypoint) => keypoint.name === "right_eye"
      )[0];
      const rightHand = poses[0]?.keypoints.filter(
        (keypoint) => keypoint.name === "right_wrist"
      )[0];

      const leftEyePosition = window.innerWidth - leftEye.x;
      const rightEyePosition = window.innerWidth - rightEye.x;
      const rightWristPosition = window.innerWidth - rightHand.x;

      setRightHandPosition(rightWristPosition);

      //   camera.position.x = 0 + Math.sin(clock.getElapsedTime()) * 30;

      let scaledCoordinate = scaleValue(
        rightEyePosition,
        [0, window.innerWidth],
        [-30, 30]
      );

      camera.position.x = scaledCoordinate;
    }
  });
  return null;
}

// const loadVideo = async () => {
//   const video = await setupCamera();
//   video.play();
//   return video;
// };

const setupCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  const video = document.getElementById("video");
  video.width = window.innerWidth;
  video.height = window.innerHeight;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: window.innerWidth,
      height: window.innerHeight,
    },
  });
  video.srcObject = stream;

  return new Promise(
    (resolve) => (video.onloadedmetadata = () => resolve(video))
  );
};

const setup = async (setDetector, setVideo) => {
  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );
  setDetector(detector);
  //   const video = await loadVideo();

  const video = await setupCamera();

  video.play();

  return setVideo(video);
};

export default function App() {
  const [detector, setDetector] = useState(null);
  const [video, setVideo] = useState(null);
  const [rightHandPosition, setRightHandPosition] = useState(null);

  const prevVideo = usePrevious(video);

  function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

  useEffect(() => {
    if (prevVideo !== video) {
      setup(setDetector, setVideo);
    }
  }, [detector, video]);

  return (
    <>
      <Canvas
        shadows
        gl={{ alpha: false, antialias: false }}
        camera={{ fov: 75, position: [0, 0, 60], near: 10, far: 150 }}
      >
        <color attach="background" args={["#f0f0f0"]} />
        {/* <fog attach="fog" args={['red', 60, 100]} /> */}
        <ambientLight intensity={1.5} />
        <pointLight position={[100, 10, -50]} intensity={20} castShadow />
        <pointLight position={[-100, -100, -100]} intensity={10} color="red" />

        {/* <Physics
          gravity={[0, -50, 0]}
          defaultContactMaterial={{ restitution: 0.5 }}
        >
          <group position={[0, 0, -10]}>
            <Mouse />

            <InstancedSpheres />
          </group>
        </Physics> */}

        <Swarm
          count={150}
          position={[0, 10, 0]}
          rightHandPosition={rightHandPosition}
        />

        <ContactShadows
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -30, 0]}
          opacity={0.6}
          width={130}
          height={130}
          blur={1}
          far={40}
        />
        <EffectComposer multisampling={0}>
          <SSAO
            samples={31}
            radius={10}
            intensity={30}
            luminanceInfluence={0.1}
            color="red"
          />
        </EffectComposer>
        <group position={[0, -45, -10]}>
          <Plane2
            color="hotpink"
            rotation-x={-Math.PI / 2}
            position-z={2}
            scale={[200, 200, 0.2]}
          />
          <Plane2
            color="#e4be00"
            rotation-x={-Math.PI / 2}
            position-y={35}
            position-z={-60}
            scale={[200, 0.2, 80]}
          />
          <Plane2
            color="#736fbd"
            rotation-x={-Math.PI / 2}
            position={[70, 35, 3.5]}
            scale={[0.5, 400, 78]}
          />
          <Plane2
            color="#736fbd"
            rotation-x={-Math.PI / 2}
            position={[-100, 35, 3.5]}
            scale={[0.5, 400, 78]}
          />
        </group>
        {detector && video && (
          <MoveNet
            video={video}
            detector={detector}
            setRightHandPosition={setRightHandPosition}
          />
        )}
      </Canvas>
    </>
  );
}
