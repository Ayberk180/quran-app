import { useState, useEffect } from 'react';
import { loadManifest, findLesson } from './lib/manifest.js';
import { parseHash } from './lib/router.js';
import LessonList from './components/LessonList.jsx';
import LessonView from './components/LessonView.jsx';

export default function App() {
  const [manifest, setManifest] = useState(null);
  const [error, setError]       = useState(null);
  const [route, setRoute]       = useState(parseHash);

  // Load manifest once on mount
  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((err) => setError(err.message));
  }, []);

  // Keep route in sync with URL hash changes
  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Scroll to top on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (error) {
    return <p className="load-error">Failed to load lessons. Please refresh.</p>;
  }

  // Blank while loading — no spinner by design (project philosophy: calm, not busy)
  if (!manifest) return null;

  if (route.view === 'lesson') {
    const lesson = findLesson(manifest, route.lessonId);
    if (lesson) return <LessonView lesson={lesson} />;
  }

  return <LessonList manifest={manifest} />;
}
