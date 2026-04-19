"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  DownloadIcon,
  LibraryIcon,
  MusicIcon,
  PauseIcon,
  PlayIcon,
  SettingsIcon,
  SparklesIcon,
  Wand2Icon,
} from "lucide-react";
import type { LibraryItem } from "../page";

// ── Types ──────────────────────────────────────────────────────────────────────

type BeatMode = "authentic" | "ai";

type GeneratedBeat = {
  id: string;
  title: string;
  prompt: string;
  mode: BeatMode;
  bpm: number;
  key: string;
  genre: string;
  duration: number; // seconds
  createdAt: string;
  // We synthesise a tone-based audio blob URL
  audioUrl: string;
};

// ── Audio synthesis helpers ────────────────────────────────────────────────────

const NOTES: Record<string, number> = {
  C: 261.63,
  D: 293.66,
  E: 329.63,
  F: 349.23,
  G: 392.0,
  A: 440.0,
  B: 493.88,
};

const KEYS = Object.keys(NOTES);
const GENRES_AUTHENTIC = ["Lo-fi", "Jazz", "Soul", "Acoustic", "Ambient"];
const GENRES_AI = ["Experimental", "Glitch", "Synthwave", "Vaporwave", "Noise"];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBeatParams(prompt: string, mode: BeatMode) {
  // Seed some variation from the prompt
  const seed = prompt.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const bpm =
    mode === "authentic"
      ? 70 + ((seed * 7) % 50) // 70–120
      : 80 + ((seed * 13) % 100); // 80–180
  const key = KEYS[(seed * 3) % KEYS.length];
  const genre =
    mode === "authentic"
      ? GENRES_AUTHENTIC[(seed * 5) % GENRES_AUTHENTIC.length]
      : GENRES_AI[(seed * 11) % GENRES_AI.length];
  return { bpm, key, genre };
}

/** Synthesise a short PCM WAV in memory and return an object URL. */
function synthesiseBeat(key: string, bpm: number, durationSec: number): string {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSec;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, numSamples * 2, true);

  const baseFreq = NOTES[key] ?? 440;
  const beatInterval = (60 / bpm) * sampleRate;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Melody layer: base note + octave
    const melody = 0.25 * Math.sin(2 * Math.PI * baseFreq * t);
    // Kick-drum-like click on the beat
    const beatPos = i % beatInterval;
    const kick =
      beatPos < sampleRate * 0.05
        ? 0.4 * Math.exp(-beatPos / 800) * Math.sin(2 * Math.PI * 60 * (beatPos / sampleRate))
        : 0;
    // Hi-hat on every quarter beat
    const hihatPos = i % (beatInterval / 2);
    const hihat =
      hihatPos < sampleRate * 0.015
        ? 0.15 * Math.exp(-hihatPos / 200) * (Math.random() * 2 - 1)
        : 0;

    const sample = Math.max(-1, Math.min(1, melody + kick + hihat));
    view.setInt16(44 + i * 2, sample * 0x7fff, true);
  }

  const blob = new Blob([buffer], { type: "audio/wav" });
  return URL.createObjectURL(blob);
}

// ── Component ──────────────────────────────────────────────────────────────────

const LIBRARY_KEY = "peytotoria_library";

function loadLibrary(): LibraryItem[] {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToLibrary(beat: GeneratedBeat) {
  const items: LibraryItem[] = loadLibrary();
  items.unshift({
    id: beat.id,
    title: beat.title,
    kind: "music",
    content: `Genre: ${beat.genre}\nKey: ${beat.key}\nBPM: ${beat.bpm}\nMode: ${beat.mode === "authentic" ? "Authentic 100% Natural Beat" : "AI Generate Beat"}\nPrompt: ${beat.prompt || "(random)"}`,
    createdAt: beat.createdAt,
  });
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(items));
}

