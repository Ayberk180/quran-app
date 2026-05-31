/**
 * Printable PIN card for a student.
 *
 * Plain HTML page that prints cleanly via the browser's Print dialog
 * (Ctrl/Cmd+P → Save as PDF or send to printer). No PDF library needed —
 * the browser's built-in PDF export covers the use case in the plan.
 */
import { useEffect, useState } from 'react';
import { fetchStudent } from '../lib/instructor.js';

export default function PrintPinCard({ studentId }) {
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchStudent(studentId).then(setStudent);
  }, [studentId]);

  useEffect(() => {
    if (student) document.title = `PIN — ${student.first_name}`;
    return () => { document.title = 'Masjid Quran Learning'; };
  }, [student]);

  if (!student) return null;

  const name =
    student.first_name +
    (student.last_initial ? ` ${student.last_initial}.` : '');

  return (
    <div className="print-page">
      <div className="print-controls">
        <a href={`#/instructor/student/${studentId}`}>
          <span lang="tr">Geri</span>{' / Back'}
        </a>
        <button type="button" onClick={() => window.print()}>
          <span lang="tr">Yazdır</span>
          {' / Print'}
        </button>
      </div>

      <article className="pin-card">
        <p className="pin-card__app">Masjid Quran Learning</p>
        <p className="pin-card__name">{name}</p>
        <p className="pin-card__label">
          <span lang="tr">PIN&rsquo;in</span>
          {' / Your PIN'}
        </p>
        <p className="pin-card__pin">{student.student_code}</p>
        <p className="pin-card__instructions">
          <span lang="tr">
            Uygulamayı açın, &ldquo;Giriş&rdquo;e dokunun, bu 6 rakamı yazın.
          </span>
          <br />
          Open the app, tap &ldquo;Sign In&rdquo;, then type these 6 digits.
        </p>
      </article>
    </div>
  );
}
