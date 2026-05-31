/**
 * Home screen: app header + lesson grid.
 *
 * When signed in as a student, each lesson card reflects pass state via the
 * .lesson-card--completed modifier. A small sign-in / dashboard link sits in
 * the header so the auth flow is discoverable.
 */
export default function LessonList({ manifest, profile, progressMap }) {
  const count = manifest.lessons.length;

  const authHref = !profile
    ? '#/login'
    : profile.role >= 2
    ? '#/instructor'
    : '#/me';
  const authLabelTr = !profile
    ? 'Giriş yap'
    : profile.role >= 2
    ? 'Yönetim'
    : 'Profilim';
  const authLabelEn = !profile
    ? 'Sign in'
    : profile.role >= 2
    ? 'Instructor'
    : 'My progress';

  return (
    <div>
      {/* ── App header ──────────────────────────────────────────────────── */}
      <header className="app-header">
        <a href={authHref} className="app-header__auth">
          <span lang="tr">{authLabelTr}</span>
          {' / '}
          <span>{authLabelEn}</span>
        </a>

        <h1 className="app-header__title">{manifest.title}</h1>

        <span className="app-header__accent" aria-hidden="true" />

        <p className="app-header__meta">
          <span lang="tr">{count} ders</span>
          <span className="app-header__sep" aria-hidden="true">·</span>
          <span>{count} lesson{count !== 1 ? 's' : ''}</span>
        </p>
      </header>

      {/* ── Lesson list section ─────────────────────────────────────────── */}
      <section className="lesson-list" aria-label="Lessons">
        <span className="lesson-list__label" aria-hidden="true">
          <span lang="tr">Dersler</span>
          {' / Lessons'}
        </span>

        <div className="lesson-grid">
          {manifest.lessons.map((lesson) => {
            const num = String(lesson.number).padStart(2, '0');
            const phraseCount = lesson.phrases.length;
            const isCompleted = progressMap?.get(lesson.number) === 1;

            return (
              <a
                key={lesson.id}
                className={
                  'lesson-card' + (isCompleted ? ' lesson-card--completed' : '')
                }
                href={`#/${lesson.id}`}
              >
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

      <footer className="app-footer">
        <a href="#/privacy">
          <span lang="tr">Gizlilik</span>
          {' / Privacy'}
        </a>
      </footer>
    </div>
  );
}
