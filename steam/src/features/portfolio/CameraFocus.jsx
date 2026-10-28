import { useEffect, useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { Vector3 } from "three";

const EDITOR_EASING = {
  easeInOut: "power3.inOut",
  easeIn: "power3.in",
  easeOut: "power3.out",
  linear: "none",
};

function resolveEasing(value) {
  return EDITOR_EASING[value] ?? value ?? "power3.inOut";
}

function applyEasing(progress, easing) {
  const ease = gsap.parseEase(resolveEasing(easing));
  return ease ? ease(progress) : progress;
}

export default function CameraFocus({ request, settings, controlsRef }) {
  const { camera } = useThree();
  const timelineRef = useRef(null);
  const savedPose = useRef(null);
  const controlsState = useRef(null);
  const settingsRef = useRef(settings);
  const activeEasing = useRef("power3.inOut");

  useLayoutEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!request || !controls) return;

    timelineRef.current?.kill();
    timelineRef.current = null;

    const restoreControls = () => {
      if (!controlsState.current) return;
      controls.enabled = controlsState.current.enabled;
      controls.enableDamping = controlsState.current.enableDamping;
      controlsState.current = null;
    };

    const override = settingsRef.current.override;
    const itemConfig = request.cameraFocus ?? {};
    if (request.type !== "reset" && itemConfig.enabled === false) {
      restoreControls();
      return;
    }

    if (request.type === "reset" && !savedPose.current) {
      restoreControls();
      return;
    }

    const fromCamera = camera.position.clone();
    const fromTarget = controls.target.clone();
    const fromFov = camera.fov;
    let toCamera;
    let toTarget;
    let toFov;
    let duration;

    if (request.type === "reset") {
      toCamera = savedPose.current.position.clone();
      toTarget = savedPose.current.target.clone();
      toFov = savedPose.current.fov;
      duration = override ? settingsRef.current.duration : 0.8;
      activeEasing.current = override
        ? resolveEasing(settingsRef.current.easing)
        : "power3.inOut";
    } else {
      if (!savedPose.current) {
        savedPose.current = {
          position: fromCamera.clone(),
          target: fromTarget.clone(),
          fov: fromFov,
        };
      }

      const clickedPoint = new Vector3(...request.point);
      toTarget = Array.isArray(itemConfig.target)
        ? new Vector3(...itemConfig.target)
        : clickedPoint;

      if (Array.isArray(itemConfig.position)) {
        toCamera = new Vector3(...itemConfig.position);
      } else if (Array.isArray(itemConfig.positionOffset)) {
        toCamera = toTarget
          .clone()
          .add(new Vector3(...itemConfig.positionOffset));
      } else {
        const direction = fromCamera.clone().sub(fromTarget).normalize();
        const fallbackDistance = Math.min(
          fromCamera.distanceTo(fromTarget) * 0.45,
          7,
        );
        const distance = Math.max(
          controls.minDistance,
          Math.min(request.distance ?? fallbackDistance, controls.maxDistance),
        );
        toCamera = toTarget.clone().addScaledVector(direction, distance);
      }

      const zoom = override
        ? settingsRef.current.zoom
        : (itemConfig.zoom ?? 1);
      toCamera = toTarget
        .clone()
        .addScaledVector(toCamera.sub(toTarget), zoom);
      toFov = itemConfig.fov ?? fromFov;
      duration = override
        ? settingsRef.current.duration
        : (itemConfig.duration ?? settingsRef.current.duration);
      activeEasing.current = override
        ? resolveEasing(settingsRef.current.easing)
        : resolveEasing(itemConfig.easing);
    }

    if (!controlsState.current) {
      controlsState.current = {
        enabled: controls.enabled,
        enableDamping: controls.enableDamping,
      };
    }
    controls.enabled = false;
    controls.enableDamping = false;
    controls.update();

    const progress = { value: 0 };
    const initialDuration = Math.max(duration, 0.1);
    const renderPose = () => {
      const eased = applyEasing(progress.value, activeEasing.current);
      camera.position.lerpVectors(fromCamera, toCamera, eased);
      controls.target.lerpVectors(fromTarget, toTarget, eased);
      camera.fov = fromFov + (toFov - fromFov) * eased;
      camera.updateProjectionMatrix();
      controls.update();
    };

    timelineRef.current = gsap.timeline({
      onUpdate: renderPose,
      onComplete: () => {
        camera.position.copy(toCamera);
        controls.target.copy(toTarget);
        camera.fov = toFov;
        camera.updateProjectionMatrix();
        controls.update();
        timelineRef.current = null;
        restoreControls();
        if (request.type === "reset") savedPose.current = null;
      },
    });
    timelineRef.current.to(progress, {
      value: 1,
      duration: initialDuration,
      ease: "none",
    });

    return () => {
      timelineRef.current?.kill();
    };
  }, [request, camera, controlsRef, settings.zoom, settings.override]);

  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline || !settings.override) return;

    const currentProgress = timeline.progress();
    const newDuration = Math.max(settings.duration, 0.1);
    timeline.duration(newDuration);
    timeline.progress(currentProgress);
    activeEasing.current = resolveEasing(settings.easing);
  }, [settings.duration, settings.easing, settings.override]);

  useEffect(() => () => {
    timelineRef.current?.kill();
    const controls = controlsRef.current;
    if (controlsState.current && controls) {
      controls.enabled = controlsState.current.enabled;
      controls.enableDamping = controlsState.current.enableDamping;
    }
  }, [controlsRef]);

  return null;
}
