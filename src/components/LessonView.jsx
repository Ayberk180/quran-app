/**
 * Renders an individual lesson: header (title, Arabic subtitle, description)
 * + phrase grid.
 *
 * Navigation text switches between English and Turkish via the language
 * toggle (see src/lib/i18n.jsx). Arabic content elements carry lang="ar"
 * for screen-reader semantics. RTL applied per-element, not to the whole
 * section.
 */
import PhraseButton from './PhraseButton.jsx';
import usePhrasePlayer from '../hooks/usePhrasePlayer.js';
import { useLanguage } from '../lib/i18n.jsx';

export default function LessonView({ lesson }) {
  const num = String(lesson.number).padStart(2, '0');
  const { playingId, locked, play } = usePhrasePlayer();
  const { t } = useLanguage();

  // A trailing group of 1 tile after filling 4-column rows looks orphaned;
  // pull the last 5 phrases into their own 5-column row instead.
  const hasOrphanTail = lesson.phrases.length % 4 === 1;
  const mainPhrases = hasOrphanTail ? lesson.phrases.slice(0, -5) : lesson.phrases;
  const tailPhrases = hasOrphanTail ? lesson.phrases.slice(-5) : [];

  return (
    <section className="lesson-view">
      {/* ── Back link ────────────────────────────────────────────────────── */}
      <a href="#/" className="back-link">
        <span className="back-link__arrow" aria-hidden="true">←</span>
        <span>{t('lesson.back')}</span>
      </a>

      {/* ── Lesson header ────────────────────────────────────────────────── */}
      <header className="lesson-view__header">
        <p className="lesson-view__number">{t('lesson.number', { n: num })}</p>

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
        <p className="empty-state">{t('lesson.empty')}</p>
      ) : (
        <>
          {/* dir="rtl" mirrors the physical book layout: phrase-001 is top-right */}
          <div className="phrase-grid" dir="rtl">
            {mainPhrases.map((phrase) => (
              <PhraseButton
                key={phrase.id}
                phrase={phrase}
                isPlaying={playingId === phrase.id}
                locked={locked}
                onPlay={play}
              />
            ))}
          </div>

          {/* Lesson 1 has 29 phrases (28 % 4 = 0 everywhere else); a lone
              trailing tile looks orphaned, so its last 5 phrases get their
              own 5-column row instead of 4 + 1. */}
          {tailPhrases.length > 0 && (
            <div className="phrase-grid phrase-grid--tail" dir="rtl">
              {tailPhrases.map((phrase) => (
                <PhraseButton
                  key={phrase.id}
                  phrase={phrase}
                  isPlaying={playingId === phrase.id}
                  locked={locked}
                  onPlay={play}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
