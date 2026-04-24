import { useCallback, useEffect, useState } from "react";
import { forestAudio } from "@/lib/forestAudio";

/**
 * React bridge for the master-mute state on `forestAudio`.
 *
 * - Persists to `localStorage` under `ef-audio-muted`.
 * - Defaults to the user's `prefers-reduced-motion` preference
 *   when no explicit value is stored (motion-averse players
 *   typically want audio off too).
 * - Pushes the state into `forestAudio.setMuted` on every change,
 *   including the initial render, so the engine matches the hook.
 */

const MUTED_KEY = "ef-audio-muted";

export function useAudioMute(): {
  muted: boolean;
  toggle: () => void;
  setMuted: (next: boolean) => void;
} {
  const [muted, setMutedState] = useState<boolean>(readInitial);

  useEffect(() => {
    forestAudio.setMuted(muted);
    try {
      window.localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
    } catch {
      // localStorage can throw in private mode — swallow silently.
    }
  }, [muted]);

  const toggle = useCallback(() => setMutedState((v) => !v), []);
  const setMuted = useCallback((next: boolean) => setMutedState(next), []);

  return { muted, toggle, setMuted };
}

function readInitial(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = window.localStorage.getItem(MUTED_KEY);
    if (stored === "1") return true;
    if (stored === "0") return false;
  } catch {
    // fall through to motion preference
  }
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}
