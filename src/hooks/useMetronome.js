import { useState, useEffect, useRef, useCallback } from 'react';

const SAMPLE_RATE = 44100;

export function useMetronome(measures, globalBpm, usePerMeasureBpm, loopEnabled, isPlaying) {
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState(0);
  const [currentBeatInMeasure, setCurrentBeatInMeasure] = useState(0);
  const audioContextRef = useRef(null);
  const timerIDRef = useRef(null);
  const nextNoteTimeRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const getCurrentBpm = useCallback(() => {
    if (usePerMeasureBpm && measures.length > 0 && currentMeasureIndex < measures.length) {
      return measures[currentMeasureIndex].bpm;
    }
    return globalBpm;
  }, [measures, globalBpm, usePerMeasureBpm, currentMeasureIndex]);

  const getCurrentTimeSignature = useCallback(() => {
    if (measures.length > 0 && currentMeasureIndex < measures.length) {
      return {
        beats: measures[currentMeasureIndex].beats,
        subdivision: measures[currentMeasureIndex].subdivision,
      };
    }
    return { beats: 4, subdivision: 4 };
  }, [measures, currentMeasureIndex]);

  const getBeatDuration = useCallback(() => {
    const bpm = getCurrentBpm();
    const ts = getCurrentTimeSignature();
    const quarterNoteDuration = 60.0 / bpm;
    if (ts.subdivision === 8) {
      return quarterNoteDuration / 2;
    }
    return quarterNoteDuration;
  }, [getCurrentBpm, getCurrentTimeSignature]);

  const scheduleNote = useCallback((beat, time) => {
    const ts = getCurrentTimeSignature();
    const isDownbeat = beat === 0;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = isDownbeat ? 1000 : 800;
    osc.type = 'triangle';

    gain.gain.setValueAtTime(0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);

    if (ts.subdivision === 8 && !isDownbeat && beat % 2 === 1) {
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.frequency.value = 600;
      subOsc.type = 'sine';
      subGain.gain.setValueAtTime(0.2, time);
      subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      subOsc.start(time);
      subOsc.stop(time + 0.05);
    }
  }, [getCurrentTimeSignature, getAudioContext]);

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      scheduleNote(currentBeatInMeasure, nextNoteTimeRef.current);
      advanceBeat();
    }
    timerIDRef.current = setTimeout(scheduler, 25);
  }, [scheduleNote, currentBeatInMeasure]);

  const advanceBeat = useCallback(() => {
    const ts = getCurrentTimeSignature();
    const beatDuration = getBeatDuration();
    nextNoteTimeRef.current += beatDuration;
    setCurrentBeatInMeasure((prev) => {
      const next = prev + 1;
      if (next >= ts.beats) {
        setCurrentMeasureIndex((prevMeasure) => {
          const nextMeasure = prevMeasure + 1;
          if (nextMeasure >= measures.length) {
            if (loopEnabled) {
              setTimeout(() => setCurrentMeasureIndex(0), 0);
            } else {
              setTimeout(() => {
                setCurrentBeatInMeasure(0);
              }, 0);
            }
            return loopEnabled ? 0 : prevMeasure;
          }
          return nextMeasure;
        });
        return 0;
      }
      return next;
    });
  }, [getCurrentTimeSignature, getBeatDuration, measures.length, loopEnabled]);

  useEffect(() => {
    if (isPlaying) {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      nextNoteTimeRef.current = ctx.currentTime + 0.05;
      scheduler();
      return () => clearTimeout(timerIDRef.current);
    } else {
      clearTimeout(timerIDRef.current);
    }
  }, [isPlaying, scheduler, getAudioContext]);

  const stop = useCallback(() => {
    setCurrentMeasureIndex(0);
    setCurrentBeatInMeasure(0);
  }, []);

  const skipTo = useCallback((index) => {
    if (index === -1) {
      setCurrentMeasureIndex((prev) => Math.max(0, prev - 1));
    } else if (index === 999) {
      setCurrentMeasureIndex(measures.length - 1);
    } else {
      setCurrentMeasureIndex(Math.min(measures.length - 1, index));
    }
    setCurrentBeatInMeasure(0);
  }, [measures.length]);

  return {
    currentMeasureIndex,
    currentBeatInMeasure,
    getCurrentBpm,
    getCurrentTimeSignature,
    stop,
    skipTo,
  };
}
