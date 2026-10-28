import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Html,
  OrbitControls,
  TransformControls,
  useGLTF,
} from "@react-three/drei";
import { Box3, Vector3 } from "three";
import CameraFocus from "./CameraFocus.jsx";
import CameraPoseReporter from "./CameraPoseReporter.jsx";
import {
  SceneLoadErrorBoundary,
  SceneLoadingIndicator,
} from "./SceneLoading.jsx";
import { getSceneItem } from "./sceneItems.js";

const BOUNDS_MARGIN = 0.5;
const HORIZONTAL_ROTATION_LIMIT = Math.PI / 10;
const ZOOMED_HORIZONTAL_ROTATION_LIMIT = Math.PI / 3;
const VERTICAL_ROTATION_LIMIT = Math.PI / 18;
const sceneUrl = new URL("../../assets/every_gig_ever....glb", import.meta.url)
  .href;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function getResponsiveModelScale(width, height, editMode) {
  if (editMode) return 1;
  if (width <= 380 || height <= 480) return 0.76;
  if (width <= 700 || height <= 620) return 0.82;
  if (width <= 1024 || height <= 700) return 0.92;
  return 1;
}

function scaleCameraFocus(item, scale) {
  if (!item.cameraFocus || scale === 1) return item.cameraFocus;
  const scalePosition = (position) =>
    Array.isArray(position) ? position.map((value) => value * scale) : position;

  return {
    ...item.cameraFocus,
    position: scalePosition(item.cameraFocus.position),
    target: scalePosition(item.cameraFocus.target),
  };
}

function ZoomResponsiveRotationLimit({ controlsRef }) {
  const { camera } = useThree();

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const range = controls.maxDistance - controls.minDistance;
    const zoomProgress =
      range > 0
        ? clamp01(
            (controls.maxDistance -
              camera.position.distanceTo(controls.target)) /
              range,
          )
        : 0;
    const transition = Math.min(zoomProgress / 0.5, 1);
    const limit =
      HORIZONTAL_ROTATION_LIMIT +
      (ZOOMED_HORIZONTAL_ROTATION_LIMIT - HORIZONTAL_ROTATION_LIMIT) *
        transition;

    if (Math.abs(controls.maxAzimuthAngle - limit) > 0.0001) {
      controls.minAzimuthAngle = -limit;
      controls.maxAzimuthAngle = limit;
    }
  });

  return null;
}

