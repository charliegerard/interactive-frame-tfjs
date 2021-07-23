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

function arcctg(x) {
  return Math.PI / 2 - Math.atan(x);
}

function MoveNet({ video, detector, setRightHandPosition }) {
  const [videoReady, setVideoReady] = useState(false);
  const [rotation, setRotation] = useState(0);

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

      //   console.log(rightHand);

      const leftEyePosition = window.innerWidth - leftEye.x;
      const rightEyePosition = window.innerWidth / 2 - rightEye.x;
      const rightWristPosition =
        rightHand.score > 0.2 && window.innerWidth - rightHand.x;
      const leftEyeYPosition = leftEye.y;
      const rightEyeYPosition = rightEye.y;

      const middleEyes = leftEyePosition - rightEyePosition / 2;

      //   console.log(middleEyes);

      //   console.log(leftEyePosition);

      setRightHandPosition(rightWristPosition);

      //   camera.position.x = 0 + Math.sin(clock.getElapsedTime()) * 30;

      let scaledCoordinate = scaleValue(
        middleEyes,
        [0, window.innerWidth],
        [-70, 60]
      );

      let scaledYCoordinate = scaleValue(
        leftEyeYPosition,
        [0, window.innerHeight],
        [-20, 20]
      );

      const angleRotation = arcctg(50 / scaledCoordinate);
      console.log(angleRotation);

      if (rightEye.score < 0.1) {
        // if (state.scene.children[2].material.opacity > 0) {
        //   state.scene.children[2].material.opacity -= 0.05;
        //   state.scene.children[3].children[0].material.opacity -= 0.05;
        // }
        camera.position.x = 0;
        // camera.rotation.y = 0.1;
        // console.log("here");
      } else {
        // state.scene.children[3].material.opacity = 1;
        // if (state.scene.children[2].material.opacity < 1) {
        //   state.scene.children[2].material.opacity += 0.05;
        //   state.scene.children[3].children[0].material.opacity += 0.05;
        // }
        // camera.position.x = -scaledCoordinate;
        camera.position.x = 0;

        camera.rotation.y = angleRotation;
        // camera.rotation.y = scaledCoordinate / 100;
        // state.scene.children[2].position.x = -scaledCoordinate;
        // camera.position.y = -scaledYCoordinate;
        // camera.rotation.y = scaledCoordinate / 100;
        // camera.rotation.y += 0.001;
      }

      // hand tracking

      const handVector = new THREE.Vector3();
      // the x coordinates seem to be flipped so i'm subtracting them from window innerWidth
      handVector.x = (rightWristPosition / (window.innerWidth + 1000)) * 2 - 1;
      handVector.y = 0;
      handVector.z = 0;
      //   //   handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;

      // handVector.unproject(camera);
      // const cameraPosition = camera.position;
      // const dir = handVector.sub(cameraPosition).normalize();
      // const distance = -cameraPosition.z / dir.z;
      // const newPos = cameraPosition.clone().add(dir.multiplyScalar(distance));

      // if (newPos) {
      //   // state.scene.children[2].position.x = newPos.x;
      //   var raycaster = new THREE.Raycaster();
      //   raycaster.setFromCamera(handVector, camera);
      //   var intersects = raycaster.intersectObject(state.scene.children[2]); // cube

      //   if (intersects.length > 0) {
      //     state.scene.children[2].material.color.set(0xff0000);
      //     // setRotation(0.01);
      //     console.log("touch");
      //   } else {
      //     state.scene.children[2].material.color.set(0x00ff00);
      //   }
      // }

      // state.scene.children[2].rotation.y += rotation;

      state.scene.children[2].material.opacity = 1;
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
      //   width: window.innerWidth,
      //   height: window.innerHeight,
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
    <section className="canvas">
      <Canvas
        shadows
        gl={{ alpha: false, antialias: false }}
        camera={{ fov: 75, position: [0, 0, 60], near: 10, far: 150 }}
        style={{ height: 600, width: 600 }}
      >
        <color attach="background" args={["#f0f0f0"]} />
        {/* <fog attach="fog" args={["#d3d3d3", 60, 10]} /> */}
        {/* <ambientLight intensity={5} /> */}
        <pointLight position={[0, 0, 100]} intensity={3} castShadow />
        <pointLight position={[0, 150, 100]} intensity={5} color="lightgrey" />
        {/* <pointLight position={[0, 100, 100]} intensity={5} color="white" /> */}

        <Box
          position={[0, 0, 0]}
          rotation={[0, 10, 10]}
          rightHandPosition={rightHandPosition}
        />
        {/* <Box position={[0, 0, 0]} /> */}

        {/* <ContactShadows
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -40, 0]}
          width={130}
          height={130}
          blur={1}
          far={40}
          transparent
          opacity={0}
        /> */}
        {/* <EffectComposer multisampling={0}>
          <SSAO
            samples={31}
            radius={10}
            intensity={30}
            luminanceInfluence={0.1}
            color="red"
          />
        </EffectComposer> */}
        <group position={[0, -100, -500]}>
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
    </section>
  );
}
