/**
 * Inline modal form for adding a new student.
 *
 * On submit (with consent checkbox ticked) calls the add-student Edge Function.
 * On success swaps to a "success" panel that shows the generated PIN once and
 * offers a link to a printable PIN card.
 */
import { useEffect, useState } from 'react';
import { addStudent } from '../lib/admin.js';
import { useLanguage } from '../lib/i18n.jsx';

export default function AddStudentForm({ onClose, onCreated }) {
  const { t } = useLanguage();
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
      setError(t('addStudent.error.firstName'));
      return;
    }
    if (!consent) {
      setError(t('addStudent.error.consent'));
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
      setError(e.message || t('addStudent.error.failed'));
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="add-student__result">
        <h2 className="add-student__success-title">{t('addStudent.added')}</h2>
        <p className="add-student__name">
          {created.first_name}
          {created.last_name ? ` ${created.last_name}` : ''}
        </p>
        <p className="add-student__pin-label">{t('addStudent.pinLabel')}</p>
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
            {copied ? t('addStudent.copied') : t('addStudent.copy')}
          </button>
        </div>
        <p className="add-student__hint">{t('addStudent.writeDown')}</p>
        <div className="add-student__actions">
          <a
            href={`#/instructor/student/${created.profile_id}/print-card`}
            target="_blank"
            rel="noopener"
            className="add-student__action add-student__action--primary"
          >
            {t('addStudent.printPinCard')}
          </a>
          <button
            type="button"
            className="add-student__action"
            onClick={onClose}
          >
            {t('addStudent.done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="add-student" onSubmit={submit}>
      <h2 className="add-student__title">{t('addStudent.title')}</h2>

      <p className="add-student__hint">
        {t('addStudent.hint')}
        {' '}
        <a href="#/instructor/print-consent" target="_blank" rel="noopener">
          {t('addStudent.printBlank')}
        </a>
      </p>

      <label className="login-form__field">
        <span>{t('addStudent.firstName')}</span>
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
        <span>{t('addStudent.lastName')}</span>
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
        <span>{t('addStudent.consentLabel')}</span>
      </label>

      {error && <p className="login-view__error" role="alert">{error}</p>}

      <div className="add-student__actions">
        <button type="button" className="add-student__action" onClick={onClose}>
          {t('addStudent.cancel')}
        </button>
        <button
          type="submit"
          className="add-student__action add-student__action--primary"
          disabled={busy}
        >
          {busy ? t('addStudent.saving') : t('addStudent.save')}
        </button>
      </div>
    </form>
  );
}
