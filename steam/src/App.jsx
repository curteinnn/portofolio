import { useState } from "react";
import PortfolioScene from "./features/portfolio/PortfolioScene.jsx";
import PortfolioInformationOverlay from "./features/portfolio/PortfolioInformationOverlay.jsx";
import "./styles/app.css";
import "./styles/responsive.css";

const EDIT_MODE =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("edit") === "1";

const INITIAL_TRANSFORM = {
  position: [0, 0, 0],
  rotation: [0, Math.PI / 2, 0],
  scale: [1, 1, 1],
};

const INITIAL_FOCUS_SETTINGS = {
  duration: 1.2,
  easing: "easeInOut",
  zoom: 1,
  override: EDIT_MODE,
};

export default function App() {
  const [mode, setMode] = useState("translate");
  const [transform, setTransform] = useState(INITIAL_TRANSFORM);
  const [activeItem, setActiveItem] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [focusSettings, setFocusSettings] = useState(INITIAL_FOCUS_SETTINGS);
  const [cameraPose, setCameraPose] = useState(null);

  const handleItemSelect = (item) => {
    if (activeItem?.id === item.id) {
      handleSidebarClose();
      return;
    }
    setActiveItem(item);
    setFocusRequest({
      type: "focus",
      point: item.position,
      distance: item.focusDistance,
      cameraFocus: item.cameraFocus,
    });
    setCameraPose(null);
  };

  const handleSidebarClose = () => {
    setActiveItem(null);
    setFocusRequest({ type: "reset" });
    setCameraPose(null);
  };

  return (
    <main className="portfolio-page" aria-label="Aldry Dian Reno portfolio scene">
      <PortfolioScene
        editMode={EDIT_MODE}
        mode={mode}
        onTransformChange={setTransform}
        activeItem={activeItem}
        focusRequest={focusRequest}
        onItemSelect={handleItemSelect}
        focusSettings={focusSettings}
        onCameraPose={setCameraPose}
      />
      {!EDIT_MODE && activeItem && (
        <PortfolioInformationOverlay
          item={activeItem}
          onClose={handleSidebarClose}
        />
      )}
      {EDIT_MODE && (
        <aside className="scene-editor" aria-label="Model transform editor">
          <div className="editor-heading">
            <span className="editor-indicator" />
            <div><strong>SCENE EDITOR</strong><small>DEVELOPMENT MODE</small></div>
          </div>
          <span className="editor-label">TRANSFORM MODE</span>
          <div className="transform-mode-buttons">
            {[["translate", "Move"], ["rotate", "Rotate"], ["scale", "Scale"]].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <dl className="transform-readout">
            <div><dt>Position</dt><dd>{formatVector(transform.position)}</dd></div>
            <div><dt>Rotation (rad)</dt><dd>{formatVector(transform.rotation)}</dd></div>
            <div><dt>Scale</dt><dd>{formatVector(transform.scale)}</dd></div>
          </dl>
          <p className="editor-hint">Drag the gizmo, then copy these values into features/portfolio/PortfolioScene.jsx.</p>
          <span className="editor-label">FOCUS ANIMATION</span>
          <label className="animation-control">
            <span>DURATION <b>{focusSettings.duration.toFixed(1)}s</b></span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={focusSettings.duration}
              onChange={(event) => setFocusSettings((current) => ({
                ...current,
                duration: Number(event.target.value),
              }))}
            />
          </label>
          <label className="animation-control">
            <span>FOCUS DISTANCE <b>{focusSettings.zoom.toFixed(2)}×</b></span>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={focusSettings.zoom}
              onChange={(event) => setFocusSettings((current) => ({
                ...current,
                zoom: Number(event.target.value),
              }))}
            />
          </label>
          <label className="animation-control animation-control--select">
            <span>EASING</span>
            <select
              value={focusSettings.easing}
              onChange={(event) => setFocusSettings((current) => ({
                ...current,
                easing: event.target.value,
              }))}
            >
              <option value="easeInOut">Ease In / Out</option>
              <option value="easeOut">Ease Out</option>
              <option value="easeIn">Ease In</option>
              <option value="linear">Linear</option>
            </select>
          </label>
          <p className="editor-hint">Duration and easing update the running animation. Lower focus distance zooms closer.</p>
          {activeItem && cameraPose && (
            <>
              <span className="editor-label">LIVE CAMERA POSE · {activeItem.title}</span>
              <dl className="transform-readout camera-readout">
                <div><dt>Position</dt><dd>{formatVector(cameraPose.position)}</dd></div>
                <div><dt>Target</dt><dd>{formatVector(cameraPose.target)}</dd></div>
                <div><dt>Distance / FOV</dt><dd>{cameraPose.distance} / {cameraPose.fov}°</dd></div>
              </dl>
              <pre className="camera-pose-code">cameraFocus: {`{\n  enabled: true,\n  position: ${formatVector(cameraPose.position)},\n  target: ${formatVector(cameraPose.target)},\n  fov: ${cameraPose.fov},\n  duration: ${focusSettings.duration.toFixed(1)},\n  easing: "${toGsapEase(focusSettings.easing)}"\n}`}</pre>
              <p className="editor-hint">Replace the selected item&apos;s cameraFocus block in sceneItems.js with these values.</p>
              <button className="camera-reset-button" type="button" onClick={handleSidebarClose}>RETURN TO DEFAULT VIEW</button>
            </>
          )}
        </aside>
      )}
    </main>
  );
}

function formatVector(vector) {
  return `[${vector.map((value) => value.toFixed(3)).join(", ")}]`;
}

function toGsapEase(value) {
  return {
    easeInOut: "power3.inOut",
    easeIn: "power3.in",
    easeOut: "power3.out",
    linear: "none",
  }[value] ?? value;
}
