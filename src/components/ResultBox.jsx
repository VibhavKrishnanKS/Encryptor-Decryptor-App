import { useState, useCallback } from 'react';
import { Copy, Check, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CLIPBOARD_CLEAR_DELAY = 60_000; // 60 seconds

export default function ResultBox({ result, isEncrypted, onClear }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = result;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (err) {
          throw new Error('Fallback copy failed');
        } finally {
          textArea.remove();
        }
      }

      setCopied(true);
      setTimeout(async () => {
        try {
          if (navigator.clipboard) {
            const text = await navigator.clipboard.readText();
            if (text === result) await navigator.clipboard.writeText('');
          }
        } catch { /* ignore */ }
      }, CLIPBOARD_CLEAR_DELAY);

      setTimeout(() => setCopied(false), 2200);
    } catch {
      alert('Clipboard access denied or unsupported. Please select and copy the text manually.');
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
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
