
/**
 * Thoroughly clear Supabase auth state from storage to prevent limbo states.
 * Safe to call multiple times. No-ops outside the browser.
 */
export const cleanupAuthState = () => {
  if (typeof window === 'undefined') return;

  try {
    const ls = window.localStorage;
    const ss = window.sessionStorage;

    // Remove common Supabase auth tokens
    ls.removeItem('supabase.auth.token');

    // Remove any keys created by different Supabase projects (sb-*, supabase.auth.*)
    Object.keys(ls).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        ls.removeItem(key);
      }
    });

    if (ss) {
      Object.keys(ss).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          ss.removeItem(key);
        }
      });
    }

    // Also clear any potential legacy keys
    ['supabase_session', 'supabase.auth.expires_at'].forEach((k) => {
      try {
        ls.removeItem(k);
        ss?.removeItem(k);
      } catch {
        // ignore
      }
    });

    // Optional: clear caches that may depend on auth (left as a hook point)
    // e.g., queryClient.clear() if using react-query and a shared instance
    // console.log('[Auth] Storage cleanup complete');
  } catch (e) {
    // console.warn('[Auth] Cleanup encountered an error:', e);
  }
};
