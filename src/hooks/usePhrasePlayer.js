/**
 * Coordinates phrase audio playback for a lesson through a single shared
 * Audio instance, so only one clip can ever play at a time.
 *
 * While a clip plays the whole grid is "locked": play() ignores any further
 * taps until the current clip finishes. This stops students from mashing one
 * tile or triggering several at once.
 *
 *   const { playingId, locked, play } = usePhrasePlayer();
 *   <button disabled={locked && playingId !== p.id} onClick={() => play(p)} />
 */
import { useEffect, useRef, useState } from 'react';

export default function usePhrasePlayer() {
  const [playingId, setPlayingId] = useState(null);
  const [locked, setLocked] = useState(false);

  const audioRef = useRef(null);

  // Lazily create the single reused Audio element on first use.
  if (audioRef.current === null && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Clip finished (or failed): un-highlight and release the lock immediately.
    function release() {
      setPlayingId(null);
      setLocked(false);
    }
    function onError() {
      console.warn('[player] failed to play', audio.src);
      release();
    }

    audio.addEventListener('ended', release);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('ended', release);
      audio.removeEventListener('error', onError);
      audio.pause();
    };
  }, []);

  function play(phrase) {
    const audio = audioRef.current;
    if (!audio || locked || playingId) return; // grid is locked — ignore tap

    setPlayingId(phrase.id);
    setLocked(true);
    audio.src = phrase.audio;
    audio.play().catch((err) => {
      console.warn('[player] failed to play', phrase.audio, err);
      setPlayingId(null);
      setLocked(false);
    });
  }

  return { playingId, locked, play };
}
