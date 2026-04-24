import * as Tone from "tone";

const FOREST_SCALE = ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"];
const HEALING_SCALE = ["E4", "G#4", "B4", "D#5", "E5", "G#5"];
const SHIELD_SCALE = ["C4", "Eb4", "G4", "Bb4", "C5"];
const PURIFY_SCALE = ["D4", "F#4", "A4", "C#5", "D5", "F#5"];

export type ToneType = "shield" | "heal" | "purify" | "ambient" | "damage" | "victory" | "defeat";

export interface ForestAudioStatus {
  available: boolean;
  fallbackReason: string | null;
  initialized: boolean;
  visualFallbackActive: boolean;
}

const MASTER_DB_UNMUTED = -6;
const MASTER_DB_MUTED = -Infinity;

class ForestAudioEngine {
  private initialized = false;
  private fallbackReason: string | null = null;
  private muted = false;
  private masterVolume: Tone.Volume | null = null;
  private ambientDrone: Tone.Synth | null = null;
  private ambientFilter: Tone.Filter | null = null;
  private windNoise: Tone.Noise | null = null;
  private windFilter: Tone.AutoFilter | null = null;
  private melodySynth: Tone.PolySynth | null = null;
  private padSynth: Tone.PolySynth | null = null;
  private bellSynth: Tone.PolySynth | null = null;
  private mainReverb: Tone.Reverb | null = null;
  private mainDelay: Tone.FeedbackDelay | null = null;
  private chorus: Tone.Chorus | null = null;
  private ambientSequence: Tone.Sequence | null = null;
  private isAmbientPlaying = false;

