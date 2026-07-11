import { useLanguage } from '../lib/i18n.jsx';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={() => setLang(lang === 'en' ? 'tr' : 'en')}
      aria-label={lang === 'en' ? 'Türkçeye geç' : 'Switch to English'}
    >
      <span className={lang === 'en' ? 'language-toggle__option language-toggle__option--active' : 'language-toggle__option'}>
        EN
      </span>
      <span className="language-toggle__sep" aria-hidden="true">/</span>
      <span className={lang === 'tr' ? 'language-toggle__option language-toggle__option--active' : 'language-toggle__option'}>
        TR
      </span>
    </button>
  );
}
