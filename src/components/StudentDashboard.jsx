/**
 * Student dashboard at #/me.
 *
 * Sections:
 *   — Welcome header (first name + sign-out)
 *   — Current lesson callout: lowest-numbered not-yet-passed lesson
 *   — Full 28-lesson grid showing passed vs not-passed via card modifier
 *
 * Progress data is fetched in App.jsx and passed in via props so it can be
 * shared with the home-page lesson list without a duplicate request.
 */
import { findCurrentLesson } from '../lib/progress.js';
import { signOut } from '../lib/auth.js';
import { navigate } from '../lib/router.js';

export default function StudentDashboard({ profile, manifest, progressMap }) {
  if (!manifest || !progressMap || !profile) return null;

  const lessons = manifest.lessons;
  const currentLesson = findCurrentLesson(lessons, progressMap);
  const passedCount = lessons.filter(
    (l) => progressMap.get(l.number) === 1,
  ).length;

  async function handleSignOut() {
    await signOut();
    navigate('#/');
  }

  return (
    <div className="student-dashboard">
      {/* ── Welcome header ─────────────────────────────────────────────── */}
      <header className="student-dashboard__header">
        <div>
          <h1 className="student-dashboard__title">
            <span lang="tr">Hoş geldin, {profile.first_name}</span>
            {` / Welcome back, ${profile.first_name}`}
          </h1>
          <p className="student-dashboard__meta">
            <span lang="tr">
              {passedCount}/{lessons.length} ders tamamlandı
            </span>
            <span className="app-header__sep" aria-hidden="true">·</span>
            <span>{passedCount}/{lessons.length} passed</span>
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

      {/* ── Current lesson callout ────────────────────────────────────── */}
      {currentLesson ? (
        <section className="student-dashboard__current">
          <span className="student-dashboard__label">
            <span lang="tr">Şu anki dersin</span>
            {' / Your current lesson'}
          </span>
          <a
            href={`#/${currentLesson.id}`}
            className="lesson-card lesson-card--current"
          >
            <span className="lesson-card__number">
              {String(currentLesson.number).padStart(2, '0')}
            </span>
            <span className="lesson-card__title">{currentLesson.title}</span>
            {currentLesson.title_ar && (
              <span className="lesson-card__title-ar" lang="ar">
                {currentLesson.title_ar}
              </span>
            )}
          </a>
        </section>
      ) : (
        <section className="student-dashboard__current">
          <p className="student-dashboard__complete">
            <span lang="tr">Tüm dersleri tamamladın! Maşaallah.</span>
            {' / You’ve passed every lesson. Masha’Allah.'}
          </p>
        </section>
      )}

      {/* ── All lessons grid ──────────────────────────────────────────── */}
      <section className="lesson-list" aria-label="All lessons">
        <span className="lesson-list__label" aria-hidden="true">
          <span lang="tr">Tüm dersler</span>
          {' / All lessons'}
        </span>

        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const status = progressMap.get(lesson.number) ?? 0;
            const isCompleted = status === 1;
            const isCurrent = currentLesson?.id === lesson.id;
            const num = String(lesson.number).padStart(2, '0');
            const phraseCount = lesson.phrases.length;

            const classes = [
              'lesson-card',
              isCompleted && 'lesson-card--completed',
              isCurrent && 'lesson-card--current',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <a key={lesson.id} className={classes} href={`#/${lesson.id}`}>
                <span className="lesson-card__number">{num}</span>
                <span className="lesson-card__title">{lesson.title}</span>
                {lesson.title_ar && (
                  <span className="lesson-card__title-ar" lang="ar">
                    {lesson.title_ar}
                  </span>
                )}
                {phraseCount > 0 && (
                  <span
                    className="lesson-card__count"
                    aria-label={`${phraseCount} phrases`}
                  >
                    <span lang="tr">{phraseCount} ifade</span>
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
