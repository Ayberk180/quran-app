/**
 * Single phrase tile: image button that will play audio on click.
 * Audio wiring is Phase 2 — the click handler is a stub for now.
 */
export default function PhraseButton({ phrase }) {
  function handleClick() {
    // TODO (Phase 2): play phrase.audio, set data-playing="true" while playing
    console.log('phrase clicked', phrase);
  }

  return (
    <button
      type="button"
      className="phrase-tile"
      data-phrase-id={phrase.id}
      aria-label={phrase.transliteration || phrase.id}
      onClick={handleClick}
    >
      <img
        src={phrase.image}
        alt={phrase.transliteration || ''}
        loading="lazy"
      />
    </button>
  );
}
