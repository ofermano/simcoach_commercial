export function isDesktopShell(): boolean {
  if (typeof window === "undefined") return false;
  const anyWindow = window as any;
  return !!anyWindow.chrome?.webview || !!anyWindow.pywebview;
}

export async function notifyHostAboutToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  const anyWindow = window as any;

  // 1) Legacy embedded shell (WebView2 / pywebview)
  if (anyWindow.chrome?.webview?.postMessage) {
    anyWindow.chrome.webview.postMessage({
      type: "flow_auth_token",
      access_token: token,
    });
  } else if (anyWindow.pywebview?.api?.set_token) {
    anyWindow.pywebview.api.set_token(token);
  }

  // 2) Default-browser flow: if login was opened with ?callback_port=XXXX,
  //    call back to the local desktop listener so it can capture the token.
  try {
    const href = window.location.href;
    const url = new URL(href);
    const callbackPort = url.searchParams.get("callback_port");
    const state = url.searchParams.get("state");
    if (callbackPort && state) {
      // Send the token to the local callback via POST with a state value
      // to avoid putting the token in the URL and to prevent CSRF.
      try {
        await fetch(`http://127.0.0.1:${callbackPort}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token, state }),
        });
        window.close();
      } catch {
        // Ignore network errors; desktop app will timeout if it never receives the token.
      }
    }
  } catch {
    // Ignore URL parsing issues.
  }
}

