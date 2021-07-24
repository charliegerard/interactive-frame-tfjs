import React, { useEffect } from "react";
import * as THREE from "./utils/three.module";
import { CameraUtils } from "./utils/CameraUtils";
import { OrbitControls } from "./OrbitControls";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { FBXLoader } from "./utils/FBXLoader";

/*
Credit for 3d model: "Palm Plant" (https://skfb.ly/6VsxQ) by SomeKevin is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
*/

let camera, scene, renderer;
let cameraControls;
let bottomLeftCorner, bottomRightCorner, topLeftCorner;
let detector;

let plant;
let defaultVideoWidth = 640;

/* Detect if device is a touch screen or not */
let touchscreen = "ontouchstart" in window ? true : false;

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

const setup = async () => {
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet
  );
  const video = await setupCamera();
  video.play();
  return video;
};

async function init() {
  const container = document.getElementById("container");

  // renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  // renderer.localClippingEnabled = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMapSoft = true;

  // scene
  scene = new THREE.Scene();

  // camera
  const planeGeo = new THREE.PlaneGeometry(100.1, 100.1);

  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    5000
  );
  camera.position.set(0, 50, 100);
  scene.add(camera);

  cameraControls = new OrbitControls(camera, renderer.domElement);
  cameraControls.target.set(0, 40, 0);
  cameraControls.maxDistance = 400;
  cameraControls.minDistance = 10;
  cameraControls.dispose();
  cameraControls.update();

  bottomLeftCorner = new THREE.Vector3();
  bottomRightCorner = new THREE.Vector3();
  topLeftCorner = new THREE.Vector3();

  if (touchscreen) {
    bottomRightCorner.set(50.0, -0.0, -10.0);
    bottomLeftCorner.set(-50.0, -0.0, -10.0);
    topLeftCorner.set(-50.0, 100.0, -10.0);
  } else {
    bottomRightCorner.set(50.0, -0.0, -30.0);
    bottomLeftCorner.set(-50.0, -0.0, -30.0);
    topLeftCorner.set(-50.0, 100.0, -30.0);
  }

  // set the projection matrix to encompass the portal's frame
  // CameraUtils.frameCorners(
  //   camera,
  //   bottomLeftCorner,
  //   bottomRightCorner,
  //   topLeftCorner,
  //   false
  // );

  // texture for frame
  const texture = new THREE.TextureLoader().load(
    // "http://localhost:3000/white-wall-texture.jpeg"
    "https://interactive-frame.netlify.app/white-wall-texture.jpeg"
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // walls
  const planeTop = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeTop.position.y = 100;
  planeTop.rotateX(Math.PI / 2);
  planeTop.receiveShadow = true;
  scene.add(planeTop);

  const planeBottom = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeBottom.rotateX(-Math.PI / 2);
  planeBottom.receiveShadow = true;
  scene.add(planeBottom);

  const planeFront = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  planeFront.receiveShadow = true;
  scene.add(planeFront);

  const planeBack = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
  planeBack.receiveShadow = true;
  scene.add(planeBack);

  const planeRight = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.receiveShadow = true;
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  const planeLeft = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture })
  );
  planeLeft.position.x = -50;
  planeLeft.position.y = 50;
  planeLeft.receiveShadow = true;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  /* 3D model */

  const loader = new FBXLoader();
  loader.load(
    "https://interactive-frame.netlify.app/palm-plant/source/Pflanze.fbx",
    // "http://localhost:3000/palm-plant/source/Pflanze.fbx",
    function (object) {
      plant = object;
      plant.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = false;

          const texture = new THREE.TextureLoader().load(
            "https://interactive-frame.netlify.app/palm-plant/textures/Pflanze_Albedo.png"
            // "http://localhost:3000/palm-plant/textures/Pflanze_Albedo_small.png"
          );

          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });

      plant.castShadow = true;
      plant.receiveShadow = false;
      if (touchscreen) {
        plant.scale.set(0.3, 0.3, 0.25);
      } else {
        plant.scale.set(0.22, 0.35, 0.22);
      }

      if (touchscreen) {
        plant.position.set(0, 0, -20);
      } else {
        plant.position.set(0, 0, -40);
      }

      scene.add(plant);
    },
    undefined,
    function (e) {
      console.error(e);
    }
  );

  // lights
  const mainLight = new THREE.PointLight(0xffffff, 1, 250);
  mainLight.position.y = 50;
  mainLight.position.z = 10;
  // scene.add(mainLight);

  const color = 0xffffff;
  // const color = 0xdfebff;
  // const intensity = 1;
  const intensity = 1;
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(0, 60, 0);
  // directionalLight.position.set(100, 100, 50);
  directionalLight.castShadow = true;
  // directionalLight.target.position.set(0, 20, -40);
  // scene.add(directionalLight);
  // scene.add(directionalLight.target);

  /*
 test
  */

  const Dlight = new THREE.DirectionalLight(0x404040, 1);
  Dlight.position.set(100, 120, 300);
  Dlight.castShadow = true;
  Dlight.shadow.camera.top = 200;
  Dlight.shadow.camera.bottom = -200;
  Dlight.shadow.camera.right = 200;
  Dlight.shadow.camera.left = -200;
  Dlight.shadow.mapSize.set(4096, 4096);
  // Dlight.target.position.set(0, 60, -40);
  scene.add(Dlight);
  // scene.add(Dlight.target);

  /* end test*/

  const light = new THREE.AmbientLight(0xffffff, 0.8); // soft white light
  light.position.set(0, 0, 300);
  scene.add(light);

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("mousemove", onDocumentMouseMove, false);
}

