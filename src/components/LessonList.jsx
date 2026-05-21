/**
 * Home screen: app header + lesson grid.
 *
 * Visual intention:
 *   — The app header is spare: title, a narrow Pine accent mark, lesson count.
 *   — Each lesson card is a numbered chapter tile. The number (2.5rem, heavy)
 *     is the hero. The title is secondary, muted. The Arabic subtitle anchors
 *     the card base when present.
 *
 * Turkish / English bilingual throughout. Arabic elements carry lang="ar".
 */
export default function LessonList({ manifest }) {
  const count = manifest.lessons.length;

  return (
    <div>
      {/* ── App header ──────────────────────────────────────────────────── */}
      <header className="app-header">
        <h1 className="app-header__title">{manifest.title}</h1>

        {/* Narrow Pine rule — the only Pine visible at rest on the home screen */}
        <span className="app-header__accent" aria-hidden="true" />

        {/* Bilingual lesson count */}
        <p className="app-header__meta">
          <span lang="tr">{count} ders</span>
          <span className="app-header__sep" aria-hidden="true">·</span>
          <span>{count} lesson{count !== 1 ? 's' : ''}</span>
        </p>
      </header>

      {/* ── Lesson list section ─────────────────────────────────────────── */}
      <section className="lesson-list" aria-label="Lessons">
        {/* Bilingual section label — decorative, sandwiched in thin rules via CSS */}
        <span className="lesson-list__label" aria-hidden="true">
          <span lang="tr">Dersler</span>
          {' / Lessons'}
        </span>

        <div className="lesson-grid">
          {manifest.lessons.map((lesson) => {
            const num = String(lesson.number).padStart(2, '0');
            const phraseCount = lesson.phrases.length;

            return (
              <a key={lesson.id} className="lesson-card" href={`#/${lesson.id}`}>
                {/* Large number — the tile's identity */}
                <span className="lesson-card__number">{num}</span>

                {/* Title — secondary to the number */}
                <span className="lesson-card__title">{lesson.title}</span>

                {/* Arabic subtitle — anchored to card bottom via CSS margin-top: auto */}
                {lesson.title_ar && (
                  <span className="lesson-card__title-ar" lang="ar">
                    {lesson.title_ar}
                  </span>
                )}

                {/* Phrase count — visible bottom anchor when no Arabic title present */}
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
