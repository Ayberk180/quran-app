/**
 * Thin wrapper around getUserMedia + MediaRecorder for the admin recording tool.
 *
 * Records short speech clips in the browser and hands back a Blob. The mic stream
 * is opened once per recorder and reused across takes, so the browser only prompts
 * for permission a single time per page visit.
 *
 * Output is webm/opus where supported — it's the only format MediaRecorder produces
 * reliably across browsers, and it's the *intermediate* format anyway. The asset
 * pipeline (scripts/optimize-assets.py) transcodes it to mp3 64k mono, which is the
 * format actually shipped to students (iOS / Capacitor safe).
 *
 * Requires a secure context (getUserMedia is blocked on plain http). localhost — the
 * dev server — counts as secure, which is all this maintainer-only tool needs.
 */

// Preferred capture types, best first. We fall back to the browser default if none
// are reported as supported.
const PREFERRED_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
];

/** File extension to use when saving a blob of the given mime type. */
export function extensionForMime(mimeType) {
  if (!mimeType) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'm4a';
  return 'webm';
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const type of PREFERRED_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return ''; // let the browser choose
}

/**
 * Create a recorder bound to a fresh mic stream.
 *
 * @returns {Promise<{
 *   start: () => void,
 *   stop: () => Promise<Blob>,
 *   mimeType: string,
 *   close: () => void,
 * }>}
 */
export async function createRecorder() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone capture is not supported in this browser.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = pickMimeType();

  let recorder = null;
  let chunks = [];

  function start() {
    chunks = [];
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.start();
  }

  function stop() {
    return new Promise((resolve, reject) => {
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Recorder is not running.'));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' });
        chunks = [];
        resolve(blob);
      };
      recorder.stop();
    });
  }

  // Release the mic when the page is done with this recorder.
  function close() {
    stream.getTracks().forEach((t) => t.stop());
  }

  return { start, stop, mimeType: mimeType || 'audio/webm', close };
}
