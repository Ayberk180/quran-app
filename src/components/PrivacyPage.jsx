/**
 * Public privacy page at #/privacy. Lists exactly what the app stores and
 * what it doesn't. Mirrors the consent form so parents see the same info
 * on the website as on the paper form.
 */
import { useEffect } from 'react';
import { useLanguage } from '../lib/i18n.jsx';

export default function PrivacyPage() {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = t('privacy.docTitle');
    return () => { document.title = 'Ulu Cami Quran Learning'; };
  }, [t]);

  return (
    <section className="lesson-view">
      <a href="#/" className="back-link">
        <span className="back-link__arrow" aria-hidden="true">←</span>
        <span>{t('lesson.back')}</span>
      </a>

      <header className="lesson-view__header">
        <p className="lesson-view__number">{t('privacy.label')}</p>
        <h1 className="lesson-view__title">{t('privacy.heading')}</h1>
      </header>

      <div className="privacy-prose">
        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">{t('privacy.store.heading')}</h2>
          <ul>
            <li>{t('privacy.store.name')}</li>
            <li>{t('privacy.store.pin')}</li>
            <li>{t('privacy.store.lessons')}</li>
            <li>{t('privacy.store.logins')}</li>
          </ul>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">{t('privacy.notCollect.heading')}</h2>
          <p>{t('privacy.notCollect.body')}</p>
          <p>{t('privacy.notCollect.ads')}</p>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">{t('privacy.retention.heading')}</h2>
          <p>{t('privacy.retention.body')}</p>
        </section>

        <section className="privacy-prose__section">
          <h2 className="privacy-prose__heading">{t('privacy.withdraw.heading')}</h2>
          <p>{t('privacy.withdraw.body')}</p>
        </section>
      </div>
    </section>
  );
}
