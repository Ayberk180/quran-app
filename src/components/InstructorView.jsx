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
import { useLanguage } from '../lib/i18n.jsx';

export default function InstructorView({ profile }) {
  const { t } = useLanguage();
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
          <h1 className="instructor-view__title">{t('instructor.title')}</h1>
          <p className="instructor-view__meta">
            {t('instructor.studentCount', {
              name: profile.first_name,
              n: roster.length,
              s: roster.length !== 1 ? 's' : '',
            })}
          </p>
        </div>
        <button
          type="button"
          className="student-dashboard__signout"
          onClick={handleSignOut}
        >
          {t('instructor.signOut')}
        </button>
      </header>

      <div className="instructor-view__actions">
        <button
          type="button"
          className="instructor-view__primary"
          onClick={() => setShowAdd(true)}
        >
          {t('instructor.addStudent')}
        </button>
        <a
          href="#/instructor/print-consent"
          target="_blank"
          rel="noopener"
          className="instructor-view__secondary"
        >
          {t('instructor.consentForm')}
        </a>
        {profile.role === 3 && (
          <a href="#/record" className="instructor-view__secondary">
            {t('instructor.recordAudio')}
          </a>
        )}
      </div>

      <section className="roster" aria-label="Students">
        <span className="lesson-list__label">{t('instructor.studentsLabel')}</span>

        {roster.length === 0 ? (
          <p className="empty-state">{t('instructor.emptyRoster')}</p>
        ) : (
          <div className="roster__scroll">
            <div className="roster__table" role="table">
              <div className="roster__head" role="row">
                <span role="columnheader">{t('instructor.col.name')}</span>
                <span role="columnheader">{t('instructor.col.current')}</span>
                <span role="columnheader">{t('instructor.col.passed')}</span>
                <span role="columnheader">7d</span>
                <span role="columnheader">30d</span>
                <span role="columnheader">{t('instructor.col.lastSeen')}</span>
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
                    {s.last_name
                      ? ` ${s.last_name}`
                      : s.last_initial ? ` ${s.last_initial}.` : ''}
                  </span>
                  <span role="cell">
                    {s.current_lesson != null
                      ? t('instructor.lessonN', { n: s.current_lesson })
                      : t('instructor.complete')}
                  </span>
                  <span role="cell">
                    {s.passed_count ?? 0}/28
                  </span>
                  <span role="cell">{s.logins_7d ?? 0}</span>
                  <span role="cell">{s.logins_30d ?? 0}</span>
                  <span role="cell" className="roster__last-seen">
                    {formatLastSeen(s.last_seen, t)}
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

function formatLastSeen(iso, t) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return t('instructor.lastSeen.now');
  const min = Math.floor(ms / 60000);
  if (min < 1) return t('instructor.lastSeen.now');
  if (min < 60) return t('instructor.lastSeen.minsAgo', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return t('instructor.lastSeen.hoursAgo', { n: hr });
  const day = Math.floor(hr / 24);
  if (day < 30) return t('instructor.lastSeen.daysAgo', { n: day });
  const mo = Math.floor(day / 30);
  if (mo < 12) return t('instructor.lastSeen.monthsAgo', { n: mo });
  return t('instructor.lastSeen.yearsAgo', { n: Math.floor(mo / 12) });
}
