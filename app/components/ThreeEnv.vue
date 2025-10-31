<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  PlaneGeometry,
  MeshStandardMaterial,
  Mesh,
  HemisphereLight,
  SRGBColorSpace,
  PCFSoftShadowMap,
  Vector2,
  Vector3,
  Raycaster,
  Plane,
  Box3,
  LineBasicMaterial,
  LineLoop,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GridHelper } from "three";

import { furnitureCatalog } from "@/utils/furniture";
import { isObject } from "@vueuse/core";

const loading = ref(true);

const container = ref<HTMLDivElement | null>(null);

let renderer: WebGLRenderer;
let scene: Scene;
let camera: PerspectiveCamera;
let controls: OrbitControls;
let animationId = 0;
let resizeObserver: ResizeObserver;

let raycaster;
let pointer;
let selected = ref<any>(null);
let dragging = false;
let dragPlane;
let dragPoint;
let dragOffset;

const PLANE_W = 60;
const PLANE_H = 60;
const HALF_W = PLANE_W / 2;
const HALF_H = PLANE_H / 2;

const _box = new Box3();
const _newBox = new Box3();
const _target = new Vector3();
const _delta = new Vector3();

function addGridOutline(size: number) {
  const half = size / 2;
  const points = [
    -half,
    -half,
    0,
    half,
    -half,
    0,
    half,
    half,
    0,
    -half,
    half,
    0,
  ];

  const mat = new LineBasicMaterial({ color: 0x000000 });
  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(points, 3));
  const outline = new LineLoop(geo, mat);
  scene.add(outline);
}

function fitPlaneToView(planeW: number, planeH: number) {
  if (!container.value || !camera) return;
  const aspect = container.value.clientWidth / container.value.clientHeight;
  const fov = (camera.fov * Math.PI) / 180;
  const distV = planeH / 2 / Math.tan(fov / 2);
  const distH = planeW / 2 / Math.tan(fov / 2) / aspect;
  const dist = Math.max(distV, distH) * 1.1;
  camera.position.set(0, 0, dist);
  camera.lookAt(0, 0, 0);
  controls?.target.set(0, 0, 0);
  controls?.update();
}

function createFurniture(func: Function) {
  const furniture = func();
  furniture.rotation.set(Math.PI / 2, 0, 0);
  furniture.userData.isFurniture = true;
  scene.add(furniture);
}

function colorize(obj: any, hex: number) {
  obj.traverse((o: any) => {
    if (o.isMesh && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m: MeshStandardMaterial) => {
        if (!m.userData) m.userData = {};
        if (m.color && m.userData.baseColor === undefined) {
          m.userData.baseColor = m.color.getHex();
        }
        if (m.color) m.color.setHex(hex);
      });
    }
  });
}

function restoreColor(obj: any) {
  obj.traverse((o: any) => {
    if (o.isMesh && o.material) {
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m: MeshStandardMaterial) => {
        if (m.color && m.userData?.baseColor !== undefined) {
          m.color.setHex(m.userData.baseColor);
        }
      });
    }
  });
}

function onPointerDown(e: PointerEvent, pointer: Vector2) {
  if (!camera) return;
  ndc(e, pointer);
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObjects(scene.children, true).find((i) => {
    let o: any = i.object;
    while (o) {
      if (o.userData?.isFurniture) return true;
      o = o.parent;
    }
    return false;
  });

  // clic hors meuble => désélection
  if (!hit) {
    if (selected.value) {
      restoreColor(selected.value);
      selected.value = null;
    }
    dragging = false;
    controls.enabled = true;
    renderer.domElement.style.cursor = "pointer";
    return;
  }

  // remonte au groupe "meuble"
  let root: any = hit.object;
  while (root.parent && !root.userData?.isFurniture) root = root.parent;

  if (selected.value && selected.value !== root) restoreColor(selected.value);
  selected.value = root;
  colorize(root, 0x3b82f6);

  // drag dans le plan z du meuble
  dragPlane.set(new Vector3(0, 0, 1), -selected.value.position.z);
  if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
    dragOffset.copy(dragPoint).sub(selected.value.position);
    dragging = true;
    controls.enabled = false;
    renderer.domElement.style.cursor = "grabbing";
  }
}

function ndc(e: PointerEvent, pointer: Vector2) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

function onPointerMove(e: PointerEvent, pointer: Vector2) {
  if (!dragging || !selected.value) return;
  ndc(e, pointer);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
    if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
      // position visée par le drag, z inchangé
      _target.set(
        dragPoint.x - dragOffset.x,
        dragPoint.y - dragOffset.y,
        selected.value.position.z
      );

      _delta.copy(_target).sub(selected.value.position);
      _box.setFromObject(selected.value);
      _newBox.copy(_box).translate(_delta);

      if (_newBox.min.x < -HALF_W) _delta.x += -HALF_W - _newBox.min.x;
      if (_newBox.max.x > HALF_W) _delta.x += HALF_W - _newBox.max.x;
      if (_newBox.min.y < -HALF_H) _delta.y += -HALF_H - _newBox.min.y;
      if (_newBox.max.y > HALF_H) _delta.y += HALF_H - _newBox.max.y;

      // delta corrigé
      selected.value.position.add(_delta);
    }
  }
}

function onPointerUp() {
  if (!dragging) return;
  dragging = false;
  controls.enabled = true;
  renderer.domElement.style.cursor = "pointer";
}

