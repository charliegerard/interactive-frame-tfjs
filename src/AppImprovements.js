import React, { useRef, useState, useEffect } from "react";
import * as THREE from "./three.module";
import { CameraUtils } from "./CameraUtils";
import { OrbitControls } from "./OrbitControls";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { FBXLoader } from "./FBXLoader";

/*
Credit for 3d model: "Palm Plant" (https://skfb.ly/6VsxQ) by SomeKevin is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
*/

let camera, scene, renderer;
let cameraControls;
let bottomLeftCorner, bottomRightCorner, topLeftCorner;
let detector;

let plant;

let uniforms, displacement, noise, plane;

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
  renderer.localClippingEnabled = true;

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

  //   bottomLeftCorner.set(-50.0, 0, 50.0);
  //   bottomRightCorner.set(50.0, 0.0, 50.0);
  //   topLeftCorner.set(-50.0, 100.1, 50.0);

  // bottomRightCorner.set(50.0, -0.0, -30.0);
  // bottomLeftCorner.set(-50.0, -0.0, -30.0);
  // topLeftCorner.set(-50.0, 100.0, -30.0);
  bottomRightCorner.set(50.0, -0.0, 0.0);
  bottomLeftCorner.set(-50.0, -0.0, 0.0);
  topLeftCorner.set(-50.0, 100.0, 0.0);

  //   // set the projection matrix to encompass the portal's frame
  CameraUtils.frameCorners(
    camera,
    bottomLeftCorner,
    bottomRightCorner,
    topLeftCorner,
    false
  );

  // walls
  const planeTop = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeTop.position.y = 100;
  planeTop.rotateX(Math.PI / 2);
  planeTop.receiveShadow = true;
  scene.add(planeTop);

  const planeBottom = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeBottom.rotateX(-Math.PI / 2);
  planeBottom.receiveShadow = true;
  scene.add(planeBottom);

  const planeFront = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  planeFront.receiveShadow = true;
  scene.add(planeFront);

  const planeBack = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
  planeBack.receiveShadow = true;
  scene.add(planeBack);

  const planeRight = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  const planeLeft = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeLeft.position.x = -50;
  planeLeft.position.y = 50;
  planeLeft.rotateY(Math.PI / 2);
  scene.add(planeLeft);

  // cube
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.x = 0;
  cube.position.y = 50;
  // scene.add(cube);

  // end cube

  const geometry2 = new THREE.TorusGeometry(4, 3, 16, 100);

  const texture = new THREE.TextureLoader().load(
    "http://localhost:3000/donut.jpeg"
  );

  const material2 = new THREE.MeshBasicMaterial({ map: texture });

  plane = new THREE.Mesh(geometry2, material2);
  plane.material.side = THREE.DoubleSide;
  plane.position.x = 0;
  plane.position.y = 50;
  // plane.position.z = -50;

  // scene.add(plane);

  // donut 2
  const geometry3 = new THREE.TorusGeometry(4, 3, 16, 100);

  const material3 = new THREE.MeshBasicMaterial({ map: texture });

  const donut2 = new THREE.Mesh(geometry3, material3);
  donut2.material.side = THREE.DoubleSide;
  donut2.position.x = -30;
  donut2.position.y = 40;
  donut2.position.z = -40;

  // scene.add(donut2);

  // donut 3
  const geometry4 = new THREE.TorusGeometry(4, 3, 16, 100);

  const material4 = new THREE.MeshBasicMaterial({ map: texture });

  const donut3 = new THREE.Mesh(geometry4, material4);
  donut3.material.side = THREE.DoubleSide;
  donut3.position.x = 20;
  donut3.position.y = 50;
  donut3.position.z = 20;

  // scene.add(donut3);

  /* 3D model */

  const loader = new FBXLoader();
  loader.load(
    "https://interactive-frames.netlify.app/palm-plant/source/Pflanze.fbx",
    // "http://localhost:3000/palm-plant/source/Pflanze.fbx",
    function (object) {
      console.log("loaded");
      plant = object;
      plant.traverse(function (child) {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          const texture = new THREE.TextureLoader().load(
            "https://interactive-frames.netlify.app/palm-plant/textures/Pflanze_Albedo.png"
            // "http://localhost:3000/palm-plant/textures/Pflanze_Albedo.png"
          );

          child.material.map = texture;
          child.material.needsUpdate = true;
        }
      });

      plant.castShadow = true;
      if (window.innerWidth < 800) {
        plant.scale.set(0.3, 0.3, 0.25);
      } else {
        // plant.scale.set(0.2, 0.35, 0.2);
        plant.scale.set(0.3, 0.3, 0.25);
      }

      plant.position.set(0, 0, -40);

      scene.add(plant);
    },
    function (e) {
      console.log("loading", e);
    },
    function (e) {
      console.error(e);
    }
  );

  // lights
  const mainLight = new THREE.PointLight(0xffffff, 1.2, 250);
  // mainLight.position.y = 60;
  mainLight.position.y = 50;
  scene.add(mainLight);

  const pointlight = new THREE.PointLight(0xffffff, 1, 100);
  pointlight.position.set(0, 50, -40);
  pointlight.rotation.set(0, -180, 0);
  // scene.add(pointlight);

  const color = 0xffffff;
  const intensity = 1;
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(0, 60, 0);
  directionalLight.castShadow = true;
  directionalLight.target.position.set(0, 60, 30);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const light = new THREE.AmbientLight(0x404040, 1); // soft white light
  light.position.set(0, 0, 0);
  light.castShadow = true;
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
  //   camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onFaceMove(faceX, leftEyeYPosition) {
  // Manually fire the event in OrbitControls
  cameraControls.handleFaceMoveRotate(faceX, leftEyeYPosition);
}

function getFaceCoordinates(poses) {
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
  const rightWristPosition =
    rightHand.score > 0.2 && window.innerWidth - rightHand.x;
  const leftEyeYPosition = leftEye.y;
  //   console.log(leftEyeYPosition);
  const rightEyeYPosition = rightEye.y;

  const middleEyes = leftEyePosition - rightEyePosition / 2;

  if (leftEye.score > 0.7) {
    onFaceMove(middleEyes, leftEyeYPosition);
  }
}

async function animate(time) {
  requestAnimationFrame(animate);

  // save the original camera properties
  const currentRenderTarget = renderer.getRenderTarget();
  const currentXrEnabled = renderer.xr.enabled;
  const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;
  renderer.xr.enabled = false; // Avoid camera modification
  renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
  // renderer.shadowMap.enabled = true;

  // restore the original rendering properties
  renderer.xr.enabled = currentXrEnabled;
  renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
  renderer.setRenderTarget(currentRenderTarget);

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

const AppImprovements = () => {
  useEffect(async () => {
    init();
    await setup();
    animate();
  }, []);
  return <section></section>;
};

export default AppImprovements;
