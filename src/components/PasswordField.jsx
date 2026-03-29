import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { scorePassword } from '../crypto/engine';

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = ['', '#ef4444', '#f59e0b', '#facc15', '#34d399', '#34d399'];

export default function PasswordField({ value, onChange, showStrength = false, placeholder }) {
  const [visible, setVisible] = useState(false);
  const score = showStrength ? scorePassword(value) : 0;

  const handleChange = useCallback((e) => onChange(e.target.value), [onChange]);

  return (
    <div>
      <div className="password-field-wrapper">
        <input
          id="password-input"
          type={visible ? 'text' : 'password'}
          className="password-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder || 'Enter your password…'}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="strength-bar-wrapper">
          <div className="strength-segments">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`strength-segment ${score >= i ? `filled-${Math.min(score, 4)}` : ''}`}
              />
            ))}
          </div>
          <span
            className="strength-label"
            style={{ color: STRENGTH_COLORS[score] || 'var(--text-muted)' }}
          >
            {STRENGTH_LABELS[score]}
          </span>
        </div>
      )}
    </div>
  );
}
