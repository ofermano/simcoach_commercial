/**
 * Google Identity Services (GIS) – Sign-in button (popup) flow for id_token, no One Tap / FedCM.
 * Set VITE_GOOGLE_CLIENT_ID to your Google OAuth 2.0 Web client ID (same as backend for token verification).
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; type?: string; text?: string }
          ) => void;
        };
      };
    };
    gapiLoaded?: () => void;
  }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

function loadScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      if (window.google?.accounts?.id) return resolve();
      window.gapiLoaded = () => resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

/**
 * Render the official Google Sign-In button into a visible container on the page.
 * Use this instead of the hidden-button approach so the iframe loads with the correct origin.
 * Callback receives the id_token to send to backend.
 */
export async function renderGoogleButton(
  container: HTMLElement,
  clientId: string,
  onSuccess: (idToken: string) => void,
  onError: (message: string) => void
): Promise<void> {
  if (!clientId?.trim()) {
    onError("Google sign-in is not configured.");
    return;
  }
  try {
    await loadScript();
    if (!window.google?.accounts?.id) {
      onError("Google sign-in failed to load. Please try again.");
      return;
    }
    container.innerHTML = "";
    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        if (response?.credential) onSuccess(response.credential);
        else onError("No credential received from Google.");
      },
    });
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "filled_black",
      size: "large",
    });
  } catch {
    onError("Google sign-in failed to load. Please try again.");
  }
}

/**
 * Trigger Google Sign-In: renders the button into a visible container then programmatically clicks it.
 * Kept for backward compatibility; prefer using renderGoogleButton with a visible div in the UI.
 */
export async function signInWithGoogle(
  clientId: string,
  onSuccess: (idToken: string) => void,
  onError: (message: string) => void
): Promise<void> {
  if (!clientId?.trim()) {
    onError("Google sign-in is not configured.");
    return;
  }
  try {
    await loadScript();
    if (!window.google?.accounts?.id) {
      onError("Google sign-in failed to load. Please try again.");
      return;
    }
    const container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    container.style.cssText =
      "position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
    document.body.appendChild(container);

    const cleanup = () => {
      try {
        if (container.parentNode) document.body.removeChild(container);
      } catch {
        /* ignore */
      }
    };

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      callback: (response) => {
        cleanup();
        if (response?.credential) onSuccess(response.credential);
        else onError("No credential received from Google.");
      },
    });
    window.google.accounts.id.renderButton(container, {
      type: "standard",
      theme: "filled_black",
      size: "large",
    });
    requestAnimationFrame(() => {
      const btn = container.firstElementChild as HTMLElement | null;
      if (btn) {
        container.style.pointerEvents = "auto";
        btn.click();
      } else {
        cleanup();
        onError("Google sign-in could not start. Try again or use email sign-in.");
      }
    });
  } catch {
    onError("Google sign-in failed to load. Please try again.");
  }
}

export function getGoogleClientId(): string {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "";
}
