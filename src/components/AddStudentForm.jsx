/**
 * Inline modal form for adding a new student.
 *
 * On submit (with consent checkbox ticked) calls the add-student Edge Function.
 * On success swaps to a "success" panel that shows the generated PIN once and
 * offers a link to a printable PIN card.
 */
import { useEffect, useState } from 'react';
import { addStudent } from '../lib/admin.js';

export default function AddStudentForm({ onClose, onCreated }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [consent, setConsent]     = useState(false);
  const [error, setError]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [created, setCreated]     = useState(null);
  const [copied, setCopied]       = useState(false);

  // Esc closes the modal
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (!firstName.trim()) {
      setError('First name required');
      return;
    }
    if (!consent) {
      setError('Parental consent must be confirmed');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await addStudent({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        consent_collected: true,
      });
      setCreated(result);
      onCreated?.();
    } catch (e) {
      setError(e.message || 'Failed');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="add-student__result">
        <h2 className="add-student__success-title">
          <span lang="tr">Eklendi</span>
          {' / Added'}
        </h2>
        <p className="add-student__name">
          {created.first_name}
          {created.last_name ? ` ${created.last_name}` : ''}
        </p>
        <p className="add-student__pin-label">
          <span lang="tr">PIN</span>
          {' / PIN'}
        </p>
        <div className="add-student__pin-row">
          <p className="add-student__pin">{created.student_code}</p>
          <button
            type="button"
            className="add-student__copy"
            onClick={() => {
              navigator.clipboard.writeText(created.student_code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="add-student__hint">
          <span lang="tr">Bunu yazın — bir daha gösterilmeyecek.</span>
          <br />
          Write this down — it won&rsquo;t be shown again.
        </p>
        <div className="add-student__actions">
          <a
            href={`#/instructor/student/${created.profile_id}/print-card`}
            target="_blank"
            rel="noopener"
            className="add-student__action add-student__action--primary"
          >
            <span lang="tr">PIN kartını yazdır</span>
            {' / Print PIN card'}
          </a>
          <button
            type="button"
            className="add-student__action"
            onClick={onClose}
          >
            <span lang="tr">Tamam</span>
            {' / Done'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="add-student" onSubmit={submit}>
      <h2 className="add-student__title">
        <span lang="tr">Yeni öğrenci</span>
        {' / Add Student'}
      </h2>

      <p className="add-student__hint">
        <span lang="tr">
          Velinin onayını kayıttan önce yazılı olarak alın.
        </span>
        <br />
        Parents must sign the consent form before you save the student.
        {' '}
        <a href="#/instructor/print-consent" target="_blank" rel="noopener">
          <span lang="tr">Boş formu yazdır</span>
          {' / Print blank form'}
        </a>
      </p>

      <label className="login-form__field">
        <span>
          <span lang="tr">Ad</span>
          {' / First name'}
        </span>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={80}
          required
          autoFocus
        />
      </label>

      <label className="login-form__field">
        <span>
          <span lang="tr">Soyad</span>
          {' / Last name (optional)'}
        </span>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          maxLength={80}
        />
      </label>

      <label className="add-student__consent">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          <span lang="tr">
            Velinin imzaladığı izin formunu aldım.
          </span>
          <br />
          I have collected the parent&rsquo;s signed consent form.
        </span>
      </label>

      {error && <p className="login-view__error" role="alert">{error}</p>}

      <div className="add-student__actions">
        <button type="button" className="add-student__action" onClick={onClose}>
          <span lang="tr">İptal</span>
          {' / Cancel'}
        </button>
        <button
          type="submit"
          className="add-student__action add-student__action--primary"
          disabled={busy}
        >
          {busy ? (
            <>Saving…</>
          ) : (
            <>
              <span lang="tr">Kaydet</span>
              {' / Save'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
