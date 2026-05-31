const LESSON_HASH_RE         = /^#\/?(lesson-\d+)$/;
const INSTRUCTOR_STUDENT_RE  = /^#\/?instructor\/student\/([0-9a-f-]{36})$/i;
const PRINT_PIN_CARD_RE      = /^#\/?instructor\/student\/([0-9a-f-]{36})\/print-card$/i;

export function parseHash() {
  const hash = window.location.hash;

  if (hash === '' || hash === '#' || hash === '#/') {
    return { view: 'dashboard' };
  }
  if (hash === '#/login' || hash === '#login') {
    return { view: 'login' };
  }
  if (hash === '#/me' || hash === '#me') {
    return { view: 'student-dashboard' };
  }
  if (hash === '#/instructor' || hash === '#instructor') {
    return { view: 'instructor' };
  }
  if (hash === '#/instructor/print-consent') {
    return { view: 'print-consent' };
  }
  if (hash === '#/privacy' || hash === '#privacy') {
    return { view: 'privacy' };
  }

  const printPinMatch = hash.match(PRINT_PIN_CARD_RE);
  if (printPinMatch) {
    return { view: 'print-pin-card', studentId: printPinMatch[1] };
  }

  const studentMatch = hash.match(INSTRUCTOR_STUDENT_RE);
  if (studentMatch) {
    return { view: 'instructor-student', studentId: studentMatch[1] };
  }

  const lessonMatch = hash.match(LESSON_HASH_RE);
  if (lessonMatch) {
    return { view: 'lesson', lessonId: lessonMatch[1] };
  }

  return { view: 'dashboard' };
}

export function navigate(hash) {
  window.location.hash = hash;
}
