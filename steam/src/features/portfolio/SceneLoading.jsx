import { Component } from "react";
import { Html, useProgress } from "@react-three/drei";

export function SceneLoadingIndicator() {
  const { active, progress, total } = useProgress();
  if (!active) return null;

  const hasProgress = total > 0 && Number.isFinite(progress);
  const percentage = hasProgress
    ? Math.min(100, Math.max(0, Math.round(progress)))
    : null;

  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div className="scene-load-overlay" role="status" aria-live="polite">
        <div className="scene-load-content">
          <span className="scene-load-indicator" aria-hidden="true" />
          <p className="scene-load-label">LOADING 3D SCENE</p>
          <p className="scene-load-message">Menyiapkan panggung dan model 3D…</p>
          <div
            className="scene-load-progress"
            role="progressbar"
            aria-label="Model loading progress"
            aria-valuemin={0}
            aria-valuemax={100}
            {...(percentage === null ? {} : { "aria-valuenow": percentage })}
          >
            <span
              className={percentage === null ? "is-indeterminate" : undefined}
              style={percentage === null ? undefined : { width: `${percentage}%` }}
            />
          </div>
          <span className="scene-load-percent">
            {percentage === null ? "DOWNLOAD IN PROGRESS" : `${percentage}%`}
          </span>
        </div>
      </div>
    </Html>
  );
}

function SceneLoadError({ onRetry }) {
  return (
    <Html fullscreen zIndexRange={[100, 0]}>
      <div className="scene-load-overlay" role="alert">
        <div className="scene-load-content">
          <p className="scene-load-label">SCENE COULD NOT LOAD</p>
          <p className="scene-load-message">
            Model 3D gagal dimuat. Periksa koneksi lalu coba lagi.
          </p>
          <button className="scene-load-retry" type="button" onClick={onRetry}>
            COBA LAGI
          </button>
        </div>
      </div>
    </Html>
  );
}

export class SceneLoadErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <SceneLoadError onRetry={this.props.onRetry} />;
    }

    return this.props.children;
  }
}
