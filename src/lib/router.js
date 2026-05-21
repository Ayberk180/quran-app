const LESSON_HASH_RE = /^#\/?(lesson-\d+)$/;

export function parseHash() {
  const hash = window.location.hash;
  const match = hash.match(LESSON_HASH_RE);
  if (match) {
    return { view: 'lesson', lessonId: match[1] };
  }
  return { view: 'dashboard' };
}

export function navigate(hash) {
  window.location.hash = hash;
}
