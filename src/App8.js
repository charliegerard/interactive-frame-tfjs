import React, { useRef, useState, useEffect } from "react";
import * as THREE from "./three.module";
import { CameraUtils } from "./CameraUtils";
import { OrbitControls } from "./OrbitControls";

let camera, scene, renderer;
let cameraControls;
let reflectedPosition,
  bottomLeftCorner,
  bottomRightCorner,
  topLeftCorner,
  frustumHelper;
let planeLeft;

function init() {
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

  // portals
  // camera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 500.0);
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
  reflectedPosition = new THREE.Vector3();

  //   bottomLeftCorner.set(-50.0, 0, 50.0);
  //   bottomRightCorner.set(50.0, 0.0, 50.0);
  //   topLeftCorner.set(-50.0, 100.1, 50.0);

  bottomRightCorner.set(50.0, -0.0, 10.0);
  bottomLeftCorner.set(-50.0, -0.0, 10.0);
  topLeftCorner.set(-50.0, 100.0, 10.0);

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
    new THREE.MeshPhongMaterial({ color: 0x7f7fff })
  );
  planeFront.position.z = 50;
  planeFront.position.y = 50;
  planeFront.rotateY(Math.PI);
  scene.add(planeFront);

  const planeBack = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xff7fff })
  );
  planeBack.position.z = -50;
  planeBack.position.y = 50;
  scene.add(planeBack);

  const planeRight = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0x00ff00 })
  );
  planeRight.position.x = 50;
  planeRight.position.y = 50;
  planeRight.rotateY(-Math.PI / 2);
  scene.add(planeRight);

  planeLeft = new THREE.Mesh(
    planeGeo,
    new THREE.MeshPhongMaterial({ color: 0xff0000 })
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
  scene.add(cube);

  // lights
  const mainLight = new THREE.PointLight(0xcccccc, 1.5, 250);
  mainLight.position.y = 60;
  scene.add(mainLight);

  const greenLight = new THREE.PointLight(0x00ff00, 0.25, 1000);
  greenLight.position.set(550, 50, 0);
  scene.add(greenLight);

  const redLight = new THREE.PointLight(0xff0000, 0.25, 1000);
  redLight.position.set(-550, 50, 0);
  scene.add(redLight);

  const blueLight = new THREE.PointLight(0x7f7fff, 0.25, 1000);
  blueLight.position.set(0, 50, 550);
  scene.add(blueLight);

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

function animate() {
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

  CameraUtils.frameCorners(
    camera,
    bottomLeftCorner,
    bottomRightCorner,
    topLeftCorner,
    false
  );

  // render the main scene
  renderer.render(scene, camera);
}

const App8 = () => {
  useEffect(() => {
    init();
    animate();
  }, []);
  return <section>test</section>;
};

export default App8;
