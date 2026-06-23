import { useState, useEffect, useRef, useCallback } from 'react';
import MeasureList from './components/MeasureList';
import MeasureEditor from './components/MeasureEditor';
import PlaybackPanel from './components/PlaybackPanel';
import SongManager from './components/SongManager';
import { useMetronome } from './hooks/useMetronome';
import { exportWAV, exportTXT, importTxt } from './utils/exportImport';
import './App.css';

function App() {
  const [measures, setMeasures] = useState([]);
  const [globalBpm, setGlobalBpm] = useState(120);
  const [usePerMeasureBpm, setUsePerMeasureBpm] = useState(true);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedMeasureId, setSelectedMeasureId] = useState(null);
  const [songName, setSongName] = useState('Mi Canción');
  const [saveIndicator, setSaveIndicator] = useState('');
  const [currentSongId, setCurrentSongId] = useState(null);

  const measureIdCounter = useRef(0);

  const handleAddMeasure = () => {
    setMeasures((prev) => {
      const last = prev.length > 0 ? prev[prev.length - 1] : null;
      const newMeasure = {
        id: ++measureIdCounter.current,
        bpm: last ? last.bpm : globalBpm,
        beats: last ? last.beats : 4,
        subdivision: last ? last.subdivision : 4,
      };
      return [...prev, newMeasure];
    });
    markUnsaved();
  };

  const handleRemoveMeasure = (id) => {
    setMeasures((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (selectedMeasureId === id) setSelectedMeasureId(null);
      return next;
    });
    markUnsaved();
  };

  const handleDuplicateMeasure = (id) => {
    setMeasures((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const original = prev[idx];
      const copy = { ...original, id: ++measureIdCounter.current };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    markUnsaved();
  };

  const handleMoveMeasure = (id, direction) => {
    setMeasures((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
    markUnsaved();
  };

  const handleUpdateMeasure = (id, field, value) => {
    setMeasures((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m };
        if (field === 'bpm') updated.bpm = Math.max(40, Math.min(240, parseInt(value) || 120));
        else if (field === 'beats') updated.beats = Math.max(1, Math.min(16, parseInt(value) || 4));
        else if (field === 'subdivision') updated.subdivision = [2, 4, 8, 16].includes(parseInt(value)) ? parseInt(value) : 4;
        return updated;
      })
    );
    markUnsaved();
  };

  const handleSelectedMeasureChange = (field, value) => {
    if (selectedMeasureId) {
      handleUpdateMeasure(selectedMeasureId, field, value);
    }
  };

  const handleApplyPresetToSelected = (beats, subdivision) => {
    if (selectedMeasureId) {
      handleUpdateMeasure(selectedMeasureId, 'beats', beats);
      handleUpdateMeasure(selectedMeasureId, 'subdivision', subdivision);
    }
  };

  const {
    currentMeasureIndex,
    currentBeatInMeasure,
    getCurrentBpm,
    getCurrentTimeSignature,
    stop,
    skipTo,
  } = useMetronome(measures, globalBpm, usePerMeasureBpm, loopEnabled, isPlaying);

  const markUnsaved = () => setSaveIndicator('⚪ Sin guardar');

  const handleSaveSong = () => {
    const id = `song_${(songName || 'sin-nombre').replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_')}`;
    const data = {
      id,
      name: songName,
      measures,
      globalBpm,
      usePerMeasureBpm,
      loopEnabled,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(id, JSON.stringify(data));
    setCurrentSongId(id);
    setSaveIndicator(`✅ Guardado: ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setSaveIndicator(''), 3000);
  };

  const handleLoadSong = (id) => {
    const data = localStorage.getItem(id);
    if (!data) return;
    const song = JSON.parse(data);
    setSongName(song.name);
    setMeasures(song.measures || []);
    measureIdCounter.current = (song.measures || []).reduce((max, m) => Math.max(max, m.id), 0);
    setGlobalBpm(song.globalBpm || 120);
    setUsePerMeasureBpm(song.usePerMeasureBpm ?? true);
    setLoopEnabled(song.loopEnabled ?? true);
    setCurrentSongId(id);
    setSelectedMeasureId(null);
  };

  const handleNewSong = () => {
    if (!confirm('¿Crear nueva canción?')) return;
    setMeasures([]);
    measureIdCounter.current = 0;
    setSongName('Nueva Canción');
    setGlobalBpm(120);
    setUsePerMeasureBpm(true);
    setLoopEnabled(true);
    setSelectedMeasureId(null);
    setCurrentSongId(null);
    stop();
    setIsPlaying(false);
  };

  const handleExportWAV = () => {
    if (measures.length === 0) return alert('No hay compases para exportar');
    exportWAV(measures, usePerMeasureBpm, globalBpm, songName);
  };

  const handleExportTXT = () => {
    if (measures.length === 0) return alert('No hay compases para exportar');
    exportTXT(measures, usePerMeasureBpm, globalBpm, songName, loopEnabled);
  };

  const handleImportTXT = () => {
    importTxt((song) => {
      setSongName(song.name);
      setMeasures(song.measures);
      measureIdCounter.current = (song.measures || []).reduce((max, m) => Math.max(max, m.id), 0);
      setGlobalBpm(song.globalBpm || 120);
      setUsePerMeasureBpm(song.usePerMeasureBpm ?? true);
      setLoopEnabled(song.loopEnabled ?? true);
      setSelectedMeasureId(null);
      stop();
      setIsPlaying(false);
    });
  };

  const selectedMeasure = measures.find((m) => m.id === selectedMeasureId);

  return (
    <div className="container">
      <h1>🎵 Metronomo Pro</h1>
      <p className="subtitle">Compositor de canciones con compases variables</p>

      <div className="main-grid">
        <div className="panel">
          <div className="panel-title">📝 Editor de Compases</div>
          <div className="input-group">
            <input
              type="text"
              value={songName}
              onChange={(e) => { setSongName(e.target.value); markUnsaved(); }}
              placeholder="Nombre de la canción..."
            />
            <button className="btn btn-primary" onClick={handleSaveSong} title="Guardar canción">💾</button>
          </div>
          <MeasureList
            measures={measures}
            currentMeasureIndex={currentMeasureIndex}
            isPlaying={isPlaying}
            selectedMeasureId={selectedMeasureId}
            onAdd={handleAddMeasure}
            onRemove={handleRemoveMeasure}
            onDuplicate={handleDuplicateMeasure}
            onMove={handleMoveMeasure}
            onSelect={setSelectedMeasureId}
          />
          {saveIndicator && <div className="save-indicator">{saveIndicator}</div>}
        </div>

        <div className="panel playback-panel">
          <div className="panel-title">▶️ Reproducción</div>
          <PlaybackPanel
            currentMeasureIndex={currentMeasureIndex}
            measures={measures}
            currentBeatInMeasure={currentBeatInMeasure}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onStop={() => { stop(); setIsPlaying(false); }}
            onSkipTo={skipTo}
            getCurrentBpm={getCurrentBpm}
            getCurrentTimeSignature={getCurrentTimeSignature}
            globalBpm={globalBpm}
            onGlobalBpmChange={setGlobalBpm}
            usePerMeasureBpm={usePerMeasureBpm}
            onUsePerMeasureBpmChange={setUsePerMeasureBpm}
            loopEnabled={loopEnabled}
            onLoopChange={setLoopEnabled}
            onExportWAV={handleExportWAV}
            onExportTXT={handleExportTXT}
            onImportTXT={handleImportTXT}
          />
          <SongManager
            currentSongId={currentSongId}
            onLoad={handleLoadSong}
            onNew={handleNewSong}
          />
        </div>
      </div>

      {selectedMeasure && (
        <MeasureEditor
          measure={selectedMeasure}
          measureNumber={measures.indexOf(selectedMeasure) + 1}
          onChange={handleSelectedMeasureChange}
          onApplyPreset={handleApplyPresetToSelected}
          onClose={() => setSelectedMeasureId(null)}
        />
      )}
    </div>
  );
}

export default App;
