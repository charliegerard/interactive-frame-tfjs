import * as THREE from "three";
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { EffectComposer, SSAO } from "@react-three/postprocessing";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { Physics, usePlane, useSphere } from "@react-three/cannon";

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

const coords = new THREE.Vector2(-1, -1);

const handleMouseMove = (rightHandPosition) => {
  coords.x = (rightHandPosition / window.innerWidth) * 2 - 1;
  // coords.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

function Box(props) {
  // This reference will give us direct access to the mesh
  const mesh = useRef();
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const { rightHandPosition } = props;

  // Rotate mesh every frame, this is outside of React without overhead
  //   useFrame(() => {
  // handleMouseMove(rightHandPosition);
  //     mesh.current.rotation.x = mesh.current.rotation.y += 0.01;
  // mesh.current.rotation.y = coords.x += 0.01;
  //   });

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? 1.5 : 1}
      onClick={(e) => setActive(!active)}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}
    >
      <boxGeometry args={[20, 20, 20]} />
      <meshStandardMaterial
        color={hovered ? "hotpink" : "orange"}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

function Plane({ color, ...props }) {
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

  useFrame(async ({ clock, camera, ...state }) => {
    // console.log(state.scene.children);

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
      const rightEyePosition = window.innerWidth / 2 - rightEye.x;
      const rightWristPosition = window.innerWidth - rightHand.x;

      const middleEyes = leftEyePosition - rightEyePosition / 2;

      //   console.log(middleEyes);

      //   console.log(leftEyePosition);

      setRightHandPosition(rightWristPosition);

      //var raycaster = new THREE.Raycaster();
      //   raycaster.setFromCamera(coords, camera);
      //   var intersects = raycaster.intersectObject(cube);

      //   if (intersects.length > 0) {
      //     //   cube.material.color.set(0xff0000);
      //     console.log("touch");
      //   } else {
      //     //   cube.material.color.set(0x00ff00);
      //   }

      //   camera.position.x = 0 + Math.sin(clock.getElapsedTime()) * 30;

      let scaledCoordinate = scaleValue(
        middleEyes,
        [0, window.innerWidth],
        [-70, 60]
      );

      if (rightEye.score < 0.1) {
        if (state.scene.children[2].material.opacity > 0) {
          state.scene.children[2].material.opacity -= 0.05;
          state.scene.children[3].children[0].material.opacity -= 0.05;
        }
        camera.position.x = 0;
      } else {
        // state.scene.children[3].material.opacity = 1;

        if (state.scene.children[2].material.opacity < 1) {
          state.scene.children[2].material.opacity += 0.05;
          state.scene.children[3].children[0].material.opacity += 0.05;
        }

        camera.position.x = scaledCoordinate;
      }
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

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
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

export default function App2() {
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

  const fullScreenButton = document.getElementsByClassName("fullscreen")[0];
  fullScreenButton.onclick = () => toggleFullScreen();

  return (
    <>
      <Canvas
        shadows
        gl={{ alpha: false, antialias: false }}
        camera={{ fov: 75, position: [0, 0, 60], near: 10, far: 150 }}
      >
        <color attach="background" args={["#f0f0f0"]} />
        {/* <fog attach="fog" args={["#d3d3d3", 60, 10]} /> */}
        {/* <ambientLight intensity={5} /> */}
        <pointLight position={[0, 0, 100]} intensity={3} castShadow />
        <pointLight position={[0, 100, 100]} intensity={5} color="white" />

        <Box position={[0, 0, 0]} rightHandPosition={rightHandPosition} />
        {/* <Box position={[0, 0, 0]} /> */}

        <ContactShadows
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -40, 0]}
          width={130}
          height={130}
          blur={1}
          far={40}
          transparent
          opacity={0}
        />
        {/* <EffectComposer multisampling={0}>
          <SSAO
            samples={31}
            radius={10}
            intensity={30}
            luminanceInfluence={0.1}
            color="red"
          />
        </EffectComposer> */}
        <group position={[0, -95, -10]}>
          <Plane
            color="#f6f6f6"
            rotation-x={-Math.PI / 2}
            position-z={2}
            scale={[200, 200, 0.2]}
          />
          <Plane
            color="#f6f6f6"
            rotation-x={-Math.PI / 2}
            position={[0, 0, -80]}
            scale={[200, 0.2, 400]}
          />
          <Plane
            color="#f6f6f6"
            rotation-x={-Math.PI / 2}
            position={[100, 100, 3.5]}
            scale={[0.2, 200, 200]}
          />
          <Plane
            color="#f6f6f6"
            rotation-x={-Math.PI / 2}
            position={[-100, 100, 3.5]}
            scale={[0.2, 200, 200]}
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
