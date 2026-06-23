import { useRef } from 'react';

function addClick(samples, startSample, sampleRate, freq, amplitude, durationSec) {
  const numSamples = Math.floor(durationSec * sampleRate);
  for (let i = 0; i < numSamples && (startSample + i) < samples.length; i++) {
    const t = i / sampleRate;
    const phase = (t * freq) % 1;
    const triangle = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
    const envelope = Math.exp(-t * 40);
    samples[startSample + i] += triangle * envelope * amplitude;
  }
}

function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return buffer;
}

export function exportWAV(measures, usePerMeasureBpm, globalBpm, songName) {
  const sampleRate = 44100;
  let totalDuration = 0;
  const measureDurations = [];

  for (const m of measures) {
    const bpm = usePerMeasureBpm ? m.bpm : globalBpm;
    const quarterNote = 60.0 / bpm;
    const beatDuration = m.subdivision === 8 ? quarterNote / 2 : quarterNote;
    const duration = beatDuration * m.beats;
    measureDurations.push({ duration, bpm, beats: m.beats, subdivision: m.subdivision });
    totalDuration += duration;
  }

  const numSamples = Math.ceil(totalDuration * sampleRate);
  const samples = new Float32Array(numSamples);
  let currentSample = 0;

  for (const m of measureDurations) {
    const beatDurationSec = m.subdivision === 8 ? (60.0 / m.bpm) / 2 : 60.0 / m.bpm;
    const samplesPerBeat = Math.floor(beatDurationSec * sampleRate);
    for (let beat = 0; beat < m.beats; beat++) {
      const beatStart = currentSample + beat * samplesPerBeat;
      const isDownbeat = beat === 0;
      addClick(samples, beatStart, sampleRate, isDownbeat ? 1000 : 800, isDownbeat ? 0.6 : 0.4, 0.08);
      if (m.subdivision === 8 && beat % 2 === 1) {
        addClick(samples, beatStart, sampleRate, 600, 0.2, 0.05);
      }
    }
    currentSample += Math.floor(m.duration * sampleRate);
  }

  const wav = encodeWAV(samples, sampleRate);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metronomo_${Date.now()}.wav`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportTXT(measures, usePerMeasureBpm, globalBpm, songName, loopEnabled) {
  const lines = [];
  lines.push('='.repeat(50));
  lines.push('METRÓNOMO - CANCIÓN EXPORTADA');
  lines.push('='.repeat(50));
  lines.push(`Nombre: ${songName}`);
  lines.push(`Compases totales: ${measures.length}`);
  lines.push(`Modo BPM: ${usePerMeasureBpm ? 'Por compás' : 'Global'}`);
  lines.push(`BPM Global: ${globalBpm}`);
  lines.push(`Loop: ${loopEnabled ? 'Sí' : 'No'}`);
  lines.push(`Exportado: ${new Date().toLocaleString()}`);
  lines.push('');
  lines.push('-' * 50);
  lines.push('COMPASES');
  lines.push('-' * 50);
  for (const m of measures) {
    const bpm = usePerMeasureBpm ? m.bpm : globalBpm;
    lines.push(`Compás ${m.id}: ${m.beats}/${m.subdivision} | ${bpm} BPM`);
  }
  lines.push('');
  lines.push('-' * 50);
  lines.push('DETALLE POR COMPÁS');
  lines.push('-' * 50);
  for (const m of measures) {
    const bpm = usePerMeasureBpm ? m.bpm : globalBpm;
    const quarterNote = 60.0 / bpm;
    const beatDuration = m.subdivision === 8 ? quarterNote / 2 : quarterNote;
    const duration = beatDuration * m.beats;
    lines.push(`Compás ${m.id}:`);
    lines.push(`  Tiempo: ${m.beats}/${m.subdivision}`);
    lines.push(`  BPM: ${bpm}`);
    lines.push(`  Duración: ${duration.toFixed(2)} segundos`);
    lines.push(`  Total pulsos: ${m.beats}`);
    lines.push('');
  }
  const totalDuration = measures.reduce((sum, m) => {
    const bpm = usePerMeasureBpm ? m.bpm : globalBpm;
    const quarterNote = 60.0 / bpm;
    const beatDuration = m.subdivision === 8 ? quarterNote / 2 : quarterNote;
    return sum + beatDuration * m.beats;
  }, 0);
  lines.push('-' * 50);
  lines.push(`DURACIÓN TOTAL: ${totalDuration.toFixed(2)} segundos`);
  lines.push('='.repeat(50));

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metronomo_${Date.now()}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSongJSON(measures, usePerMeasureBpm, globalBpm, songName, loopEnabled) {
  const song = {
    name: songName,
    measures,
    globalBpm,
    usePerMeasureBpm,
    loopEnabled,
  };
  const blob = new Blob([JSON.stringify(song, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `metronomo_${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function importTxt(onLoad) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const song = parseSongTxt(ev.target.result);
        if (!song || !song.measures || song.measures.length === 0) {
          alert('Archivo inválido o sin compases detectados.');
          return;
        }
        onLoad(song);
      } catch (err) {
        alert('Error importando: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

export function parseSongTxt(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  let name = 'Canción Importada';
  let globalBpm = 120;
  let usePerMeasureBpm = true;
  let loopEnabled = true;
  const measures = [];
  let idCounter = 0;

  for (const line of lines) {
    const nameMatch = line.match(/^Nombre:\s*(.+)$/);
    if (nameMatch) name = nameMatch[1].trim();
    const modeMatch = line.match(/^Modo BPM:\s*(.+)$/);
    if (modeMatch) usePerMeasureBpm = modeMatch[1].includes('Por compás');
    const globalBpmMatch = line.match(/^BPM Global:\s*(\d+)$/);
    if (globalBpmMatch) globalBpm = parseInt(globalBpmMatch[1]);
    const loopMatch = line.match(/^Loop:\s*(.+)$/);
    if (loopMatch) loopEnabled = loopMatch[1].includes('Sí');
  }

  for (const line of lines) {
    const measureMatch = line.match(/Compás\s+\d+:\s*(\d+)\/(\d+)(?:\s*\|\s*|\s+)(\d+)\s*BPM/i);
    if (measureMatch) {
      const beats = parseInt(measureMatch[1]);
      const subdivision = parseInt(measureMatch[2]);
      const bpm = parseInt(measureMatch[3]);
      measures.push({ id: ++idCounter, bpm, beats, subdivision });
    }
  }

  if (measures.length === 0) return null;
  return { name, measures, globalBpm, usePerMeasureBpm, loopEnabled };
}