function ClickHereMarker({ hotspot, onClick }) {
  return (
    <Html position={hotspot.markerPosition} center>
      <button
        className="click-here-marker"
        type="button"
        aria-label={`Click to view ${hotspot.item.title}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onClick(hotspot);
        }}
      >
        <span className="click-here-marker__dot" />
        <span>CLICK HERE</span>
      </button>
    </Html>
  );
}

function StageSpotlight({ position, floorY }) {
  const lightRef = useRef(null);
  const targetRef = useRef(null);

  useLayoutEffect(() => {
    if (!lightRef.current || !targetRef.current) return;
    lightRef.current.target = targetRef.current;
    lightRef.current.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <spotLight
        ref={lightRef}
        position={position}
        color="#ffe4c7"
        intensity={18}
        angle={Math.PI / 7}
        penumbra={0.55}
        distance={position[1] - floorY + 2}
        decay={2}
      />
      <object3D ref={targetRef} position={[position[0], floorY, position[2]]} />
    </>
  );
}

function GigScene({
  editMode,
  mode,
  onTransformChange,
  onMaxDistanceChange,
  onItemSelect,
}) {
  const { scene } = useGLTF(sceneUrl);
  const { camera, size } = useThree();
  const modelGroupRef = useRef(null);
  const modelScale = getResponsiveModelScale(size.width, size.height, editMode);
  const { model, shadowExtent, spotPositions, hotspots, floorY, maxDimension } =
    useMemo(() => {
      const clone = scene.clone(true);
      clone.updateMatrixWorld(true);
      const modelBounds = new Box3().setFromObject(clone);
      const modelCenter = modelBounds.getCenter(new Vector3());
      const spots = [];
      const clickableHotspots = [];
      let stageFloorY = 0;
      clone.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
          const bounds = new Box3().setFromObject(object);
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          const item = getSceneItem(object);
          if (item) {
            const meshCenter = bounds.getCenter(new Vector3());
            const dimensions = bounds.getSize(new Vector3());
            const anchor = item.hotspotPosition
              ? new Vector3(...item.hotspotPosition)
              : meshCenter;
            clickableHotspots.push({
              item,
              object,
              position: [
                anchor.z - modelCenter.z,
                anchor.y - modelCenter.y,
                -anchor.x + modelCenter.x,
              ],
              markerPosition: anchor
                .clone()
                .add(new Vector3(0, Math.max(dimensions.y * 0.55, 0.28), 0))
                .toArray(),
              focusDistance: Math.max(
                2.5,
                Math.min(
                  Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.8,
                  7,
                ),
              ),
            });
          }
          if (
            materials.some((material) =>
              /^Light(?:\.\d+)?$/.test(material?.name),
            )
          ) {
            spots.push(bounds.getCenter(new Vector3()).toArray());
          }
          if (materials.some((material) => material?.name === "StageFloor")) {
            stageFloorY = bounds.getCenter(new Vector3()).y;
          }
        }
      });
      const size = new Box3().setFromObject(clone).getSize(new Vector3());
      return {
        model: clone,
        shadowExtent: Math.max(size.x, size.y, size.z) * 0.55 + 0.5,
        spotPositions: spots,
        hotspots: clickableHotspots,
        floorY: stageFloorY,
        maxDimension: Math.max(size.x, size.y, size.z),
      };
    }, [scene]);

  useEffect(() => {
    const fitHeightDistance =
      maxDimension / (2 * Math.atan((Math.PI * camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / camera.aspect;
    onMaxDistanceChange(
      BOUNDS_MARGIN * Math.max(fitHeightDistance, fitWidthDistance),
    );
  }, [camera, onMaxDistanceChange, size.height, size.width, maxDimension]);

  const selectHotspot = (hotspot) => {
    onItemSelect({
      ...hotspot.item,
      cameraFocus: scaleCameraFocus(hotspot.item, modelScale),
      position: hotspot.position.map((value) => value * modelScale),
      focusDistance: hotspot.focusDistance,
    });
  };

  return (
    <>
      <Bounds fit clip observe margin={BOUNDS_MARGIN}>
        <>
          <directionalLight
            position={[shadowExtent * 0.8, shadowExtent * 1.4, shadowExtent]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-shadowExtent}
            shadow-camera-right={shadowExtent}
            shadow-camera-top={shadowExtent}
            shadow-camera-bottom={-shadowExtent}
            shadow-camera-near={0.1}
            shadow-camera-far={shadowExtent * 4}
            shadow-bias={-0.0001}
            shadow-normalBias={0.02}
          />
          <Center>
            <group
              ref={modelGroupRef}
              rotation={[0, Math.PI / 2, 0]}
              scale={modelScale}
            >
              {hotspots.map((hotspot) => (
                <ClickHereMarker
                  key={hotspot.object.uuid}
                  hotspot={hotspot}
                  onClick={selectHotspot}
                />
              ))}
              <primitive
                object={model}
                dispose={null}
                onClick={(event) => {
                  const item = getSceneItem(event.object);
                  if (!item) return;
                  event.stopPropagation();
                  const bounds = new Box3().setFromObject(event.object);
                  const dimensions = bounds.getSize(new Vector3());
                  const point = event.point.toArray();
                  const focusDistance = Math.max(
                    2.5,
                    Math.min(
                      Math.max(dimensions.x, dimensions.y, dimensions.z) * 1.8,
                      7,
                    ),
                  );
                  onItemSelect({
                    ...item,
                    cameraFocus: scaleCameraFocus(item, modelScale),
                    position: point,
                    focusDistance,
                  });
                }}
                onPointerOver={(event) => {
                  if (getSceneItem(event.object)) {
                    document.body.style.cursor = "pointer";
                  }
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "";
                }}
              />
              {spotPositions.map((position, index) => (
                <StageSpotlight
                  key={index}
                  position={position}
                  floorY={floorY}
                />
              ))}
            </group>
          </Center>
        </>
      </Bounds>
      {editMode && (
        <TransformControls
          object={modelGroupRef}
          mode={mode}
          space="world"
          size={0.85}
          onObjectChange={() => {
            const object = modelGroupRef.current;
            if (!object) return;
            onTransformChange({
              position: object.position.toArray(),
              rotation: object.rotation.toArray().slice(0, 3),
              scale: object.scale.toArray(),
            });
          }}
        />
      )}
    </>
  );
}

export default function PortfolioScene({
  editMode,
  mode,
  onTransformChange,
  activeItem,
  focusRequest,
  onItemSelect,
  onCameraPose,
  focusSettings,
}) {
  const [maxDistance, setMaxDistance] = useState(36);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const controlsRef = useRef(null);
  const retryModelLoad = useCallback(() => {
    useGLTF.clear(sceneUrl);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 2, 20], fov: 40, near: 0.1, far: 1000 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      shadows="soft"
    >
      <color attach="background" args={["#111313"]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#d9e4ec", "#38342f", 0.55]} />
      <directionalLight position={[-8, 5, -8]} intensity={0.25} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableRotate
        enableZoom
        enableDamping
        enablePan={false}
        dampingFactor={0.08}
        minDistance={2}
        maxDistance={maxDistance}
        minPolarAngle={Math.PI / 2 - VERTICAL_ROTATION_LIMIT}
        maxPolarAngle={Math.PI / 2 + VERTICAL_ROTATION_LIMIT}
        minAzimuthAngle={-HORIZONTAL_ROTATION_LIMIT}
        maxAzimuthAngle={HORIZONTAL_ROTATION_LIMIT}
      />
      <ZoomResponsiveRotationLimit controlsRef={controlsRef} />
      <CameraFocus
        request={focusRequest}
        settings={focusSettings}
        controlsRef={controlsRef}
      />
      <CameraPoseReporter
        enabled={editMode}
        selectedItem={activeItem}
        onChange={onCameraPose}
      />
      <SceneLoadingIndicator />
      <SceneLoadErrorBoundary key={loadAttempt} onRetry={retryModelLoad}>
        <Suspense fallback={null}>
          <GigScene
            editMode={editMode}
            mode={mode}
            onTransformChange={onTransformChange}
            onMaxDistanceChange={setMaxDistance}
            onItemSelect={onItemSelect}
          />
        </Suspense>
      </SceneLoadErrorBoundary>
    </Canvas>
  );
}

useGLTF.preload(sceneUrl);
