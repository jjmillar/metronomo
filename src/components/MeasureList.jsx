export default function MeasureList({
  measures,
  currentMeasureIndex,
  isPlaying,
  selectedMeasureId,
  onAdd,
  onRemove,
  onDuplicate,
  onMove,
  onSelect,
}) {
  if (measures.length === 0) {
    return (
      <div className="measure-list">
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          No hay compases.<br />Haz clic en "Agregar Compás" para empezar.
        </div>
      </div>
    );
  }

  return (
    <div className="measure-list">
      {measures.map((m, i) => {
        const ts = `${m.beats}/${m.subdivision}`;
        const isActive = i === currentMeasureIndex && isPlaying;
        const isSelected = m.id === selectedMeasureId;
        return (
          <div
            key={m.id}
            className={`measure-card ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
          >
            <div className="measure-number">{i + 1}</div>
            <div className="measure-info">
              <div className="measure-bpm">{m.bpm} BPM</div>
              <div className="measure-time">Tiempo: {ts}</div>
              <div className="time-sig-presets">
                <button className="preset-btn" onClick={() => { onMove(m.id, -1); }}>
                  Arriba
                </button>
                <button className="preset-btn" onClick={() => { onMove(m.id, 1); }}>
                  Abajo
                </button>
                <button className="preset-btn" onClick={() => onSelect(m.id)}>
                  ✏️
                </button>
              </div>
            </div>
            <div className="measure-controls">
              <button className="btn btn-secondary btn-sm" onClick={() => onDuplicate(m.id)} title="Duplicar">
                📋
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onRemove(m.id)} title="Eliminar">
                ✕
              </button>
            </div>
          </div>
        );
      })}
      <button className="btn btn-primary add-measure-btn" onClick={onAdd}>
        ＋ Agregar Compás
      </button>
    </div>
  );
}
