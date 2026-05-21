/**
 * Renders an individual lesson: header (title, Arabic subtitle, description)
 * + phrase grid.
 *
 * Turkish / English bilingual navigation (Turkish first per PRODUCT.md).
 * Arabic content elements carry lang="ar" for screen-reader semantics.
 * RTL applied per-element, not to the whole section.
 */
import PhraseButton from './PhraseButton.jsx';

export default function LessonView({ lesson }) {
  const num = String(lesson.number).padStart(2, '0');

  return (
    <section className="lesson-view">
      {/* ── Back link ────────────────────────────────────────────────────── */}
      <a href="#/" className="back-link">
        <span className="back-link__arrow" aria-hidden="true">←</span>
        <span>
          <span lang="tr">Geri</span>
          {' / Back'}
        </span>
      </a>

      {/* ── Lesson header ────────────────────────────────────────────────── */}
      <header className="lesson-view__header">
        {/* Bilingual lesson number label */}
        <p className="lesson-view__number">
          <span lang="tr">Ders {num}</span>
          {` / Lesson ${num}`}
        </p>

        <h1 className="lesson-view__title">{lesson.title}</h1>

        {lesson.title_ar && (
          <p className="lesson-view__title-ar" lang="ar">
            {lesson.title_ar}
          </p>
        )}

        {lesson.description && (
          <p className="lesson-view__description">{lesson.description}</p>
        )}
      </header>

      {/* ── Phrase grid ──────────────────────────────────────────────────── */}
      {lesson.phrases.length === 0 ? (
        <p className="empty-state">
          <span lang="tr">Bu derste henüz ifade yok.</span>
          {'\nNo phrases yet for this lesson.'}
        </p>
      ) : (
        /* dir="rtl" mirrors the physical book layout: phrase-001 is top-right */
        <div className="phrase-grid" dir="rtl">
          {lesson.phrases.map((phrase) => (
            <PhraseButton key={phrase.id} phrase={phrase} />
          ))}
        </div>
      )}
    </section>
  );
}
