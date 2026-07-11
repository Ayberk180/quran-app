/**
 * Minimal EN/TR language toggle — no i18n library. Dictionary entries are
 * colocated { en, tr } pairs keyed by short dot-path ids, so a non-developer
 * maintainer can find and edit both languages for a string in one place.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const LANG_KEY = 'qapp:lang';

export const STRINGS = {
  // ── Lesson list (home) ──────────────────────────────────────────────────
  'home.auth.signIn':      { en: 'Sign in',       tr: 'Giriş yap' },
  'home.auth.instructor':  { en: 'Instructor',    tr: 'Yönetim' },
  'home.auth.myProgress':  { en: 'My progress',   tr: 'Profilim' },
  'home.lessonCount':      { en: '{n} lesson{s}',  tr: '{n} ders' },
  'home.lessonsLabel':     { en: 'Lessons',        tr: 'Dersler' },
  'home.phraseCount':      { en: '{n} phrase{s}',  tr: '{n} ifade' },
  'footer.privacy':        { en: 'Privacy',        tr: 'Gizlilik' },

  // ── Lesson view ──────────────────────────────────────────────────────────
  'lesson.back':           { en: 'Back',                             tr: 'Geri' },
  'lesson.number':         { en: 'Lesson {n}',                       tr: 'Ders {n}' },
  'lesson.empty':          { en: 'No phrases yet for this lesson.',  tr: 'Bu derste henüz ifade yok.' },

  // ── Login ────────────────────────────────────────────────────────────────
  'login.title.student':      { en: 'Sign In',              tr: 'Giriş' },
  'login.title.instructor':   { en: 'Instructor Sign In',   tr: 'Öğretmen Girişi' },
  'login.switchTo.instructor':{ en: 'Instructor sign-in',   tr: 'Öğretmen girişi' },
  'login.switchTo.student':   { en: 'Student sign-in',      tr: 'Öğrenci girişi' },
  'login.backspace':          { en: 'Backspace',            tr: 'Sil' },
  'login.submitPin':          { en: 'Submit PIN',           tr: 'PIN gönder' },
  'login.email':               { en: 'Email',               tr: 'E-posta' },
  'login.password':            { en: 'Password',            tr: 'Şifre' },
  'login.signingIn':           { en: 'Signing in…',         tr: 'Giriş yapılıyor…' },
  'login.signIn':               { en: 'Sign in',            tr: 'Giriş yap' },
  'login.error.failed':         { en: 'Sign-in failed',     tr: 'Giriş başarısız' },

  // ── Sign-in prompt (modal) ───────────────────────────────────────────────
  'signInPrompt.title':    { en: 'Sign in',                                     tr: 'Giriş yap' },
  'signInPrompt.hint':     { en: 'Sign in to save your progress across lessons.', tr: 'İlerlemeni kaydetmek için giriş yap.' },
  'signInPrompt.notNow':   { en: 'Not now',                                     tr: 'Şimdi değil' },

  // ── Student dashboard ────────────────────────────────────────────────────
  'dashboard.welcome':          { en: 'Welcome back, {name}',   tr: 'Hoş geldin, {name}' },
  'dashboard.passedProgress':   { en: '{passed}/{total} passed', tr: '{passed}/{total} ders tamamlandı' },
  'dashboard.currentLesson':    { en: 'Your current lesson',    tr: 'Şu anki dersin' },
  'dashboard.allDone':          { en: 'You’ve passed every lesson. Masha’Allah.', tr: 'Tüm dersleri tamamladın! Maşaallah.' },
  'dashboard.allLessons':       { en: 'All lessons',            tr: 'Tüm dersler' },
  'dashboard.signOut':          { en: 'Sign out',                tr: 'Çıkış' },

  // ── Instructor portal ────────────────────────────────────────────────────
  'instructor.title':        { en: 'Instructor Portal',   tr: 'Yönetim' },
  'instructor.studentCount': { en: '{name} · {n} student{s}', tr: '{name} · {n} öğrenci' },
  'instructor.signOut':      { en: 'Sign out',             tr: 'Çıkış' },
  'instructor.addStudent':   { en: '+ Add Student',        tr: '+ Öğrenci ekle' },
  'instructor.consentForm':  { en: 'Consent form',         tr: 'Veli izin formu' },
  'instructor.recordAudio':  { en: 'Record audio',         tr: 'Ses kaydı' },
  'instructor.studentsLabel':{ en: 'Students',             tr: 'Öğrenciler' },
  'instructor.emptyRoster':  { en: 'No students yet. Click "+ Add Student" to begin.', tr: 'Henüz öğrenci eklenmedi. Başlamak için "+ Öğrenci ekle"ye tıklayın.' },
  'instructor.col.name':     { en: 'Name',                 tr: 'İsim' },
  'instructor.col.current':  { en: 'Current',              tr: 'Şu an' },
  'instructor.col.passed':   { en: 'Passed',                tr: 'Geçti' },
  'instructor.col.lastSeen': { en: 'Last seen',             tr: 'Son giriş' },
  'instructor.lessonN':      { en: 'Lesson {n}',           tr: 'Ders {n}' },
  'instructor.complete':     { en: '— complete —',         tr: '— tamamlandı —' },
  'instructor.lastSeen.now':      { en: 'just now',        tr: 'az önce' },
  'instructor.lastSeen.minsAgo':  { en: '{n}m ago',        tr: '{n}dk önce' },
  'instructor.lastSeen.hoursAgo': { en: '{n}h ago',        tr: '{n}sa önce' },
  'instructor.lastSeen.daysAgo':  { en: '{n}d ago',        tr: '{n}g önce' },
  'instructor.lastSeen.monthsAgo':{ en: '{n}mo ago',       tr: '{n}ay önce' },
  'instructor.lastSeen.yearsAgo': { en: '{n}y ago',        tr: '{n}yıl önce' },

  // ── Add student form ─────────────────────────────────────────────────────
  'addStudent.title':           { en: 'Add Student',                    tr: 'Yeni öğrenci' },
  'addStudent.hint':            { en: 'Parents must sign the consent form before you save the student.', tr: 'Velinin onayını kayıttan önce yazılı olarak alın.' },
  'addStudent.printBlank':      { en: 'Print blank form',               tr: 'Boş formu yazdır' },
  'addStudent.firstName':       { en: 'First name',                     tr: 'Ad' },
  'addStudent.lastName':        { en: 'Last name (optional)',           tr: 'Soyad' },
  'addStudent.consentLabel':    { en: 'I have collected the parent’s signed consent form.', tr: 'Velinin imzaladığı izin formunu aldım.' },
  'addStudent.error.firstName': { en: 'First name required',            tr: 'Ad gerekli' },
  'addStudent.error.consent':   { en: 'Parental consent must be confirmed', tr: 'Veli onayı onaylanmalı' },
  'addStudent.error.failed':    { en: 'Failed to add student',          tr: 'Öğrenci eklenemedi' },
  'addStudent.save':            { en: 'Save',                           tr: 'Kaydet' },
  'addStudent.saving':          { en: 'Saving…',                        tr: 'Kaydediliyor…' },
  'addStudent.cancel':          { en: 'Cancel',                         tr: 'İptal' },
  'addStudent.added':           { en: 'Added',                          tr: 'Eklendi' },
  'addStudent.pinLabel':        { en: 'PIN',                            tr: 'PIN' },
  'addStudent.copy':            { en: 'Copy',                           tr: 'Kopyala' },
  'addStudent.copied':          { en: 'Copied!',                        tr: 'Kopyalandı!' },
  'addStudent.writeDown':       { en: 'Write this down — it won’t be shown again.', tr: 'Bunu yazın — bir daha gösterilmeyecek.' },
  'addStudent.printPinCard':    { en: 'Print PIN card',                 tr: 'PIN kartını yazdır' },
  'addStudent.done':            { en: 'Done',                           tr: 'Tamam' },

  // ── Instructor student detail ────────────────────────────────────────────
  'studentDetail.back':          { en: 'Back to roster',      tr: 'Listeye dön' },
  'studentDetail.firstNamePh':   { en: 'First name',          tr: 'Ad' },
  'studentDetail.lastNamePh':    { en: 'Last name (optional)', tr: 'Soyad (opsiyonel)' },
  'studentDetail.saving':        { en: 'Saving…',             tr: 'Kaydediliyor…' },
  'studentDetail.save':          { en: 'Save',                tr: 'Kaydet' },
  'studentDetail.cancel':        { en: 'Cancel',              tr: 'İptal' },
  'studentDetail.editName':      { en: 'Edit name',           tr: 'Adı düzenle' },
  'studentDetail.error.firstName': { en: 'First name is required', tr: 'Ad gerekli' },
  'studentDetail.error.saveName':  { en: 'Failed to save',    tr: 'Kaydedilemedi' },
  'studentDetail.error.delete':    { en: 'Failed to delete student', tr: 'Öğrenci silinemedi' },
  'studentDetail.pinLabel':      { en: 'PIN',                 tr: 'PIN' },
  'studentDetail.passedOf':      { en: '{n}/{total} passed',  tr: '{n}/{total} geçti' },
  'studentDetail.deleting':      { en: 'Deleting…',           tr: 'Siliniyor…' },
  'studentDetail.deleteStudent': { en: 'Delete student',      tr: 'Öğrenciyi sil' },
  'studentDetail.confirmDelete': { en: 'Delete {name}? This cannot be undone.', tr: '{name} silinsin mi? Bu işlem geri alınamaz.' },
  'studentDetail.yesDelete':     { en: 'Yes, delete',         tr: 'Evet, sil' },
  'studentDetail.lessonsToggle': { en: 'Lessons — click to toggle', tr: 'Dersler — geçiş için tıklayın' },
  'studentDetail.loginFrequency':{ en: 'Login frequency',     tr: 'Giriş sıklığı' },
  'studentDetail.loading':       { en: 'Loading…',            tr: 'Yükleniyor…' },
  'studentDetail.noLogins':      { en: 'No logins in this range.', tr: 'Bu aralıkta giriş yok.' },
  'studentDetail.loginCount':    { en: '{n} login{s} — {label}', tr: '{n} giriş — {label}' },
  'studentDetail.weekEnding':    { en: 'week ending {date}',  tr: '{date} biten hafta' },

  // ── Recording view (admin tool) ──────────────────────────────────────────
  'recording.title':           { en: 'Record Audio',        tr: 'Ses kaydı' },
  'recording.adminTool':       { en: 'admin tool',          tr: 'yönetici aracı' },
  'recording.signOut':         { en: 'Sign out',            tr: 'Çıkış' },
  'recording.lesson':          { en: 'Lesson',              tr: 'Ders' },
  'recording.recorded':        { en: '{n}/{total} recorded', tr: '{n}/{total} kaydedildi' },
  'recording.preparing':       { en: '… preparing',         tr: '… hazırlanıyor' },
  'recording.download':        { en: 'Download {file}',     tr: 'Dersi indir' },
  'recording.getReady':        { en: 'Get ready…',          tr: 'Hazır olun…' },
  'recording.stop':            { en: 'Stop',                tr: 'Durdur' },
  'recording.retry':           { en: 'Retry',               tr: 'Tekrar' },
  'recording.record':          { en: 'Record',              tr: 'Kaydet' },
  'recording.error.start':     { en: 'Could not start recording.', tr: 'Kayıt başlatılamadı.' },
  'recording.error.save':      { en: 'Could not save recording.',  tr: 'Kayıt kaydedilemedi.' },
  'recording.error.zip':       { en: 'Could not build the zip.',   tr: 'Zip oluşturulamadı.' },

  // ── Privacy page ─────────────────────────────────────────────────────────
  'privacy.docTitle':      { en: 'Privacy — Ulu Cami Quran Learning', tr: 'Gizlilik — Ulu Cami Quran Learning' },
  'privacy.label':         { en: 'Privacy',              tr: 'Gizlilik' },
  'privacy.heading':       { en: 'What we store',        tr: 'Hangi bilgileri saklıyoruz' },
  'privacy.store.heading': { en: 'We only store',        tr: 'Sadece şunları saklarız' },
  'privacy.store.name':    { en: "The student's first name (and optional last initial)", tr: 'Öğrencinin adı (ve isteğe bağlı soyad baş harfi)' },
  'privacy.store.pin':     { en: 'A 6-digit PIN used only for sign-in', tr: 'Sadece giriş için kullanılan 6 haneli PIN' },
  'privacy.store.lessons': { en: 'Which lessons the instructor has marked as passed', tr: 'Öğretmenin geçti olarak işaretlediği dersler' },
  'privacy.store.logins':  { en: 'The date/time of each successful sign-in', tr: 'Her başarılı girişin tarih ve saati' },
  'privacy.notCollect.heading': { en: 'We do not collect', tr: 'Toplamadıklarımız' },
  'privacy.notCollect.body':    { en: 'Email addresses, dates of birth, IP addresses, phone numbers, photos, or any data outside the app.', tr: 'E-posta, doğum tarihi, IP adresi, telefon numarası, fotoğraf veya uygulama dışındaki hiçbir bilgi.' },
  'privacy.notCollect.ads':     { en: 'There are no ads and no third-party tracking.', tr: 'Reklam ve takip yoktur.' },
  'privacy.retention.heading':  { en: 'How long we keep it', tr: 'Ne kadar süre' },
  'privacy.retention.body':     { en: 'Until you withdraw consent or the student leaves the program.', tr: 'Onayınızı geri çekene veya öğrenci programdan ayrılana kadar.' },
  'privacy.withdraw.heading':   { en: 'Withdrawing consent', tr: 'Onayı geri çekmek' },
  'privacy.withdraw.body':      { en: 'Ask the instructor to delete the account; all records will be erased.', tr: 'Öğretmene başvurarak hesabın silinmesini isteyin; tüm kayıtlar silinecektir.' },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(LANG_KEY) === 'tr' ? 'tr' : 'en';
    } catch {
      return 'en';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* storage blocked — language just won't persist */
    }
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key, vars) => {
    const entry = STRINGS[key];
    if (!entry) {
      console.warn(`Missing translation key: ${key}`);
      return key;
    }
    let str = entry[lang] ?? entry.en;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, v);
      }
    }
    return str;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
