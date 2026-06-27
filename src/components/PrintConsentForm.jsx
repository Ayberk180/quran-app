/**
 * Printable parental consent form. Bilingual (Turkish + English).
 *
 * This is a template — the masjid should review and adjust the wording for
 * their jurisdiction. The data list reflects exactly what the app stores
 * (see supabase/migrations/0001_init.sql).
 */
import { useEffect } from 'react';

export default function PrintConsentForm() {
  useEffect(() => {
    document.title = 'Veli Onayı / Parental Consent — Ulu Cami Quran Learning';
    return () => { document.title = 'Ulu Cami Quran Learning'; };
  }, []);

  return (
    <div className="print-page">
      <div className="print-controls">
        <a href="#/instructor">
          <span lang="tr">Geri</span>{' / Back'}
        </a>
        <button type="button" onClick={() => window.print()}>
          <span lang="tr">Yazdır</span>
          {' / Print'}
        </button>
      </div>

      <article className="consent-form">
        <h1>
          <span lang="tr">Veli Onayı</span>
          {' / Parental Consent'}
        </h1>
        <p className="consent-form__app">Ulu Cami Quran Learning</p>

        <section>
          <h2>
            <span lang="tr">Uygulama hakkında</span>
            {' / About the app'}
          </h2>
          <p lang="tr">
            Ulu Cami Quran Learning uygulaması, çocuğunuzun camide kullandığı
            Kaide kitabındaki ifadeleri kendi hızında öğrenmesine yardımcı olur.
            Her ders, ifadelerin kısa ses kayıtlarını içerir.
          </p>
          <p>
            The Ulu Cami Quran Learning app helps your child learn Quranic phrases
            at their own pace. Each lesson contains short audio recordings of
            phrases from the Qaida book used at the masjid.
          </p>
        </section>

        <section>
          <h2>
            <span lang="tr">Topladığımız bilgiler</span>
            {' / What we collect'}
          </h2>
          <ul>
            <li>
              <span lang="tr">Çocuğunuzun adı (ve isteğe bağlı soyadın baş harfi)</span>
              {' / your child’s first name (and optional last initial)'}
            </li>
            <li>
              <span lang="tr">Sadece giriş için kullanılan 6 haneli bir PIN</span>
              {' / a 6-digit PIN used only for sign-in'}
            </li>
            <li>
              <span lang="tr">Öğretmenin geçti olarak işaretlediği dersler</span>
              {' / which lessons the instructor has marked as passed'}
            </li>
            <li>
              <span lang="tr">Her giriş tarih ve saati (devam takibi için)</span>
              {' / the date/time of each sign-in (for attendance tracking)'}
            </li>
          </ul>
          <p>
            <strong>
              <span lang="tr">Toplamadıklarımız</span>
              {' / We do NOT collect: '}
            </strong>
            <span lang="tr">
              e-posta adresi, doğum tarihi, IP adresi, telefon numarası, fotoğraf
              veya uygulama dışındaki herhangi bir veri.
            </span>
            {' email addresses, dates of birth, IP addresses, phone numbers, photos, or any data outside the app.'}
          </p>
        </section>

        <section>
          <h2>
            <span lang="tr">Saklama süresi</span>
            {' / How long we keep it'}
          </h2>
          <p lang="tr">
            Onayınızı geri çekene veya çocuğunuz programdan ayrılana kadar.
            Onayı geri çekmek için öğretmenden hesabın silinmesini isteyin;
            tüm kayıtlar silinecektir.
          </p>
          <p>
            Until you withdraw consent or your child leaves the program. To
            withdraw consent, ask the instructor to delete the account; we will
            erase the child&rsquo;s profile and all associated records.
          </p>
        </section>

        <section>
          <h2>
            <span lang="tr">Onay</span>
            {' / Consent'}
          </h2>
          <p lang="tr">
            Ben, _______________________________________________ (veli adı),
            çocuğumun Ulu Cami Quran Learning uygulamasını kullanmasına izin
            veriyorum ve yukarıda açıklanan verilerin saklanmasını kabul
            ediyorum.
          </p>
          <p>
            I, _______________________________________________ (parent /
            guardian name), give consent for my child to use the Ulu Cami Quran
            Learning App, and acknowledge the data described above.
          </p>

          <div className="consent-form__signature">
            <div>
              <div className="consent-form__line">
                <span lang="tr">Çocuğun adı</span>
                {' / Child’s name'}
              </div>
            </div>
            <div>
              <div className="consent-form__line">
                <span lang="tr">Tarih</span>
                {' / Date'}
              </div>
            </div>
          </div>

          <div className="consent-form__signature">
            <div>
              <div className="consent-form__line">
                <span lang="tr">Veli imzası</span>
                {' / Parent / Guardian signature'}
              </div>
            </div>
            <div>
              <div className="consent-form__line">
                <span lang="tr">Tarih</span>
                {' / Date'}
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
