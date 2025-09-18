import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a notification to the user that an update is available
    if (confirm('New content available. Reload?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

// Handle PWA installation
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show install button or notification
  showInstallPromotion();
});

function showInstallPromotion() {
  // You can show a custom install button here
  console.log('PWA install prompt available');
}

// Handle successful installation
window.addEventListener('appinstalled', (evt) => {
  console.log('PWA was installed');
  deferredPrompt = null;
});

// Export for use in main app
export { updateSW, deferredPrompt }; 