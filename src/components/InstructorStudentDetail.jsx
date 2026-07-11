/**
 * Per-student detail at #/instructor/student/:id.
 *
 *   — Header: student name + passed count + PIN
 *   — Lesson grid (clickable to toggle passed ↔ not_passed)
 *   — Login frequency: range pills + a simple CSS bar chart
 *
 * Optimistic updates on toggle; rolls back on error.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  fetchStudent,
  fetchStudentLessonProgress,
  fetchLoginEvents,
  setLessonStatus,
  updateStudentName,
} from '../lib/instructor.js';
import { deleteStudent } from '../lib/admin.js';
import { useLanguage } from '../lib/i18n.jsx';

const RANGES = [
  { key: '7d',   days: 7,   label: '7d' },
  { key: '30d',  days: 30,  label: '30d' },
  { key: '90d',  days: 90,  label: '90d' },
  { key: '180d', days: 180, label: '180d' },
  { key: '365d', days: 365, label: '1y' },
];

export default function InstructorStudentDetail({ studentId, profile, manifest }) {
  const { t } = useLanguage();
  const [student, setStudent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loginEvents, setLoginEvents] = useState(null);
  const [range, setRange] = useState('30d');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchStudent(studentId),
      fetchStudentLessonProgress(studentId),
    ]).then(([s, p]) => {
      if (!mounted) return;
      setStudent(s);
      setProgress(p);
    });
    return () => { mounted = false; };
  }, [studentId]);

  useEffect(() => {
    const r = RANGES.find((x) => x.key === range);
    if (!r) return;
    const since = new Date(Date.now() - r.days * 86400000).toISOString();
    setLoginEvents(null);
    fetchLoginEvents(studentId, since).then(setLoginEvents);
  }, [studentId, range]);

  const buckets = useMemo(() => {
    if (!loginEvents) return [];
    const r = RANGES.find((x) => x.key === range);
    if (!r) return [];
    return computeBuckets(loginEvents, r.days);
  }, [loginEvents, range]);

  async function toggleLesson(lessonNum) {
    if (saving) return;
    const cur = progress?.get(lessonNum)?.status ?? 0;
    const next = cur === 1 ? 0 : 1;

    const snapshot = progress;
    const optimistic = new Map(progress);
    optimistic.set(lessonNum, {
      lesson_id: lessonNum,
      status: next,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    });
    setProgress(optimistic);
    setSaving(true);
    try {
      await setLessonStatus(studentId, lessonNum, next, profile.id);
    } catch (e) {
      console.error('[instructor] update failed', e);
      setProgress(snapshot);
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    setEditFirst(student.first_name);
    setEditLast(student.last_name ?? '');
    setNameError('');
    setEditing(true);
  }

  async function saveName(e) {
    e.preventDefault();
    const first = editFirst.trim();
    if (!first) { setNameError(t('studentDetail.error.firstName')); return; }
    setSaving(true);
    setNameError('');
    try {
      await updateStudentName(studentId, { first_name: first, last_name: editLast.trim() });
      setStudent((s) => ({ ...s, first_name: first, last_name: editLast.trim() || null }));
      setEditing(false);
    } catch (err) {
      setNameError(err.message || t('studentDetail.error.saveName'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setDeleteError('');
    try {
      await deleteStudent(studentId);
      window.location.hash = '#/instructor';
    } catch (err) {
      setDeleteError(err.message || t('studentDetail.error.delete'));
      setSaving(false);
      setConfirmDelete(false);
    }
  }

  if (!student || !progress || !manifest) return null;

  const lessons = manifest.lessons;
  const passedCount = [...progress.values()].filter((r) => r.status === 1).length;

  return (
    <div className="instructor-detail">
      <a href="#/instructor" className="back-link">
        <span className="back-link__arrow" aria-hidden="true">←</span>
        <span>{t('studentDetail.back')}</span>
      </a>

      <header className="instructor-detail__header">
        {editing ? (
          <form className="name-edit" onSubmit={saveName}>
            <input
              className="name-edit__input"
              value={editFirst}
              onChange={(e) => setEditFirst(e.target.value)}
              maxLength={80}
              placeholder={t('studentDetail.firstNamePh')}
              autoFocus
              required
            />
            <input
              className="name-edit__input"
              value={editLast}
              onChange={(e) => setEditLast(e.target.value)}
              maxLength={80}
              placeholder={t('studentDetail.lastNamePh')}
            />
            {nameError && <p className="name-edit__error" role="alert">{nameError}</p>}
            <div className="name-edit__actions">
              <button type="submit" className="name-edit__btn name-edit__btn--save" disabled={saving}>
                {saving ? t('studentDetail.saving') : t('studentDetail.save')}
              </button>
              <button type="button" className="name-edit__btn" onClick={() => setEditing(false)} disabled={saving}>
                {t('studentDetail.cancel')}
              </button>
            </div>
          </form>
        ) : (
          <h1 className="instructor-detail__title">
            {student.first_name}
            {student.last_name
              ? ` ${student.last_name}`
              : student.last_initial ? ` ${student.last_initial}.` : ''}
            <button
              type="button"
              className="name-edit__trigger"
              onClick={startEditing}
              aria-label={t('studentDetail.editName')}
            >
              ✎
            </button>
          </h1>
        )}
        <p className="instructor-detail__meta">
          {student.student_code && (
            <>
              {t('studentDetail.pinLabel')} <code>{student.student_code}</code>
              {' · '}
            </>
          )}
          {t('studentDetail.passedOf', { n: passedCount, total: lessons.length })}
        </p>

        {profile.role === 3 && (
          <div className="student-delete">
            {confirmDelete ? (
              <>
                <p className="student-delete__confirm-msg">
                  {t('studentDetail.confirmDelete', { name: student.first_name })}
                </p>
                <div className="student-delete__actions">
                  <button
                    type="button"
                    className="student-delete__btn student-delete__btn--confirm"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    {saving ? t('studentDetail.deleting') : t('studentDetail.yesDelete')}
                  </button>
                  <button
                    type="button"
                    className="student-delete__btn"
                    onClick={() => setConfirmDelete(false)}
                    disabled={saving}
                  >
                    {t('studentDetail.cancel')}
                  </button>
                </div>
                {deleteError && <p className="student-delete__error" role="alert">{deleteError}</p>}
              </>
            ) : (
              <button
                type="button"
                className="student-delete__btn student-delete__btn--danger"
                onClick={() => setConfirmDelete(true)}
              >
                {t('studentDetail.deleteStudent')}
              </button>
            )}
          </div>
        )}
      </header>

      {/* ── Lessons (clickable) ─────────────────────────────────────── */}
      <section className="instructor-detail__section">
        <span className="lesson-list__label">{t('studentDetail.lessonsToggle')}</span>

        <div className="lesson-grid lesson-grid--clickable">
          {lessons.map((l) => {
            const status = progress.get(l.number)?.status ?? 0;
            const isCompleted = status === 1;
            const num = String(l.number).padStart(2, '0');
            return (
              <button
                key={l.id}
                type="button"
                className={
                  'lesson-card' + (isCompleted ? ' lesson-card--completed' : '')
                }
                onClick={() => toggleLesson(l.number)}
                disabled={saving}
                aria-pressed={isCompleted}
              >
                <span className="lesson-card__number">{num}</span>
                <span className="lesson-card__title">{l.title}</span>
                {l.title_ar && (
                  <span className="lesson-card__title-ar" lang="ar">
                    {l.title_ar}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Login frequency ─────────────────────────────────────────── */}
      <section className="instructor-detail__section">
        <span className="lesson-list__label">{t('studentDetail.loginFrequency')}</span>

        <div className="range-selector" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={range === r.key}
              className={
                'range-selector__pill' +
                (range === r.key ? ' range-selector__pill--active' : '')
              }
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loginEvents === null ? (
          <p className="empty-state">{t('studentDetail.loading')}</p>
        ) : buckets.length === 0 || buckets.every((b) => b.count === 0) ? (
          <p className="empty-state">{t('studentDetail.noLogins')}</p>
        ) : (
          <LoginChart buckets={buckets} t={t} />
        )}
      </section>
    </div>
  );
}

function LoginChart({ buckets, t }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="login-chart" aria-label="Login frequency chart">
      <div className="login-chart__bars">
        {buckets.map((b) => (
          <div key={b.key} className="login-chart__bar-wrap">
            {b.count > 0 && (
              <span className="login-chart__bar-value">{b.count}</span>
            )}
            <div
              className="login-chart__bar"
              style={{ height: `${(b.count / max) * 100}%` }}
              title={t('studentDetail.loginCount', {
                n: b.count,
                s: b.count !== 1 ? 's' : '',
                label: b.isWeekly
                  ? t('studentDetail.weekEnding', { date: b.dateLabel })
                  : b.dateLabel,
              })}
            />
          </div>
        ))}
      </div>
      <div className="login-chart__labels">
        {buckets.map((b, i) => (
          <span key={b.key} className="login-chart__label">
            {i % Math.max(1, Math.floor(buckets.length / 7)) === 0 ? b.shortLabel : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Bucket events into daily (≤30d) or weekly (>30d) windows. */
function computeBuckets(events, days) {
  const useDaily = days <= 30;
  const bucketDays = useDaily ? 1 : 7;
  const count = useDaily ? days : Math.ceil(days / 7);
  const now = Date.now();
  const bucketMs = bucketDays * 86400000;

  const buckets = [];
  for (let i = count - 1; i >= 0; i--) {
    const end = now - i * bucketMs;
    const start = end - bucketMs;
    const endDate = new Date(end);
    buckets.push({
      key: i,
      start,
      end,
      count: 0,
      shortLabel: useDaily
        ? endDate.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
        : endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      isWeekly: !useDaily,
      dateLabel: endDate.toLocaleDateString(),
    });
  }

  for (const e of events) {
    const t = new Date(e.signed_in_at).getTime();
    for (const b of buckets) {
      if (t >= b.start && t < b.end) {
        b.count++;
        break;
      }
    }
  }
  return buckets;
}
