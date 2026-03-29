import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldCheck, AlertTriangle, Info, Zap } from 'lucide-react';
import PasswordField from './components/PasswordField';
import ResultBox from './components/ResultBox';
import InactivityGuard from './components/InactivityGuard';
import { encryptData, decryptData, isSecureVaultBlob, scorePassword } from './crypto/engine';

const BROWSER_SUPPORTED = typeof window !== 'undefined' && !!window.crypto?.subtle;

export default function App() {
  const [mode, setMode]         = useState('encrypt'); // 'encrypt' | 'decrypt'
  const [inputText, setInputText] = useState('');
  const [password, setPassword]   = useState('');
  const [result, setResult]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [warn, setWarn]           = useState(null);
  const [pendingMode, setPendingMode] = useState(null);

  // Clear sensitive output on inactivity timeout
  const handleTimeout = useCallback(() => {
    setResult('');
    setPassword('');
  }, []);

  const clearAll = useCallback(() => {
    setResult('');
    setError(null);
    setWarn(null);
  }, []);

  const executeSwitch = useCallback(() => {
    if (!pendingMode) return;
    setMode(pendingMode);
    setInputText('');
    setPassword('');
    setResult('');
    setError(null);
    setWarn(null);
    setPendingMode(null);
  }, [pendingMode]);

  const requestSwitchMode = useCallback((m) => {
    if (m === mode) return;

    if (inputText || result || password) {
      setPendingMode(m);
      return;
    }

    setMode(m);
    setInputText('');
    setPassword('');
    setResult('');
    setError(null);
    setWarn(null);
  }, [mode, inputText, result, password]);

  // Detect double-encryption warning
  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setInputText(val);
    setError(null);

    if (mode === 'encrypt' && isSecureVaultBlob(val)) {
      setWarn('⚠️ This text already looks like a SecureVault encrypted blob. Encrypting it again will make it harder to recover. Are you sure?');
    } else {
      setWarn(null);
    }
  }, [mode]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setWarn(null);
    setResult('');

    // Guard: empty fields
    if (!inputText.trim()) return setError('Please enter some text.');
    if (!password)         return setError('Please enter a password.');

    // Guard: weak password on encrypt only
    if (mode === 'encrypt' && scorePassword(password) < 2) {
      return setError('Password is too weak. Use at least 8 characters with mixed case, numbers, or symbols.');
    }

    // Guard: browser support
    if (!BROWSER_SUPPORTED) {
      return setError('Your browser does not support the Web Crypto API. Please use a modern browser (Chrome, Firefox, Edge, Safari).');
    }

    setLoading(true);
    try {
      if (mode === 'encrypt') {
        const encrypted = await encryptData(inputText, password);
        setResult(encrypted);
      } else {
        const decrypted = await decryptData(inputText, password);
        setResult(decrypted);
      }
    } catch (err) {
      if (err.code === 'INVALID_FORMAT') {
        setError('Invalid format: This does not appear to be a SecureVault encrypted file. Make sure you are pasting the full encrypted output.');
      } else if (err.code === 'AUTH_FAILED') {
        setError('Decryption failed: The password is incorrect, or the file has been tampered with. The authentication tag did not match.');
      } else if (err.code === 'CORRUPTED') {
        setError('Data corrupted: The encrypted data appears to be incomplete or has been modified.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, [inputText, password, mode]);

  const canSubmit = inputText.trim().length > 0 && password.length > 0 && !loading;

  // ── Browser incompatibility screen ──────────────────────
  if (!BROWSER_SUPPORTED) {
    return (
      <div className="app-wrapper">
        <div className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <div className="alert-banner danger" style={{ justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
            <AlertTriangle size={32} />
            <strong>Secure Context Required</strong>
            <p>Your browser lacks support for the Web Crypto API, or you are not on a secure HTTPS connection. This app requires modern browsers and a secure context to run locally.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <InactivityGuard onTimeout={handleTimeout} />
      <div className="elegant-bg-mesh" />

      <div className="app-wrapper">
        <div className="container">
          {/* ── Header ── */}
          <header className="header">
            <div className="logo-lockup">
              <div className="logo-icon">
                <ShieldCheck size={28} />
              </div>
              <h1>SecureVault</h1>
            </div>
            <p className="header-subtitle">
              Military-grade text encryption, running 100% in your browser.
            </p>
            <div className="trust-badges">
              <span className="badge green"><ShieldCheck size={11} /> AES-256-GCM</span>
              <span className="badge blue"><Lock size={11} /> PBKDF2 · 600k Rounds</span>
              <span className="badge violet"><Zap size={11} /> Zero-Knowledge · No Server</span>
            </div>
          </header>

          {/* ── Mode Tabs ── */}
          <div className="mode-tabs" role="tablist">
            <button
              id="tab-encrypt"
              role="tab"
              className={`mode-tab encrypt ${mode === 'encrypt' ? 'active' : ''}`}
              onClick={() => requestSwitchMode('encrypt')}
              aria-selected={mode === 'encrypt'}
            >
              <Lock size={15} /> Encrypt
            </button>
            <button
              id="tab-decrypt"
              role="tab"
              className={`mode-tab decrypt ${mode === 'decrypt' ? 'active' : ''}`}
              onClick={() => requestSwitchMode('decrypt')}
              aria-selected={mode === 'decrypt'}
            >
              <Unlock size={15} /> Decrypt
            </button>
          </div>

          {/* ── Main Vault Card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              className="vault-card"
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
            >
              {/* Input Text */}
              <div className="field-gap">
                <label className="field-label" htmlFor="input-text">
                  {mode === 'encrypt' ? '📝 Plaintext to Encrypt' : '🔐 Encrypted Blob to Decrypt'}
                </label>
                <textarea
                  id="input-text"
                  className={`vault-textarea ${error ? 'danger' : ''}`}
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder={
                    mode === 'encrypt'
                      ? 'Paste or type the text you want to encrypt…'
                      : 'Paste your SecureVault encrypted blob here (starts with SVLT1:)…'
                  }
                  spellCheck={false}
                />
              </div>

              {/* Double-encryption warning */}
              <AnimatePresence>
                {warn && (
                  <motion.div
                    className="alert-banner warn"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{warn}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <div className="field-gap">
                <label className="field-label" htmlFor="password-input">
                  🔑 Password
                </label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  showStrength={mode === 'encrypt'}
                  placeholder={mode === 'encrypt' ? 'Create a strong password…' : 'Enter the password used to encrypt…'}
                />
              </div>

              {/* Info note for decrypt */}
              {mode === 'decrypt' && (
                <div className="alert-banner info" style={{ marginBottom: '1rem' }}>
                  <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Use the exact same password that was used to encrypt this text. There is no recovery option.</span>
                </div>
              )}

              {/* Error display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="alert-banner danger"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action button */}
              <button
                id={mode === 'encrypt' ? 'encrypt-btn' : 'decrypt-btn'}
                className={`action-btn ${mode === 'encrypt' ? 'encrypt-btn' : 'decrypt-btn'}`}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    {mode === 'encrypt' ? 'Encrypting…' : 'Decrypting…'}
                  </>
                ) : mode === 'encrypt' ? (
                  <><Lock size={17} /> Encrypt Text</>
                ) : (
                  <><Unlock size={17} /> Decrypt Text</>
                )}
              </button>

              {/* Result */}
              <ResultBox
                result={result}
                isEncrypted={mode === 'encrypt'}
                onClear={clearAll}
              />
            </motion.div>
          </AnimatePresence>

          {/* ── Footer ── */}
          <footer style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <p>All encryption is performed locally in your browser using the <strong>Web Crypto API</strong>.</p>
            <p style={{ marginTop: '0.3rem' }}>No data is ever sent to a server. No passwords are stored anywhere.</p>
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {pendingMode && (
          <motion.div
            className="inactivity-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 10000 }}
          >
            <div className="inactivity-card">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem', color: '#ef4444' }}>
                <AlertTriangle size={36} />
              </div>
              <h2>Erase Current Work?</h2>
              <p>
                Have you securely copied and stored your output? <br/><br/>
                Switching modes will <strong>immediately erase</strong> your current password and data for security.
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <button
                  className="action-btn danger-btn"
                  onClick={executeSwitch}
                >
                  Yes, Erase & Switch
                </button>
                <button
                  className="action-btn"
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', boxShadow: 'none' }}
                  onClick={() => setPendingMode(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
