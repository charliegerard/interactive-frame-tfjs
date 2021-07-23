import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import * as THREE from "three";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";

const lookAtCubePosition = new THREE.Vector3();

function MyBox({ xMovement }) {
  const ref = useRef();
  useFrame((state, delta) => {
    // console.log(xMovement);
    // if (ref.current.position.x > 3) {
    //   ref.current.position.x = -3;
    // ref.current.rotation.y = -(xMovement / 100);
    // this one
    // ---------
    // ref.current.position.x = -xMovement / 5;
    console.log(xMovement);
    // ref.current.rotation.y = -xMovement / 90;
    ref.current.rotation.y = xMovement / 90;
    // ---------
    // } else {
    //   ref.current.position.x += delta * 1;
    // }
    // console.log("no??", xMovement);
  });

  useFrame((state) => {
    lookAtCubePosition.x = ref.current.position.x;
    state.camera.lookAt(lookAtCubePosition);
  });

  return (
    <mesh position={[0, 0, 0]} ref={ref}>
      <boxBufferGeometry attach="geometry" args={[5, 5, 5]} />
      <meshNormalMaterial attach="material" />
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
  const video = await setupCamera();
  video.play();
  return setVideo(video);
};

function MoveNet({ video, detector, setRightHandPosition, setXMovement }) {
  const [videoReady, setVideoReady] = useState(false);
  const [rotation, setRotation] = useState(0);

  useFrame(async ({ clock, camera, ...state }) => {
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
        [-60, 60]
      );

      setXMovement(scaledCoordinate);

      let scaledYCoordinate = scaleValue(
        leftEyeYPosition,
        [0, window.innerHeight],
        [-20, 20]
      );

      if (rightEye.score < 0.1) {
        // if (state.scene.children[2].material.opacity > 0) {
        //   state.scene.children[2].material.opacity -= 0.05;
        //   state.scene.children[3].children[0].material.opacity -= 0.05;
        // }
        // camera.position.x = 0;
        // camera.rotation.y = 0.1;
        // console.log("here");
      } else {
        // state.scene.children[3].material.opacity = 1;
        // if (state.scene.children[2].material.opacity < 1) {
        //   state.scene.children[2].material.opacity += 0.05;
        //   state.scene.children[3].children[0].material.opacity += 0.05;
        // }
        // camera.position.x = -scaledCoordinate;
        // camera.rotation.y = scaledCoordinate / 100;
        // state.scene.children[2].position.x = -scaledCoordinate;
        // camera.position.y = -scaledYCoordinate;
        // camera.rotation.y = scaledCoordinate / 100;
        // camera.rotation.y += 0.001;
      }

      // hand tracking

      //   const handVector = new THREE.Vector3();
      //   // the x coordinates seem to be flipped so i'm subtracting them from window innerWidth
      //   handVector.x = (rightWristPosition / (window.innerWidth + 1000)) * 2 - 1;
      //   handVector.y = 0;
      //   handVector.z = 0;
      //   //   //   handVector.y = -(hand.coordinates.y / window.innerHeight) * 2 + 1;

      //   handVector.unproject(camera);
      //   const cameraPosition = camera.position;
      //   const dir = handVector.sub(cameraPosition).normalize();
      //   const distance = -cameraPosition.z / dir.z;
      //   const newPos = cameraPosition.clone().add(dir.multiplyScalar(distance));

      //   if (newPos) {
      //     // state.scene.children[2].position.x = newPos.x;
      //     var raycaster = new THREE.Raycaster();
      //     raycaster.setFromCamera(handVector, camera);
      //     var intersects = raycaster.intersectObject(state.scene.children[2]); // cube

      //     if (intersects.length > 0) {
      //       state.scene.children[2].material.color.set(0xff0000);
      //       setRotation(0.01);
      //       console.log("touch");
      //     } else {
      //       state.scene.children[2].material.color.set(0x00ff00);
      //     }
      //   }

      //   state.scene.children[2].rotation.y += rotation;
      //   state.scene.children[2].material.opacity = 1;
    }
  });
  return null;
}

export default function App5() {
  const [detector, setDetector] = useState(null);
  const [video, setVideo] = useState(null);
  const [rightHandPosition, setRightHandPosition] = useState(null);
  const [xMovement, setXMovement] = useState(0);

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

  function KeyLight({ brightness, color }) {
    return (
      <rectAreaLight
        width={3}
        height={3}
        color={color}
        intensity={brightness}
        position={[-2, 0, 0]}
        lookAt={[0, 0, 0]}
        penumbra={1}
        castShadow
      />
    );
  }
  function FillLight({ brightness, color }) {
    return (
      <rectAreaLight
        width={3}
        height={3}
        intensity={brightness}
        color={color}
        position={[2, 1, 0]}
        lookAt={[0, 0, 0]}
        penumbra={2}
        castShadow
      />
    );
  }

  function RimLight({ brightness, color }) {
    return (
      <rectAreaLight
        width={2}
        height={2}
        intensity={brightness}
        color={color}
        position={[1, 4, 0]}
        rotation={[0, 180, 0]}
        castShadow
      />
    );
  }

  return (
    <section className="canvas">
      <Canvas
        shadows
        gl={{ alpha: false, antialias: false }}
        camera={{
          fov: 75,
          position: [0, 0, 20],
          near: 10,
          far: 150,
          //   position: [0, 0, 100],
        }}
        style={{ height: 600, width: 600 }}
      >
        <color attach="background" args={["#f0f0f0"]} />
        <directionalLight intensity={50} position={[0, 40, 100]} castShadow />
        {/* <KeyLight brightness={5.6} color={"#ffc9f9"} /> */}
        {/* <FillLight brightness={2.6} color={"#bdefff"} /> */}
        {/* <RimLight brightness={54} color={"#fff"} /> */}
        {/* <ambientLight intensity={1} /> */}
        {/* <pointLight position={[0, 0, 100]} intensity={3} castShadow /> */}
        {/* <pointLight position={[0, 50, 100]} intensity={3} castShadow /> */}
        {/* <pointLight position={[0, 150, 100]} intensity={5} color="lightgrey" /> */}
        <MyBox xMovement={xMovement} />

        <group position={[0, -100, -30]} rotation={[0, -xMovement / 200, 0]}>
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
            setXMovement={setXMovement}
          />
        )}
      </Canvas>
    </section>
  );
}