function removeObject(obj: any) {
  if (!obj) return;

  // nettoyage récursif
  obj.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const m = child.material;
        if (Array.isArray(m)) {
          m.forEach((mm) => mm.dispose && mm.dispose());
        } else {
          m.dispose && m.dispose();
        }
      }
    }
  });

  // retirer du parent
  if (obj.parent) {
    obj.parent.remove(obj);
  }

  selected.value = null;
}

function init() {
  if (!container.value) return;

  renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;

  container.value.appendChild(renderer.domElement);

  renderer.domElement.addEventListener("pointerdown", (e) =>
    onPointerDown(e, pointer)
  );

  renderer.domElement.addEventListener("pointermove", (e) =>
    onPointerMove(e, pointer)
  );
  renderer.domElement.addEventListener("pointerup", (e) =>
    onPointerUp(e, pointer)
  );
  renderer.domElement.addEventListener("pointerleave", (e) =>
    onPointerUp(e, pointer)
  );
  renderer.domElement.style.cursor = "pointer";

  scene = new Scene();

  // Camera
  const { clientWidth: w, clientHeight: h } = container.value;
  camera = new PerspectiveCamera(60, w / h, 0.1, 200);
  camera.lookAt(0, 0, 0);

  fitPlaneToView(80, 80);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.minDistance = 50;
  controls.maxDistance = 180;
  // controls.enableRotate = false;
  // controls.enablePan = false;

  // controls.minAzimuthAngle = 0;
  // controls.maxAzimuthAngle = 0;
  // controls.minPolarAngle = Math.PI / 2;
  // controls.maxPolarAngle = Math.PI / 2;
  controls.target.set(0, 0, 0);
  fitPlaneToView(60, 60);
  controls.update();

  // Lights
  const hemi = new HemisphereLight(0xfffdfa, 0x222233, 0.4);

  scene.add(hemi);

  // Ground
  const groundGeo = new PlaneGeometry(60, 60);

  const groundMat = new MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.6,
    emissive: 0xffffff,
    emissiveIntensity: 0.1,
  });
  const ground = new Mesh(groundGeo, groundMat);
  ground.geometry.center();
  ground.receiveShadow = true;
  ground.castShadow = false;
  scene.add(ground);

  const grid = new GridHelper(60, 10, 0x000000, 0xd4d5cd);
  grid.rotation.x = Math.PI / 2;

  scene.add(grid);

  addGridOutline(60);

  fitPlaneToView(60, 60);

  raycaster = new Raycaster();
  pointer = new Vector2();

  dragPlane = new Plane(); // plan parallèle à l'écran
  dragPoint = new Vector3(); // point d'intersection courant
  dragOffset = new Vector3(); // delta pointeur -> pivot objet

  resize();

  // Resize handling
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container.value);

  // Loop
  animate();
}

function resize() {
  if (!container.value) return;
  let w = container.value.clientWidth;
  let h = container.value.clientHeight;
  if (w === 0 || h === 0) {
    // fallback si le parent n’a pas encore de taille
    w = window.innerWidth;
    h = window.innerHeight;
  }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  renderer.setSize(w, h);

  fitPlaneToView(60, 60);
}

function animate() {
  controls.update();
  renderer.render(scene, camera);
  if (loading.value) loading.value = false;
  animationId = requestAnimationFrame(animate);
}

onMounted(init);

onUnmounted(() => {
  cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  controls?.dispose();
  renderer?.dispose();
  // clean DOM
  if (container.value && renderer?.domElement?.parentNode === container.value) {
    container.value.removeChild(renderer.domElement);
  }
  // clean scene
  scene?.traverse((obj) => {
    // @ts-expect-error minimal safe cleanup
    if (obj.geometry) obj.geometry.dispose?.();
    // @ts-expect-error minimal safe cleanup
    if (obj.material) {
      const m = obj.material;
      (Array.isArray(m) ? m : [m]).forEach((mm) => mm.dispose?.());
    }
  });

  renderer?.domElement?.removeEventListener("pointerdown", (e) =>
    onPointerDown(e, pointer)
  );
  renderer?.domElement?.removeEventListener("pointermove", (e) =>
    onPointerMove(e, pointer)
  );
  renderer?.domElement?.removeEventListener("pointerup", (e) =>
    onPointerUp(e, pointer)
  );
  renderer?.domElement?.removeEventListener("pointerleave", (e) =>
    onPointerUp(e, pointer)
  );
});
</script>

<template>
  <div class="three-wrapper">
    <div ref="container" class="three-container"></div>
    <div v-if="loading" class="loading">Chargement…</div>
    <template v-else>
      <button
        v-if="isObject(selected)"
        class="remove-button"
        @click="removeObject(selected)"
      >
        <IconComponent icon="trash_fill" />
      </button>

      <FurnitureOptions
        :furnitureCatalog="furnitureCatalog"
        @createFurniture="createFurniture"
      />
    </template>
  </div>
</template>

<style lang="postcss" scoped>
.three-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
}

.three-container {
  width: 100%;
  height: 100%;
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 16, 18, 0.85);
  color: #fff;
  font-weight: 600;
  z-index: 1;
}

.remove-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #ef4444;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  z-index: 1;
  transition: background-color 0.2s linear;

  &:hover {
    background: #dc2626;
  }
}
</style>
