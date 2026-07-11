/**
 * Home screen: app header + lesson grid.
 *
 * When signed in as a student, each lesson card reflects pass state via the
 * .lesson-card--completed modifier. A small sign-in / dashboard link sits in
 * the header so the auth flow is discoverable.
 */
import { useLanguage } from '../lib/i18n.jsx';

export default function LessonList({ manifest, profile, progressMap }) {
  const { t } = useLanguage();
  const count = manifest.lessons.length;

  const authHref = !profile
    ? '#/login'
    : profile.role >= 2
    ? '#/instructor'
    : '#/me';
  const authLabelKey = !profile
    ? 'home.auth.signIn'
    : profile.role >= 2
    ? 'home.auth.instructor'
    : 'home.auth.myProgress';

  return (
    <div>
      {/* ── App header ──────────────────────────────────────────────────── */}
      <header className="app-header">
        <a href={authHref} className="app-header__auth">
          {t(authLabelKey)}
        </a>

        <h1 className="app-header__title">{manifest.title}</h1>

        <span className="app-header__accent" aria-hidden="true" />

        <p className="app-header__meta">
          {t('home.lessonCount', { n: count, s: count !== 1 ? 's' : '' })}
        </p>
      </header>

      {/* ── Lesson list section ─────────────────────────────────────────── */}
      <section className="lesson-list" aria-label="Lessons">
        <span className="lesson-list__label" aria-hidden="true">
          {t('home.lessonsLabel')}
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
                    {t('home.phraseCount', { n: phraseCount, s: phraseCount !== 1 ? 's' : '' })}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </section>

      <footer className="app-footer">
        <a href="#/privacy">{t('footer.privacy')}</a>
      </footer>
    </div>
  );
}
