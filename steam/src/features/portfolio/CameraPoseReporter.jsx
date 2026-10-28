import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

function roundVector(vector) {
  return vector.toArray().map((value) => Number(value.toFixed(3)));
}

export default function CameraPoseReporter({
  enabled,
  selectedItem,
  onChange,
}) {
  const { camera, controls } = useThree();
  const elapsed = useRef(0);
  const previous = useRef("");

  useFrame((_, delta) => {
    if (!enabled || !selectedItem || !controls) {
      previous.current = "";
      elapsed.current = 0;
      return;
    }

    elapsed.current += delta;
    if (elapsed.current < 0.1) return;
    elapsed.current = 0;

    const pose = {
      position: roundVector(camera.position),
      target: roundVector(controls.target),
      distance: Number(camera.position.distanceTo(controls.target).toFixed(3)),
      fov: camera.fov,
    };
    const signature = JSON.stringify(pose);
    if (signature !== previous.current) {
      previous.current = signature;
      onChange(pose);
    }
  });

  return null;
}
