'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bug, X, Paperclip } from 'lucide-react';
import styles from './BugReportPanel.module.css';

export default function BugReportPanel({ onClose, isMobile }) {
  const [pageUrl, setPageUrl] = useState('');
  const [body, setBody] = useState('');
  const [screenshot, setScreenshot] = useState(null); // { file, previewUrl }
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setPageUrl(window.location.href);
    textareaRef.current?.focus();
  }, []);

  // Paste screenshot support
  useEffect(() => {
    const onPaste = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) attachFile(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const attachFile = (file) => {
    if (!file.type.startsWith('image/')) return;
    const previewUrl = URL.createObjectURL(file);
    setScreenshot({ file, previewUrl });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) attachFile(file);
  };

  const removeScreenshot = () => {
    if (screenshot?.previewUrl) URL.revokeObjectURL(screenshot.previewUrl);
    setScreenshot(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadScreenshot = async (file) => {
    const timestamp = Date.now();
    const ext = file.type.split('/')[1] || 'png';
    const rawName = file.name || `screenshot.${ext}`;
    const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_') || `screenshot.${ext}`;
    const path = `${timestamp}-${safeName}`;

    const res = await fetch(`/api/care/bugreport/upload?path=${encodeURIComponent(path)}&type=${encodeURIComponent(file.type)}`, {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Upload failed');
    }
    const { url } = await res.json();
    return url;
  };

  const handleSubmit = async () => {
    if (!body.trim()) { setError('Please describe what happened.'); return; }
    setError('');
    setSubmitting(true);

    try {
      let screenshotUrl = null;
      if (screenshot?.file) {
        setUploading(true);
        screenshotUrl = await uploadScreenshot(screenshot.file);
        setUploading(false);
      }

      const res = await fetch('/api/care/bugreport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, pageUrl, screenshotUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className={`${styles.panel} ${isMobile ? styles.panelMobile : styles.panelDesktop}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.heading}>
          <Bug size={16} strokeWidth={1.75} />
          <span>Report a bug</span>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      {success ? (
        <div className={styles.successMsg}>
          Thanks — we'll look into it.
        </div>
      ) : (
        <div className={styles.body}>
          <p className={styles.copy}>
            Found a bug, or have a suggestion? Write your notes here. Screenshots are welcome and helpful.
          </p>
          <p className={styles.pageUrlRow}>
            <span className={styles.pageUrlLabel}>Page:</span>
            <code className={styles.pageUrl}>{pageUrl}</code>
          </p>

          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder="What happened? What did you expect?"
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
          />

          {/* Screenshot upload */}
          {screenshot ? (
            <div className={styles.previewWrap}>
              <img src={screenshot.previewUrl} alt="Screenshot preview" className={styles.preview} />
              <button type="button" className={styles.removeScreenshot} onClick={removeScreenshot}>
                <X size={12} /> Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.uploadZone}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={14} strokeWidth={1.75} />
              <span>Attach a screenshot — browse or paste</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handleFileChange}
              />
            </button>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {uploading ? 'Uploading…' : submitting ? 'Sending…' : 'Send report'}
          </button>
        </div>
      )}
    </div>
  );
}
