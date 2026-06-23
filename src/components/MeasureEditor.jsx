export default function MeasureEditor({ measure, measureNumber, onChange, onApplyPreset, onClose }) {
  if (!measure) return null;

  return (
    <div className="measure-editor">
      <div className="panel-title" style={{ color: '#ffb800' }}>
        ✏️ Editar Compás <span style={{ fontSize: '0.8em', color: '#aaa' }}>(Compás {measureNumber})</span>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.85em', color: '#aaa' }}>BPM</label>
        <div className="slider-container" style={{ marginTop: 4 }}>
          <span style={{ fontSize: '0.8em', color: '#888' }}>40</span>
          <input
            type="range"
            min="40"
            max="240"
            value={measure.bpm}
            onChange={(e) => onChange('bpm', e.target.value)}
          />
          <span style={{ fontSize: '0.8em', color: '#888' }}>240</span>
          <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{measure.bpm}</span>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: '0.85em', color: '#aaa' }}>Tiempo (Beats / Subdivisión)</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <select
            value={measure.beats}
            onChange={(e) => onChange('beats', e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
          </select>
          <span style={{ alignSelf: 'center', color: '#aaa' }}>/</span>
          <select
            value={measure.subdivision}
            onChange={(e) => onChange('subdivision', e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="8">8</option>
            <option value="16">16</option>
          </select>
        </div>
        <div className="time-sig-presets" style={{ marginTop: 6 }}>
          <button className="preset-btn" onClick={() => onApplyPreset(2, 4)}>2/4</button>
          <button className="preset-btn" onClick={() => onApplyPreset(3, 4)}>3/4</button>
          <button className="preset-btn" onClick={() => onApplyPreset(4, 4)}>4/4</button>
          <button className="preset-btn" onClick={() => onApplyPreset(6, 8)}>6/8</button>
          <button className="preset-btn" onClick={() => onApplyPreset(3, 8)}>3/8</button>
          <button className="preset-btn" onClick={() => onApplyPreset(5, 4)}>5/4</button>
          <button className="preset-btn" onClick={() => onApplyPreset(7, 8)}>7/8</button>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={onClose}>
        Cerrar Editor
      </button>
    </div>
  );
}
