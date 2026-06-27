/**
 * Single phrase tile: an image button that plays its recording on click.
 * Presentational — playback and the grid-wide lock live in usePhrasePlayer
 * (lifted to LessonView). While another tile is playing this one is disabled.
 */
export default function PhraseButton({ phrase, isPlaying, locked, onPlay }) {
  return (
    <button
      type="button"
      className="phrase-tile"
      data-phrase-id={phrase.id}
      data-playing={isPlaying ? 'true' : undefined}
      aria-label={phrase.transliteration || phrase.id}
      aria-busy={isPlaying}
      disabled={locked && !isPlaying}
      onClick={() => onPlay(phrase)}
    >
      <img
        src={phrase.image}
        alt={phrase.transliteration || ''}
        loading="lazy"
      />
    </button>
  );
}