function onDocumentMouseMove(event) {
  // Manually fire the event in OrbitControls
  cameraControls.handleMouseMoveRotate(event);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onFaceMove(faceX, leftEyeYPosition) {
  // Manually fire the event in OrbitControls
  cameraControls.handleFaceMoveRotate(faceX, leftEyeYPosition);
}

function scaleValue(value, from, to) {
  var scale = (to[1] - to[0]) / (from[1] - from[0]);
  var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];

  return ~~(capped * scale + to[0]);
}

function getFaceCoordinates(poses) {
  const leftEye = poses[0]?.keypoints.filter(
    (keypoint) => keypoint.name === "left_eye"
  )[0];
  const rightEye = poses[0]?.keypoints.filter(
    (keypoint) => keypoint.name === "right_eye"
  )[0];

  // the coordinates for the eyes will be based on the default size of the video element (640x480) so we need to do some calculation to make it match the window size instead

  /* 
    min 0 - max 640
    min 0 - max window.innerWidth (1300)

  */

  if (leftEye.score > 0.7) {
    let scaledLeftEyeXCoordinate = scaleValue(
      leftEye.x,
      [0, defaultVideoWidth],
      [0, window.innerWidth]
    );

    let scaledRightEyeXCoordinate = scaleValue(
      rightEye.x,
      [0, defaultVideoWidth],
      [0, window.innerWidth]
    );

    const leftEyePosition = window.innerWidth - scaledLeftEyeXCoordinate;
    // const rightEyePosition = window.innerWidth - scaledRightEyeXCoordinate;
    const leftEyeYPosition = leftEye.y;

    // const middleEyes = leftEyePosition - rightEyePosition / 2;

    // onFaceMove(middleEyes, leftEyeYPosition);
    onFaceMove(leftEyePosition, leftEyeYPosition);
  }
}

async function animate() {
  requestAnimationFrame(animate);

  // save the original camera properties
  // const currentRenderTarget = renderer.getRenderTarget();
  // const currentXrEnabled = renderer.xr.enabled;
  // const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
  // renderer.xr.enabled = false; // Avoid camera modification
  // renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
  // renderer.shadowMap.enabled = true;

  // restore the original rendering properties
  // renderer.xr.enabled = currentXrEnabled;
  // renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
  // renderer.setRenderTarget(currentRenderTarget);

  const poses = await detector?.estimatePoses(video);
  getFaceCoordinates(poses);

  CameraUtils.frameCorners(
    camera,
    bottomLeftCorner,
    bottomRightCorner,
    topLeftCorner,
    false
  );

  renderer.render(scene, camera);
}

const App = () => {
  useEffect(async () => {
    init();
    await setup();
    animate();
  }, []);
  return <></>;
};

export default App;