  async initialize(): Promise<ForestAudioStatus> {
    if (this.initialized) return this.getStatus();

    try {
      await Tone.start();
      this.masterVolume = new Tone.Volume(
        this.muted ? MASTER_DB_MUTED : MASTER_DB_UNMUTED
      ).toDestination();
      this.mainReverb = new Tone.Reverb({ decay: 4, wet: 0.5, preDelay: 0.1 }).connect(
        this.masterVolume
      );
      this.mainDelay = new Tone.FeedbackDelay({
        delayTime: "8n.",
        feedback: 0.3,
        wet: 0.2,
      }).connect(this.mainReverb);
      this.chorus = new Tone.Chorus({
        frequency: 0.5,
        delayTime: 3.5,
        depth: 0.7,
        wet: 0.3,
      }).connect(this.mainDelay);
      this.ambientFilter = new Tone.Filter({ frequency: 800, type: "lowpass", Q: 2 }).connect(
        this.mainReverb
      );
      this.ambientDrone = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
        volume: -20,
      }).connect(this.ambientFilter);
      this.windFilter = new Tone.AutoFilter({
        frequency: 0.1,
        baseFrequency: 200,
        octaves: 4,
        depth: 0.8,
      }).connect(this.mainReverb);
      this.windFilter.start();
      this.windNoise = new Tone.Noise({ type: "pink", volume: -30 }).connect(this.windFilter);
      this.melodySynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 1 },
        volume: -8,
      }).connect(this.chorus);
      this.padSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 1, decay: 2, sustain: 0.6, release: 3 },
        volume: -15,
      }).connect(this.mainReverb);
      this.bellSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 2 },
        volume: -10,
      }).connect(this.mainDelay);
      this.fallbackReason = null;
      this.initialized = true;
    } catch (error) {
      this.fallbackReason = error instanceof Error ? error.message : "Audio context unavailable";
      this.dispose();
    }

    return this.getStatus();
  }

  getStatus(): ForestAudioStatus {
    return {
      available: this.initialized && this.fallbackReason === null,
      fallbackReason: this.fallbackReason,
      initialized: this.initialized,
      visualFallbackActive: this.fallbackReason !== null,
    };
  }

  startAmbient(): void {
    if (!this.initialized || this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;
    this.windNoise?.start();
    this.ambientDrone?.triggerAttack("C2");
    const ambientNotes = ["C4", "E4", "G4", "A4", "E4", "G4", "C5", "G4"];
    this.ambientSequence = new Tone.Sequence(
      (time, note) => {
        if (Math.random() > 0.3) this.bellSynth?.triggerAttackRelease(note, "2n", time, 0.3);
      },
      ambientNotes,
      "2n"
    );
    this.ambientSequence.start(0);
    Tone.getTransport().bpm.value = 60;
    Tone.getTransport().start();
  }

  stopAmbient(): void {
    if (!this.isAmbientPlaying) return;
    this.windNoise?.stop();
    this.ambientDrone?.triggerRelease();
    this.ambientSequence?.stop();
    this.ambientSequence?.dispose();
    this.ambientSequence = null;
    Tone.getTransport().stop();
    this.isAmbientPlaying = false;
  }

  playTouchNote(_x: number, y: number): void {
    if (!this.initialized || !this.melodySynth) return;
    const noteIndex = Math.floor((1 - y) * FOREST_SCALE.length);
    const note = FOREST_SCALE[Math.max(0, Math.min(noteIndex, FOREST_SCALE.length - 1))];
    this.melodySynth.triggerAttackRelease(note, "8n", Tone.now(), 0.7);
  }

  playSpellEffect(type: ToneType): void {
    if (!this.initialized) return;
    const now = Tone.now();
    switch (type) {
      case "shield":
        this.padSynth?.triggerAttackRelease(["C3", "G3", "C4", "E4"], "2n", now, 0.6);
        SHIELD_SCALE.forEach((note, i) => {
          this.bellSynth?.triggerAttackRelease(note, "4n", now + i * 0.1, 0.5);
        });
        break;
      case "heal":
        HEALING_SCALE.forEach((note, i) => {
          this.melodySynth?.triggerAttackRelease(note, "8n", now + i * 0.15, 0.6);
        });
        this.padSynth?.triggerAttackRelease(["E3", "G#3", "B3"], "1n", now + 0.3, 0.4);
        break;
      case "purify":
        this.bellSynth?.triggerAttackRelease(["D5", "F#5", "A5"], "4n", now, 0.8);
        PURIFY_SCALE.forEach((note, i) => {
          this.melodySynth?.triggerAttackRelease(note, "16n", now + i * 0.08, 0.5);
        });
        break;
      case "damage":
        this.padSynth?.triggerAttackRelease(["C3", "Db3", "Gb3"], "8n", now, 0.4);
        break;
      case "victory":
        ["C4", "E4", "G4", "C5"].forEach((note, i) => {
          this.bellSynth?.triggerAttackRelease(note, "2n", now + i * 0.2, 0.7);
        });
        this.padSynth?.triggerAttackRelease(["C3", "G3", "C4", "E4", "G4"], "1n", now + 0.5, 0.5);
        break;
      case "defeat":
        ["E4", "D4", "C4", "B3", "A3"].forEach((note, i) => {
          this.melodySynth?.triggerAttackRelease(note, "4n", now + i * 0.4, 0.4);
        });
        this.padSynth?.triggerAttackRelease(["A2", "E3", "A3"], "1n", now + 1, 0.3);
        break;
    }
  }

  playGestureSequence(points: { x: number; y: number }[], type: ToneType): void {
    if (!this.initialized || !this.melodySynth || points.length < 5) return;
    const scale =
      type === "heal"
        ? HEALING_SCALE
        : type === "shield"
          ? SHIELD_SCALE
          : type === "purify"
            ? PURIFY_SCALE
            : FOREST_SCALE;
    const sampleCount = Math.min(8, points.length);
    const step = Math.floor(points.length / sampleCount);
    const now = Tone.now();
    for (let i = 0; i < sampleCount; i++) {
      const point = points[i * step];
      if (!point) continue;
      const noteIndex = Math.floor((1 - point.y) * scale.length);
      const note = scale[Math.max(0, Math.min(noteIndex, scale.length - 1))];
      this.melodySynth.triggerAttackRelease(note, "16n", now + i * 0.1, 0.5);
    }
  }

  updateTreeHealth(avgHealth: number): void {
    if (!this.initialized || !this.ambientFilter) return;
    const frequency = 400 + (avgHealth / 100) * 600;
    this.ambientFilter.frequency.rampTo(frequency, 0.5);
  }

  playWaveStart(waveNumber: number): void {
    if (!this.initialized) return;
    const now = Tone.now();
    this.padSynth?.triggerAttackRelease(["C2", "C3"], "8n", now, 0.8);
    for (let i = 0; i < Math.min(waveNumber, 5); i++) {
      this.bellSynth?.triggerAttackRelease(FOREST_SCALE[i + 2], "8n", now + 0.3 + i * 0.15, 0.6);
    }
  }

  playCorruptionThreat(): void {
    if (!this.initialized) return;
    this.padSynth?.triggerAttackRelease(["C2", "Gb2"], "4n", Tone.now(), 0.3);
  }

  setMuted(next: boolean): void {
    this.muted = next;
    if (this.masterVolume) {
      // Ramp to the new level so switching doesn't pop. A 200ms
      // cross-fade is long enough to be smooth, short enough to feel
      // immediate when the user taps.
      this.masterVolume.volume.rampTo(
        next ? MASTER_DB_MUTED : MASTER_DB_UNMUTED,
        0.2
      );
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  dispose(): void {
    this.stopAmbient();
    this.ambientDrone?.dispose();
    this.ambientFilter?.dispose();
    this.windNoise?.dispose();
    this.windFilter?.dispose();
    this.melodySynth?.dispose();
    this.padSynth?.dispose();
    this.bellSynth?.dispose();
    this.mainReverb?.dispose();
    this.mainDelay?.dispose();
    this.chorus?.dispose();
    this.masterVolume?.dispose();
    this.initialized = false;
  }
}

export const forestAudio = new ForestAudioEngine();
