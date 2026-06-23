export default function PlaybackPanel({
  currentMeasureIndex,
  measures,
  currentBeatInMeasure,
  isPlaying,
  onTogglePlay,
  onStop,
  onSkipTo,
  getCurrentBpm,
  getCurrentTimeSignature,
  globalBpm,
  onGlobalBpmChange,
  usePerMeasureBpm,
  onUsePerMeasureBpmChange,
  loopEnabled,
  onLoopChange,
  onExportWAV,
  onExportTXT,
  onImportTXT,
}) {
  const ts = getCurrentTimeSignature();
  const currentBpm = getCurrentBpm();

  return (
    <>
      <div className="current-measure-display">
        <div className="current-measure-number">
          {measures.length > 0 ? currentMeasureIndex + 1 : '-'}
        </div>
        <div className="current-beat">
          {measures.length > 0 ? `Compás ${currentMeasureIndex + 1} — Tiempo ${currentBeatInMeasure + 1}` : '-'}
        </div>
        <div className="beat-indicator">
          {Array.from({ length: ts.beats }).map((_, i) => (
            <div
              key={i}
              className={`beat-dot ${i === 0 ? 'downbeat' : ''} ${i === currentBeatInMeasure ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>

      <div className="tempo-display">{currentBpm}</div>
      <div className="tempo-label">BPM actual</div>

      <div className="control-buttons">
        <button className="btn-play" onClick={onTogglePlay} disabled={measures.length === 0}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="btn btn-secondary btn-icon" onClick={onStop}>⏹</button>
        <button className="btn btn-secondary" onClick={() => onSkipTo(0)}>⏮</button>
        <button className="btn btn-secondary" onClick={() => onSkipTo(-1)}>◀</button>
        <button className="btn btn-secondary" onClick={() => onSkipTo(1)}>▶</button>
        <button className="btn btn-secondary" onClick={() => onSkipTo(999)}>⏭</button>
      </div>

      <div className="global-controls">
        <button className="btn btn-secondary btn-sm" onClick={() => onGlobalBpmChange(Math.max(40, globalBpm - 5))}>
          −5 BPM
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onGlobalBpmChange(Math.max(40, globalBpm - 1))}>
          −1
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onGlobalBpmChange(Math.min(240, globalBpm + 1))}>
          +1
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => onGlobalBpmChange(Math.min(240, globalBpm + 5))}>
          +5 BPM
        </button>
        <button
          className="btn btn-secondary btn-sm tap-tempo"
          onClick={() => {
            const now = performance.now();
            if (!window._tapTimes) window._tapTimes = [];
            window._tapTimes.push(now);
            if (window._tapTimes.length > 5) window._tapTimes.shift();
            if (window._tapTimes.length >= 2) {
              let totalDiff = 0;
              for (let i = 1; i < window._tapTimes.length; i++) {
                totalDiff += window._tapTimes[i] - window._tapTimes[i - 1];
              }
              const avgDiff = totalDiff / (window._tapTimes.length - 1);
              const bpm = Math.round(60000 / avgDiff);
              onGlobalBpmChange(Math.max(40, Math.min(240, bpm)));
            }
          }}
        >
          👆 Tap Tempo
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: '0.85em', color: '#aaa' }}>BPM global (override por compás):</label>
        <div className="slider-container" style={{ marginTop: 6 }}>
          <span style={{ fontSize: '0.8em', color: '#888' }}>40</span>
          <input
            type="range"
            min="40"
            max="240"
            value={globalBpm}
            onChange={(e) => onGlobalBpmChange(parseInt(e.target.value))}
          />
          <span style={{ fontSize: '0.8em', color: '#888' }}>240</span>
          <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{globalBpm}</span>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: '0.85em', color: '#aaa' }}>
          <input type="checkbox" checked={usePerMeasureBpm} onChange={(e) => onUsePerMeasureBpmChange(e.target.checked)} />
          Usar BPM específico por compás
        </label>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={{ fontSize: '0.85em', color: '#aaa' }}>
          <input type="checkbox" checked={loopEnabled} onChange={(e) => onLoopChange(e.target.checked)} />
          Loop (repetir canción)
        </label>
      </div>

      <div className="export-buttons">
        <button className="btn btn-export-wav btn-sm" onClick={onExportWAV} style={{ flex: 1 }}>
          🎧 Exportar .WAV
        </button>
        <button className="btn btn-export-txt btn-sm" onClick={onExportTXT} style={{ flex: 1 }}>
          📄 Exportar .TXT
        </button>
      </div>
      <div className="export-buttons" style={{ marginTop: 8 }}>
        <button className="btn btn-import-txt btn-sm" onClick={onImportTXT} style={{ flex: 1 }}>
          📥 Importar .TXT
        </button>
      </div>
    </>
  );
}
