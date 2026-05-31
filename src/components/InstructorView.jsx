/**
 * Instructor portal at #/instructor.
 *
 * Roster table: one row per student in the same school. Each row links to
 * /instructor/student/:id for the per-student detail. Aggregates come from
 * the instructor_roster Postgres view.
 */
import { useEffect, useState } from 'react';
import { fetchRoster } from '../lib/instructor.js';
import { signOut } from '../lib/auth.js';
import { navigate } from '../lib/router.js';
import AddStudentForm from './AddStudentForm.jsx';

export default function InstructorView({ profile }) {
  const [roster, setRoster]   = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  function loadRoster() {
    return fetchRoster().then(setRoster);
  }

  useEffect(() => { loadRoster(); }, []);

  async function handleSignOut() {
    await signOut();
    navigate('#/');
  }

  if (!roster) return null;

  return (
    <div className="instructor-view">
      <header className="instructor-view__header">
        <div>
          <h1 className="instructor-view__title">
            <span lang="tr">Yönetim</span>
            {' / Instructor Portal'}
          </h1>
          <p className="instructor-view__meta">
            {profile.first_name} · {roster.length}{' '}
            <span lang="tr">öğrenci</span>{' / '}
            student{roster.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          className="student-dashboard__signout"
          onClick={handleSignOut}
        >
          <span lang="tr">Çıkış</span>
          {' / Sign out'}
        </button>
      </header>

      <div className="instructor-view__actions">
        <button
          type="button"
          className="instructor-view__primary"
          onClick={() => setShowAdd(true)}
        >
          + <span lang="tr">Öğrenci ekle</span>
          {' / Add Student'}
        </button>
        <a
          href="#/instructor/print-consent"
          target="_blank"
          rel="noopener"
          className="instructor-view__secondary"
        >
          <span lang="tr">Veli izin formu</span>
          {' / Consent form'}
        </a>
      </div>

      <section className="roster" aria-label="Students">
        <span className="lesson-list__label">
          <span lang="tr">Öğrenciler</span>
          {' / Students'}
        </span>

        {roster.length === 0 ? (
          <p className="empty-state">
            <span lang="tr">Henüz öğrenci eklenmedi.</span>
            <br />
            No students yet. Click <strong>+ Add Student</strong> to begin.
          </p>
        ) : (
          <div className="roster__scroll">
            <div className="roster__table" role="table">
              <div className="roster__head" role="row">
                <span role="columnheader">
                  <span lang="tr">İsim</span>
                  {' / Name'}
                </span>
                <span role="columnheader">
                  <span lang="tr">Şu an</span>
                  {' / Current'}
                </span>
                <span role="columnheader">
                  <span lang="tr">Geçti</span>
                  {' / Passed'}
                </span>
                <span role="columnheader">7d</span>
                <span role="columnheader">30d</span>
                <span role="columnheader">
                  <span lang="tr">Son giriş</span>
                  {' / Last seen'}
                </span>
              </div>
              {roster.map((s) => (
                <a
                  key={s.id}
                  role="row"
                  className="roster__row"
                  href={`#/instructor/student/${s.id}`}
                >
                  <span role="cell" className="roster__name">
                    {s.first_name}
                    {s.last_initial ? ` ${s.last_initial}.` : ''}
                  </span>
                  <span role="cell">
                    {s.current_lesson != null
                      ? `Lesson ${s.current_lesson}`
                      : '— complete —'}
                  </span>
                  <span role="cell">
                    {s.passed_count ?? 0}/28
                  </span>
                  <span role="cell">{s.logins_7d ?? 0}</span>
                  <span role="cell">{s.logins_30d ?? 0}</span>
                  <span role="cell" className="roster__last-seen">
                    {formatLastSeen(s.last_seen)}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </section>

      {showAdd && (
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAdd(false)}
        >
          <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
            <AddStudentForm
              onClose={() => { setShowAdd(false); loadRoster(); }}
              onCreated={loadRoster}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function formatLastSeen(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}
