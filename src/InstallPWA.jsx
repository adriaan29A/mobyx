import React, { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      console.log('PWA install prompt triggered');
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check if running in standalone mode (installed PWA)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('PWA is already installed and running in standalone mode');
        setIsInstalled(true);
        setSupportsPWA(false);
        return;
      }

      // Check if running in fullscreen mode (installed PWA) - iOS Safari
      if (typeof window.navigator !== 'undefined' && window.navigator.standalone === true) {
        console.log('PWA is already installed and running in fullscreen mode');
        setIsInstalled(true);
        setSupportsPWA(false);
        return;
      }

      // Check if app was previously installed
      if (localStorage.getItem('pwa-installed') === 'true') {
        console.log('PWA was previously installed');
        setIsInstalled(true);
        setSupportsPWA(false);
        return;
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    // Listen for app installation
    window.addEventListener('appinstalled', (evt) => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setSupportsPWA(false);
      setPromptInstall(null);
      localStorage.setItem('pwa-installed', 'true');
    });

    // Check installation status on load
    checkIfInstalled();

    // Debug: Check if PWA criteria are met
    console.log('Checking PWA install criteria...');
    console.log('HTTPS:', window.location.protocol === 'https:');
    console.log('Manifest:', !!document.querySelector('link[rel="manifest"]'));
    console.log('Service Worker:', 'serviceWorker' in navigator);
    console.log('Display Mode:', window.matchMedia('(display-mode: standalone)').matches);
    console.log('Standalone:', typeof window.navigator !== 'undefined' ? window.navigator.standalone : 'undefined');

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = async () => {
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
      setSupportsPWA(false);
      localStorage.setItem('pwa-installed', 'true');
    } else {
      console.log('User dismissed the install prompt');
    }
    setPromptInstall(null);
  };

  // Don't show anything if app is already installed
  if (isInstalled) {
    return null;
  }

  // Show debug info if PWA criteria aren't met
  if (!supportsPWA) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: '#ff9800',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        PWA not ready (check console)
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}
    >
      Install App
    </button>
  );
};

export default InstallPWA;
