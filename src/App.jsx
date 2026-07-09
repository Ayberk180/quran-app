import { useState, useEffect } from 'react';
import { loadManifest, findLesson } from './lib/manifest.js';
import { parseHash, navigate } from './lib/router.js';
import { getProfile, onAuthChange } from './lib/auth.js';
import { fetchLessonProgress } from './lib/progress.js';
import { isConfigured } from './lib/supabase.js';
import LessonList from './components/LessonList.jsx';
import LessonView from './components/LessonView.jsx';
import LoginView from './components/LoginView.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import InstructorView from './components/InstructorView.jsx';
import InstructorStudentDetail from './components/InstructorStudentDetail.jsx';
import RecordingView from './components/RecordingView.jsx';
import PrintPinCard from './components/PrintPinCard.jsx';
import PrintConsentForm from './components/PrintConsentForm.jsx';
import PrivacyPage from './components/PrivacyPage.jsx';
import SignInPrompt from './components/SignInPrompt.jsx';

const AUTH_ROUTES = new Set([
  'student-dashboard',
  'instructor',
  'instructor-student',
  'print-pin-card',
  'print-consent',
  'record',
]);

export default function App() {
  const [manifest, setManifest]   = useState(null);
  const [error, setError]         = useState(null);
  const [route, setRoute]         = useState(parseHash);
  const [profile, setProfile]     = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [progressMap, setProgressMap] = useState(null);

  // Load manifest once on mount
  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((err) => setError(err.message));
  }, []);

  // Initial auth check + subscribe to changes
  useEffect(() => {
    let mounted = true;
    getProfile().then((p) => {
      if (!mounted) return;
      setProfile(p);
      setAuthReady(true);
    });
    const unsub = onAuthChange((p) => {
      if (mounted) setProfile(p);
    });
    return () => { mounted = false; unsub(); };
  }, []);

  // Fetch lesson progress when a student signs in. Empty Map for non-students
  // or signed-out users — keeps the lesson list visually unmarked.
  useEffect(() => {
    if (profile?.role === 1) {
      fetchLessonProgress(profile.id).then(setProgressMap);
    } else {
      setProgressMap(new Map());
    }
  }, [profile]);

  // Hash sync
  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Scroll to top on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // Redirect signed-in users away from /login to their home dashboard
  useEffect(() => {
    if (route.view === 'login' && authReady && profile) {
      navigate(profile.role >= 2 ? '#/instructor' : '#/me');
    }
  }, [route, authReady, profile]);

  // Gate auth-required routes
  useEffect(() => {
    if (AUTH_ROUTES.has(route.view) && authReady && !profile) {
      navigate('#/login');
    }
  }, [route, authReady, profile]);

  // Cross-role redirect: students don't see /instructor, staff don't see /me
  useEffect(() => {
    if (!profile) return;
    if (route.view === 'student-dashboard' && profile.role !== 1) {
      navigate('#/instructor');
    } else if (
      (route.view === 'instructor' || route.view === 'instructor-student') &&
      profile.role < 2
    ) {
      navigate('#/me');
    } else if (route.view === 'record' && profile.role !== 3) {
      // Recording tool is admin-only.
      navigate(profile.role >= 2 ? '#/instructor' : '#/me');
    }
  }, [route, profile]);

  if (error) {
    return <p className="load-error">Failed to load lessons. Please refresh.</p>;
  }

  if (route.view === 'login') {
    if (!isConfigured) {
      return (
        <p className="load-error">
          Sign-in is not configured. Set VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY in .env.local (see supabase/README.md).
        </p>
      );
    }
    return <LoginView />;
  }

  // Student dashboard at #/me
  if (route.view === 'student-dashboard') {
    if (!authReady || !profile) return null;
    if (profile.role !== 1) return null; // redirect effect will take over
    if (!manifest || !progressMap) return null;
    return (
      <StudentDashboard
        profile={profile}
        manifest={manifest}
        progressMap={progressMap}
      />
    );
  }

  // Instructor routes
  if (route.view === 'instructor') {
    if (!authReady || !profile) return null;
    if (profile.role < 2) return null; // redirect effect will take over
    return <InstructorView profile={profile} />;
  }

  if (route.view === 'instructor-student') {
    if (!authReady || !profile || !manifest) return null;
    if (profile.role < 2) return null;
    return (
      <InstructorStudentDetail
        studentId={route.studentId}
        profile={profile}
        manifest={manifest}
      />
    );
  }

  if (route.view === 'record') {
    if (!authReady || !profile || !manifest) return null;
    if (profile.role !== 3) return null; // redirect effect will take over
    return <RecordingView manifest={manifest} profile={profile} />;
  }

  if (route.view === 'print-pin-card') {
    if (!authReady || !profile) return null;
    if (profile.role < 2) return null;
    return <PrintPinCard studentId={route.studentId} />;
  }

  if (route.view === 'print-consent') {
    if (!authReady || !profile) return null;
    if (profile.role < 2) return null;
    return <PrintConsentForm />;
  }

  if (route.view === 'privacy') {
    return <PrivacyPage />;
  }

  // Blank while loading
  if (!manifest) return null;

  if (route.view === 'lesson') {
    const lesson = findLesson(manifest, route.lessonId);
    if (lesson) return <LessonView key={lesson.id} lesson={lesson} />;
  }

  return (
    <>
      <LessonList
        manifest={manifest}
        profile={profile}
        progressMap={progressMap}
      />
      {authReady && !profile && <SignInPrompt />}
    </>
  );
}
