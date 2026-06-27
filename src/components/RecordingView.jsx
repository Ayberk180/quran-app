/**
 * Admin audio recording tool at #/record.
 *
 * Lets the maintainer record a pronunciation clip per phrase, lesson by lesson,
 * straight in the browser: pick a lesson, click a phrase, Record, Stop, preview,
 * re-record if needed. "Download lesson" bundles every recorded clip into one
 * lesson-XX.zip (clips named phrase-YYY.<ext> so the asset pipeline links them
 * automatically). See scripts/optimize-assets.py + scripts/build-manifest.py for
 * the rest of the flow, and PROJECT_BRIEF.md §5.
 *
 * Admin-only (role 3) and only practically useful when run locally against the
 * dev server, since the output is files you commit to the repo.
 */
import { useEffect, useRef, useState } from 'react';
import { createRecorder, extensionForMime } from '../lib/recorder.js';
import { makeZip } from '../lib/zip.js';
import { signOut } from '../lib/auth.js';
import { navigate } from '../lib/router.js';

// Short pause between pressing Record and actually capturing, so the mouse
// click that started the take isn't picked up by the mic.
const START_DELAY_MS = 500;

export default function RecordingView({ manifest, profile }) {
  const lessons = manifest.lessons;
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '');
  // recordings: { [phraseId]: { blob, url, ext } }
  const [recordings, setRecordings] = useState({});
  const [recordingId, setRecordingId] = useState(null);
  const [preparing, setPreparing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState(null);
  const [zipping, setZipping] = useState(false);

  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const prepareRef = useRef(null);
  // Mirror recordings in a ref so unmount cleanup can revoke URLs without
  // touching state during teardown.
  const recordingsRef = useRef(recordings);
  recordingsRef.current = recordings;

  const lesson = lessons.find((l) => l.id === lessonId) ?? lessons[0];

  // Release the mic and any object URLs when the page unmounts.
  useEffect(() => {
    return () => {
      recorderRef.current?.close();
      clearInterval(timerRef.current);
      clearTimeout(prepareRef.current);
      Object.values(recordingsRef.current).forEach((r) => URL.revokeObjectURL(r.url));
    };
  }, []);

  async function ensureRecorder() {
    if (!recorderRef.current) {
      recorderRef.current = await createRecorder();
    }
    return recorderRef.current;
  }

  async function handleRecord(phraseId) {
    setError(null);
    try {
      const recorder = await ensureRecorder();
      setRecordingId(phraseId);
      setPreparing(true);
      setElapsed(0);
      // Hold off briefly so the mouse click isn't captured at the start.
      prepareRef.current = setTimeout(() => {
        setPreparing(false);
        recorder.start();
        const startedAt = Date.now();
        timerRef.current = setInterval(() => {
          setElapsed((Date.now() - startedAt) / 1000);
        }, 100);
      }, START_DELAY_MS);
    } catch (err) {
      setRecordingId(null);
      setPreparing(false);
      setError(err.message || 'Could not start recording.');
    }
  }

  async function handleStop(phraseId) {
    clearInterval(timerRef.current);
    try {
      const blob = await recorderRef.current.stop();
      const ext = extensionForMime(blob.type);
      setRecordings((prev) => {
        // Revoke a previous take for this phrase before replacing it.
        if (prev[phraseId]) URL.revokeObjectURL(prev[phraseId].url);
        return { ...prev, [phraseId]: { blob, url: URL.createObjectURL(blob), ext } };
      });
    } catch (err) {
      setError(err.message || 'Could not save recording.');
    } finally {
      setRecordingId(null);
    }
  }

  async function handleDownload() {
    const entries = Object.entries(recordings)
      .filter(([id]) => lesson.phrases.some((p) => p.id === id))
      .map(([id, rec]) => ({ name: `${id}.${rec.ext}`, blob: rec.blob }));
    if (entries.length === 0) return;

    setZipping(true);
    try {
      const zip = await makeZip(entries);
      const url = URL.createObjectURL(zip);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lesson.id}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Could not build the zip.');
    } finally {
      setZipping(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate('#/');
  }

  const recordedInLesson = lesson.phrases.filter((p) => recordings[p.id]).length;
  const total = lesson.phrases.length;

  return (
    <div className="record-view">
      <header className="record-view__header">
        <div>
          <h1 className="record-view__title">
            <span lang="tr">Ses kaydı</span>
            {' / Record Audio'}
          </h1>
          <p className="record-view__meta">
            {profile.first_name} ·{' '}
            <span lang="tr">yönetici aracı</span>
            {' / admin tool'}
          </p>
        </div>
        <button
          type="button"
          className="student-dashboard__signout"
          onClick={handleSignOut}
        >
          <span lang="tr">Çıkış</span>
          {' / Sign out'}
        </button>
      </header>

      <div className="record-view__controls">
        <label className="record-view__lesson-label">
          <span lang="tr">Ders</span>
          {' / Lesson'}
          <select
            className="record-view__select"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            disabled={recordingId != null}
          >
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.number}. {l.title}
              </option>
            ))}
          </select>
        </label>

        <div className="record-view__progress">
          {recordedInLesson}/{total}{' '}
          <span lang="tr">kaydedildi</span>
          {' / recorded'}
        </div>

        <button
          type="button"
          className="record-view__download"
          onClick={handleDownload}
          disabled={recordedInLesson === 0 || zipping || recordingId != null}
        >
          {zipping ? (
            <>… <span lang="tr">hazırlanıyor</span></>
          ) : (
            <>⬇ <span lang="tr">Dersi indir</span>{` / Download ${lesson.id}.zip`}</>
          )}
        </button>
      </div>

      {error && <p className="record-view__error">{error}</p>}

      <ul className="record-list">
        {lesson.phrases.map((phrase) => {
          const rec = recordings[phrase.id];
          const isRecording = recordingId === phrase.id;
          const otherRecording = recordingId != null && !isRecording;
          return (
            <li
              key={phrase.id}
              className="record-row"
              data-recorded={rec ? 'true' : 'false'}
            >
              <img className="record-row__img" src={phrase.image} alt="" />
              <div className="record-row__info">
                <span className="record-row__id">{phrase.id}</span>
                {phrase.transliteration && (
                  <span className="record-row__translit">{phrase.transliteration}</span>
                )}
              </div>

              <div className="record-row__actions">
                {isRecording && preparing ? (
                  <button type="button" className="record-row__prep" disabled>
                    <span lang="tr">Hazır olun…</span>
                    {' / Get ready…'}
                  </button>
                ) : isRecording ? (
                  <button
                    type="button"
                    className="record-row__stop"
                    onClick={() => handleStop(phrase.id)}
                  >
                    ⏹ <span lang="tr">Durdur</span> · {elapsed.toFixed(1)}s
                  </button>
                ) : (
                  <button
                    type="button"
                    className="record-row__record"
                    onClick={() => handleRecord(phrase.id)}
                    disabled={otherRecording}
                  >
                    ● {rec ? <span lang="tr">Tekrar</span> : <span lang="tr">Kaydet</span>}
                  </button>
                )}

                {rec && !isRecording && (
                  <audio className="record-row__audio" src={rec.url} controls />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
