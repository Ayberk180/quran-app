import { useState } from 'react';
import { signInWithPin, signInWithEmail } from '../lib/auth.js';
import { navigate } from '../lib/router.js';

export default function LoginView() {
  const [mode, setMode] = useState('student');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError('');
    setPin('');
  }

  async function submitPin() {
    if (pin.length !== 6 || busy) return;
    setBusy(true); setError('');
    try {
      await signInWithPin(pin);
      navigate('#/me');
    } catch (e) {
      setError(e.message || 'Sign-in failed');
      setPin('');
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const profile = await signInWithEmail(email, password);
      navigate(profile.role >= 2 ? '#/instructor' : '#/me');
    } catch (e) {
      setError(e.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  function pressDigit(d) {
    if (busy) return;
    setPin((p) => (p.length < 6 ? p + d : p));
  }

  function backspace() {
    if (busy) return;
    setPin((p) => p.slice(0, -1));
  }

  return (
    <div className="login-view">
      <h1 className="login-view__title">
        {mode === 'student' ? (
          <>
            <span lang="tr">Giriş</span>
            {' / Sign In'}
          </>
        ) : (
          <>
            <span lang="tr">Öğretmen Girişi</span>
            {' / Instructor Sign In'}
          </>
        )}
      </h1>

      {mode === 'student' ? (
        <>
          <div
            className="pin-display"
            aria-label={`PIN: ${pin.length} of 6 digits entered`}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={
                  'pin-display__dot' +
                  (pin.length > i ? ' pin-display__dot--filled' : '')
                }
              />
            ))}
          </div>

          <p className="login-view__error" role="alert">{error}</p>

          <div className="pin-pad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button
                key={d}
                type="button"
                className="pin-pad__key"
                onClick={() => pressDigit(String(d))}
                disabled={busy}
              >
                {d}
              </button>
            ))}
            <button
              type="button"
              className="pin-pad__key pin-pad__key--util"
              onClick={backspace}
              disabled={busy || pin.length === 0}
              aria-label="Backspace"
            >
              ←
            </button>
            <button
              type="button"
              className="pin-pad__key"
              onClick={() => pressDigit('0')}
              disabled={busy}
            >
              0
            </button>
            <button
              type="button"
              className="pin-pad__key pin-pad__key--submit"
              onClick={submitPin}
              disabled={pin.length !== 6 || busy}
              aria-label="Submit PIN"
            >
              ✓
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={submitEmail} className="login-form">
          <label className="login-form__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="login-form__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <p className="login-view__error" role="alert">{error}</p>

          <button type="submit" className="login-form__submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      <button
        type="button"
        className="login-view__toggle"
        onClick={() => switchMode(mode === 'student' ? 'instructor' : 'student')}
      >
        {mode === 'student' ? (
          <>
            <span lang="tr">Öğretmen girişi</span>
            {' / Instructor sign-in'}
          </>
        ) : (
          <>
            <span lang="tr">Öğrenci girişi</span>
            {' / Student sign-in'}
          </>
        )}
      </button>

      <p className="login-view__footer">
        <a href="#/privacy">
          <span lang="tr">Gizlilik</span>
          {' / Privacy'}
        </a>
      </p>
    </div>
  );
}
