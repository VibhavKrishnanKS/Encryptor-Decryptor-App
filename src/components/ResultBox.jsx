import { useState, useCallback } from 'react';
import { Copy, Check, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CLIPBOARD_CLEAR_DELAY = 60_000; // 60 seconds

export default function ResultBox({ result, isEncrypted, onClear }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      // Auto-clear clipboard after 60 seconds
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text === result) {
            await navigator.clipboard.writeText('');
          }
        } catch { /* ignore if clipboard changed */ }
      }, CLIPBOARD_CLEAR_DELAY);

      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert('Clipboard access denied. Please copy manually.');
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    const ext = isEncrypted ? '.vault' : '.txt';
    const mime = 'text/plain';
    const blob = new Blob([result], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securevault-output${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, isEncrypted]);

  return (
    <AnimatePresence>
      {result && (
        <motion.div
          className="result-wrapper"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.8 }}
        >
          <div className="result-header">
            <span className="field-label" style={{ marginBottom: 0 }}>
              {isEncrypted ? '🔐 Encrypted Output' : '🔓 Decrypted Output'}
            </span>
            <div className="result-actions">
              <button
                id="copy-result-btn"
                className={`icon-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy to clipboard (auto-clears in 60s)"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                id="download-result-btn"
                className="icon-btn"
                onClick={handleDownload}
                title="Download as file"
              >
                <Download size={13} /> Download
              </button>
              <button
                id="clear-result-btn"
                className="icon-btn"
                onClick={onClear}
                title="Clear result"
              >
                <Trash2 size={13} /> Clear
              </button>
            </div>
          </div>

          <div className={`result-box ${isEncrypted ? '' : 'plain-text'}`}>
            {result}
          </div>

          {copied && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              ⏱ Clipboard will be auto-cleared in 60 seconds for security.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