export default function MusicPage() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<BeatMode>("authentic");
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [beat, setBeat] = useState<GeneratedBeat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [progress, setProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up object URLs and interval on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (beat?.audioUrl) URL.revokeObjectURL(beat.audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setSavedToLibrary(false);
    setProgress(0);

    // Cleanup previous beat
    if (beat?.audioUrl) URL.revokeObjectURL(beat.audioUrl);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Simulate Lio thinking: 1.2–2s delay
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const effectivePrompt = prompt.trim() || `random ${mode} beat`;
    const { bpm, key, genre } = generateBeatParams(effectivePrompt, mode);
    const duration = 12; // 12-second preview
    const audioUrl = synthesiseBeat(key, bpm, duration);

    const titleWords = effectivePrompt.split(" ").slice(0, 4).join(" ");
    const title = `${genre} — ${titleWords}`;

    const newBeat: GeneratedBeat = {
      id: crypto.randomUUID(),
      title,
      prompt: effectivePrompt,
      mode,
      bpm,
      key,
      genre,
      duration,
      createdAt: new Date().toISOString(),
      audioUrl,
    };

    setBeat(newBeat);
    setIsGenerating(false);
  };

  const togglePlay = () => {
    if (!beat) return;

    if (isPlaying) {
      audioRef.current?.pause();
      if (progressRef.current) clearInterval(progressRef.current);
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        const audio = new Audio(beat.audioUrl);
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          if (progressRef.current) clearInterval(progressRef.current);
        };
        audioRef.current = audio;
      }
      audioRef.current.play();
      setIsPlaying(true);
      progressRef.current = setInterval(() => {
        if (audioRef.current) {
          setProgress(audioRef.current.currentTime / beat.duration);
        }
      }, 100);
    }
  };

  const handleDownload = () => {
    if (!beat) return;
    const a = document.createElement("a");
    a.href = beat.audioUrl;
    a.download = `${beat.title.replace(/[^a-z0-9]/gi, "_")}.wav`;
    a.click();
  };

  const handleSaveToLibrary = () => {
    if (!beat) return;
    saveToLibrary(beat);
    setSavedToLibrary(true);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        {/* Back */}
        <Link
          href="/library"
          className="text-[13px] text-muted-foreground transition-colors hover:text-foreground mb-10 inline-block"
        >
          &larr; Back to Library
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-1">
            <MusicIcon className="size-5 text-foreground" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Music
            </h1>
          </div>
          <p className="text-[13px] text-muted-foreground">
            Generate a beat with Lio 1.0. Prompt is optional — leave it empty for a fully random result.
          </p>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2 mb-4">
          <input
            className="flex-1 h-10 rounded-xl border border-border/60 bg-card px-3.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-1 focus:ring-border transition-all"
            placeholder="Describe your beat (optional)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isGenerating) handleGenerate();
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-[13px] font-semibold text-background transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            type="button"
          >
            <Wand2Icon className="size-3.5" />
            {isGenerating ? "Generating..." : "Generate"}
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl border text-muted-foreground transition-all hover:text-foreground ${
              showSettings
                ? "border-foreground/30 bg-muted text-foreground"
                : "border-border/60 bg-card"
            }`}
            title="Settings"
            type="button"
          >
            <SettingsIcon className="size-4" />
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-6 rounded-xl border border-border/50 bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Generation Mode
            </p>
            <div className="flex flex-col gap-2">
              {(
                [
                  {
                    value: "authentic" as BeatMode,
                    label: "Authentic 100% Natural Beat",
                    desc: "Structured, well-composed output with organic feel",
                  },
                  {
                    value: "ai" as BeatMode,
                    label: "AI Generate Beat",
                    desc: "More random, experimental — anything goes",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMode(opt.value)}
                  className={`flex items-start gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                    mode === opt.value
                      ? "border-foreground/40 bg-muted"
                      : "border-border/40 bg-background hover:bg-muted/50"
                  }`}
                  type="button"
                >
                  <span
                    className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                      mode === opt.value
                        ? "border-foreground bg-foreground"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {mode === opt.value && (
                      <span className="size-1.5 rounded-full bg-background" />
                    )}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card px-4 py-5">
            <SparklesIcon className="size-4 animate-pulse text-muted-foreground" />
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Lio is composing your beat...
              </p>
              <p className="text-[11px] text-muted-foreground">
                Analysing prompt, selecting key and BPM
              </p>
            </div>
          </div>
        )}

        {/* Player */}
        {beat && !isGenerating && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {beat.genre} &middot; {beat.mode === "authentic" ? "Authentic" : "AI Generated"}
                </p>
                <h2 className="text-[15px] font-bold text-foreground mt-0.5">
                  {beat.title}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Key: {beat.key} &middot; BPM: {beat.bpm} &middot; {beat.duration}s preview
                </p>
              </div>
            </div>

            {/* Waveform progress bar */}
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-100"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={togglePlay}
                className="flex size-9 items-center justify-center rounded-full bg-foreground text-background transition-all hover:opacity-90 active:scale-95"
                type="button"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <PauseIcon className="size-4 fill-current" />
                ) : (
                  <PlayIcon className="size-4 fill-current" />
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                type="button"
              >
                <DownloadIcon className="size-3.5" />
                Download
              </button>

              <button
                onClick={handleSaveToLibrary}
                disabled={savedToLibrary}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                type="button"
              >
                <LibraryIcon className="size-3.5" />
                {savedToLibrary ? "Saved!" : "Save to Library"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
