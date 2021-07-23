import React, { useRef, useState, useEffect } from "react";
import * as THREE from "./three.module";
import { CameraUtils } from "./CameraUtils";
import { OrbitControls } from "./OrbitControls";
import "@mediapipe/pose";
import * as poseDetection from "@tensorflow-models/pose-detection";

let camera, scene, renderer;
let cameraControls;
let bottomLeftCorner, bottomRightCorner, topLeftCorner;
let detector;

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

  bottomRightCorner.set(50.0, -0.0, -30.0);
  bottomLeftCorner.set(-50.0, -0.0, -30.0);
  topLeftCorner.set(-50.0, 100.0, -30.0);

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
  scene.add(planeTop);

  const planeBottom = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeBottom.rotateX(-Math.PI / 2);
  scene.add(planeBottom);

  const planeFront = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const planeBack = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
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

  // const geometry2 = new THREE.PlaneGeometry(100, 100, 100, 100);

  // uniforms = {
  //   iTime: { value: 0 },
  //   iResolution: { value: new THREE.Vector3() },
  // };

  // const material2 = new THREE.ShaderMaterial({
  //   uniforms,
  //   fragmentShader,
  // });

  // code for 3d shader
  // uniforms = {
  //   amplitude: { value: 1.0 },
  //   color: { value: new THREE.Color(0xff2200) },
  //   colorTexture: {
  //     value: new THREE.TextureLoader().load("http://localhost:3000/water.jpeg"),
  //   },
  // };

  // uniforms["colorTexture"].value.wrapS = uniforms["colorTexture"].value.wrapT =
  //   THREE.RepeatWrapping;

  // const material2 = new THREE.ShaderMaterial({
  //   uniforms: uniforms,
  //   vertexShader: document.getElementById("vertex").textContent,
  //   fragmentShader: document.getElementById("fragment").textContent,
  // });

  //end of code for shader

  // const geometry2 = new THREE.PlaneGeometry(100, 100, 50, 50);

  // code for 3d shader

  // displacement = new Float32Array(geometry2.attributes.position.count);

  // noise = new Float32Array(geometry2.attributes.position.count);

  // for (let i = 0; i < displacement.length; i++) {
  //   noise[i] = Math.random() * 5;
  // }

  // geometry2.setAttribute(
  //   "displacement",
  //   new THREE.BufferAttribute(displacement, 1)
  // );

  //end of code for shader

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

  // lights
  const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
  mainLight.position.y = 60;
  scene.add(mainLight);

  const greenLight = new THREE.PointLight(0xcccccc, 0.25, 1000);
  greenLight.position.set(550, 50, 0);
  scene.add(greenLight);

  const redLight = new THREE.PointLight(0xcccccc, 0.25, 1000);
  redLight.position.set(-550, 50, 0);
  scene.add(redLight);

  const blueLight = new THREE.PointLight(0xcccccc, 0.25, 1000);
  blueLight.position.set(0, 50, 550);
  scene.add(blueLight);

  window.addEventListener("resize", onWindowResize);
  //   document.addEventListener("mousemove", onDocumentMouseMove, false);
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
    console.log(middleEyes);
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

  time *= 0.01;
  const canvas = renderer.domElement;
  // uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  // uniforms.iTime.value = time;

  // Code for 3d from shader
  // plane.rotation.y = plane.rotation.z = 0.01 * time;

  // uniforms["amplitude"].value = 2.5 * Math.sin(plane.rotation.y * 0.125);
  // uniforms["color"].value.offsetHSL(0.0005, 0, 0);

  // for (let i = 0; i < displacement.length; i++) {
  //   displacement[i] = Math.sin(0.1 * i + time);

  //   noise[i] += 0.5 * (0.5 - Math.random());
  //   noise[i] = THREE.MathUtils.clamp(noise[i], -5, 5);

  //   displacement[i] += noise[i];
  // }

  // plane.geometry.attributes.displacement.needsUpdate = true;
  // end of code for shader

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
