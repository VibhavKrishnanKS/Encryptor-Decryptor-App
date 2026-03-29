# 🛡️ SecureVault: The Ultimate Encryptor-Decryptor Blueprint (v2.0)

This document is the master specification for **SecureVault**, a high-security, ultra-modern privacy tool. It is designed to be the "gold standard" for client-side text and file protection.

---

## 1. 🏗️ Modern Technical Foundation
To ensure the highest performance and developer experience, we will use the following "Modern Framework" stack:

- **UI Framework:** [React 18.x](https://reactjs.org/) (Strict Mode enabled).
- **Build Engine:** [Vite 5.x](https://vitejs.dev/) (Instant HMR and optimized production builds).
- **Animations:** [Framer Motion](https://www.framer.com/motion/) (For "Liquid" transitions and premium micro-interactions).
- **Icons:** [Lucide React](https://lucide.dev/) (Clean, modern, optimized SVG icons).
- **Styling:** Custom Vanilla CSS with **PostCSS** (Focusing on Glassmorphism, CSS Variables, and 60fps animations).

---

## 2. 🔐 The Latest Cryptographic Standard
We are moving beyond basic encryption. Our "Crypto Engine" will use:

- **Encryption (Authenticated):** **AES-256-GCM** (Galois/Counter Mode).
    - 256-bit keys for post-quantum resistance.
    - Built-in Integrity check (it's impossible to modify a single byte of the encrypted file without detection).
- **Key Stretching (The Shield):** **PBKDF2-HMAC-SHA512** with **600,000+ iterations**.
    - We use SHA-512 for higher collision resistance than the standard SHA-256.
- **Randomness:** Using the `window.crypto.getRandomValues()` API (Hardware-level entropy).
- **Concurrency:** We will implement **Web Workers** for the hashing process. This ensures the browser UI NEVER freezes, even during heavy 600k+ hashing iterations.

---

## 3. 🎨 Premium UI/UX Design "The Obsidian Vault"
The design must look like a futuristic security terminal.

| Feature | Specification |
| :--- | :--- |
| **Theme** | **Deep Obsidian:** `#020617` (Deepest Navy) with Sapphire Glow accents. |
| **Glassmorphism** | `backdrop-filter: blur(20px) saturate(180%);` for all card elements. |
| **Interactions** | Hover states with subtle "Glow Follow" effects. Success/Fail states with "spring" animations. |
| **Security HUD** | A real-time "Security Health" bar that improves as the password complexity increases. |

---

## 4. 🚀 Comprehensive Edge Case Registry (Advanced)
A professional agent must handle these scenarios gracefully:

### A. The "Human Error" Cases
- **Password Strength:** Prevent encryption with weak passwords (e.g., < 8 chars) unless the user explicitly acknowledges the risk.
- **Double Encryption Detection:** If the input text looks like an existing SecureVault blob, warn the user they are encrypting an already encrypted file.
- **Clipboard Leaks:** Automatically clear the "Copied" text from the system clipboard after 60 seconds of inactivity.

### B. The "Technical Constraint" Cases
- **Large Data Overflow:** For text over 1MB, the app should switch to a "Streaming" mode or offer to save it as a `.vault` file instead of displaying it.
- **Browser Compatibility:** Check for `window.crypto` support on entry; show a "Secure Context Required" page if running on non-HTTPS or old browsers.
- **Low Memory Alerts:** Warn users when encrypting large files (200MB+) that browser memory limits (RAM) might be reached.

### C. The "Security Breach" Cases
- **Tampering Detection:** If the Authentication Tag fails even by 1 bit, show a detailed "File Tampered or Password Incorrect" warning instead of a generic crash.
- **Inactivity Timeout:** Clear decrypted text from the screen if the user hasn't interacted with the page for 5 minutes.
- **Tab Persistence:** Ensure sensitive password data is NEVER stored in `localStorage`. Only kept in React dynamic state (Memory).

---

## 5. 🛠️ Implementation Strategy (Phase-by-Phase)

1.  **Phase 1 (Vite/React Setup):** Create the project with strict linting and CSS variables.
2.  **Phase 2 (The Web Worker Engine):** Build a standalone `worker.js` for crypto to prevent UI main-thread blocking.
3.  **Phase 3 (The Glass HUD):** Implement the main "Vault Interface" with Framer Motion transitions.
4.  **Phase 4 (File Handling):** Add Drag-and-Drop support for binary files.
5.  **Phase 5 (Audit):** Final verification of the logic against the [Web Crypto API Standards](https://www.w3.org/TR/WebCryptoAPI/).

---

> [!CAUTION]
> **Anti-Recovery Lock:** Users must be informed that **no one**—not even the developer—can recover their data if the password is lost. The encryption is mathematically final.
