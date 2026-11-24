// The app is a SPA, not a PWA. Older builds (Create React App) could install a service worker,
// so unregister() removes any left in this app's scope and reloads once to drop its cache.

export function unregister() {
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.getRegistrations().then(async registrations => {
      const appScope = new URL(`${process.env.PUBLIC_URL || ''}/`, window.location.origin).href;
      const appRegistrations = registrations.filter(registration => registration.scope.startsWith(appScope));
      const wasControlled = Boolean(navigator.serviceWorker.controller);

      await Promise.all(appRegistrations.map(registration => registration.unregister()));

      const reloadKey = "bttools-service-worker-removed";
      if (wasControlled && appRegistrations.length > 0 && sessionStorage.getItem(reloadKey) !== "1") {
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
      } else if (!wasControlled) {
        sessionStorage.removeItem(reloadKey);
      }
    });
  }
}
