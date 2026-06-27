/**
 * Public privacy page at #/privacy. Lists exactly what the app stores and
 * what it doesn't. Mirrors the consent form so parents see the same info
 * on the website as on the paper form.
 */
import { useEffect } from 'react';

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Gizlilik / Privacy — Ulu Cami Quran Learning';
    return () => { document.title = 'Ulu Cami Quran Learning'; };
  }, []);

  return (
    <section className="lesson-view">
      <a href="#/" className="back-link">
        <span className="back-link__arrow" aria-hidden="true">←</span>
        <span>
          <span lang="tr">Geri</span>
          {' / Back'}
        </span>
      </a>

      <header className="lesson-view__header">
        <p className="lesson-view__number">
          <span lang="tr">Gizlilik</span>
          {' / Privacy'}
        </p>
        <h1 className="lesson-view__title">
          <span lang="tr">Hangi bilgileri saklıyoruz</span>
          {' / What we store'}
        </h1>
      </header>

      <div className="privacy-prose">
        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">
            <span lang="tr">Sadece şunları saklarız</span>
            {' / We only store'}
          </h2>
          <ul>
            <li>
              <span lang="tr">Öğrencinin adı (ve isteğe bağlı soyad baş harfi)</span>
              {' / the student\'s first name (and optional last initial)'}
            </li>
            <li>
              <span lang="tr">Sadece giriş için kullanılan 6 haneli PIN</span>
              {' / a 6-digit PIN used only for sign-in'}
            </li>
            <li>
              <span lang="tr">Öğretmenin geçti olarak işaretlediği dersler</span>
              {' / which lessons the instructor has marked as passed'}
            </li>
            <li>
              <span lang="tr">Her başarılı girişin tarih ve saati</span>
              {' / the date/time of each successful sign-in'}
            </li>
          </ul>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">
            <span lang="tr">Toplamadıklarımız</span>
            {' / We do not collect'}
          </h2>
          <p>
            <span lang="tr">
              E-posta, doğum tarihi, IP adresi, telefon numarası, fotoğraf veya
              uygulama dışındaki hiçbir bilgi.
            </span>
            <br />
            Email addresses, dates of birth, IP addresses, phone numbers,
            photos, or any data outside the app.
          </p>
          <p>
            <span lang="tr">Reklam ve takip yoktur.</span>
            {' '}
            There are no ads and no third-party tracking.
          </p>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">
            <span lang="tr">Ne kadar süre</span>
            {' / How long we keep it'}
          </h2>
          <p>
            <span lang="tr">
              Onayınızı geri çekene veya öğrenci programdan ayrılana kadar.
            </span>
            <br />
            Until you withdraw consent or the student leaves the program.
          </p>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">
            <span lang="tr">Onayı geri çekmek</span>
            {' / Withdrawing consent'}
          </h2>
          <p>
            <span lang="tr">
              Öğretmene başvurarak hesabın silinmesini isteyin; tüm kayıtlar
              silinecektir.
            </span>
            <br />
            Ask the instructor to delete the account; all records will be
            erased.
          </p>
        </section>
      </div>
    </section>
  );
}
