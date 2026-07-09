import { useEffect, useRef, useState } from 'react';
import { isConfigured } from '../lib/supabase.js';
import { navigate } from '../lib/router.js';

/**
 * Non-blocking sign-in suggestion shown over the homepage to signed-out
 * visitors. It's a nudge, not a gate — the lesson list stays fully usable
 * behind it. Shown once per session (sessionStorage), and never when sign-in
 * isn't configured. Reuses the shared .modal / .modal__panel backdrop pattern.
 */
const SEEN_KEY = 'qapp:signin-prompt-seen';

export default function SignInPrompt() {
  // Decide visibility once, at mount: only if configured and not yet seen
  // this session. Reading sessionStorage in the initializer avoids a flash.
  const [open, setOpen] = useState(() => {
    if (!isConfigured) return false;
    try {
      return sessionStorage.getItem(SEEN_KEY) !== '1';
    } catch {
      return true; // storage blocked → still fine to prompt this once
    }
  });

  const signInRef = useRef(null);

  // Mark as seen as soon as we show it, so later homepage visits this session
  // don't re-prompt even if the user navigates away without dismissing.
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* ignore */
    }
    signInRef.current?.focus();
  }, [open]);

  // Escape to dismiss.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const dismiss = () => setOpen(false);
  const signIn = () => {
    setOpen(false);
    navigate('#/login');
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-prompt-title"
      onClick={dismiss}
    >
      <div
        className="modal__panel signin-prompt"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="signin-prompt-title" className="signin-prompt__title">
          <span lang="tr">Giriş yap</span>
          {' / '}
          <span>Sign in</span>
        </h2>

        <p className="signin-prompt__hint">
          <span lang="tr">İlerlemeni kaydetmek için giriş yap.</span>
          {' '}
          <span>Sign in to save your progress across lessons.</span>
        </p>

        <div className="signin-prompt__actions">
          <button
            ref={signInRef}
            type="button"
            className="signin-prompt__primary"
            onClick={signIn}
          >
            <span lang="tr">Giriş yap</span>
            {' / '}
            <span>Sign in</span>
          </button>

          <button
            type="button"
            className="signin-prompt__secondary"
            onClick={dismiss}
          >
            <span lang="tr">Şimdi değil</span>
            {' / '}
            <span>Not now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
