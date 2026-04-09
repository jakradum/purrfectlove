'use client';

import { createPortal } from 'react-dom';
import styles from './Care.module.css';

const STRINGS = {
  en: {
    title: 'Before you book',
    agreeBtn: 'I agree, proceed',
    cancel: 'Cancel',
  },
  de: {
    title: 'Vor der Buchung',
    agreeBtn: 'Ich stimme zu, weiter',
    cancel: 'Abbrechen',
  },
};

const WAIVER_TEXT = {
  en: `Purrfect Love is a community platform. We connect cat owners and sitters but are not party to any arrangement between them. By proceeding, you acknowledge that Purrfect Love bears no responsibility for incidents during a sit, including but not limited to injury, escape, loss, or property damage. You agree to support each other in good faith and take reasonable precautions. This applies to both cat parents and sitters.`,
  de: `Purrfect Love ist eine Community-Plattform. Wir verbinden Katzenbesitzer und Katzensitter, sind jedoch nicht Partei einer Vereinbarung zwischen ihnen. Indem du fortfährst, bestätigst du, dass Purrfect Love keine Verantwortung für Vorfälle während einer Betreuung trägt, einschließlich, aber nicht beschränkt auf Verletzungen, Entkommen, Verlust oder Sachschäden. Du stimmst zu, einander in gutem Glauben zu unterstützen und angemessene Vorsichtsmaßnahmen zu treffen. Dies gilt für Katzeneltern und Sitter gleichermaßen.`,
};

export default function WaiverModal({ onAgree, onCancel, locale = 'en' }) {
  const t = STRINGS[locale] || STRINGS.en;
  const text = WAIVER_TEXT[locale] || WAIVER_TEXT.en;

  return createPortal(
    <div className={styles.waiverOverlay} onClick={onCancel}>
      <div className={styles.waiverModal} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className={styles.waiverCloseBtn}
          onClick={onCancel}
          aria-label="Close"
        >
          <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <p className={styles.waiverTitle}>{t.title}</p>
        <div className={styles.waiverBody}>{text}</div>

        <button
          type="button"
          className={styles.waiverContinueBtn}
          onClick={onAgree}
        >
          {t.agreeBtn}
        </button>

        <button type="button" className={styles.waiverCancelLink} onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </div>,
    document.body
  );
}
