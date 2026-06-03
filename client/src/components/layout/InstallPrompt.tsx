import { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt variable
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-2xl">bloodtype</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-surface-on text-sm">Install LifeLink</h3>
            <p className="text-surface-on/60 text-xs">Add to your home screen for quick access.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDismiss}
            className="p-2 text-surface-on/40 hover:text-surface-on/60 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <button
            onClick={handleInstallClick}
            className="bg-primary text-white px-5 py-2 rounded-xl font-headline font-bold text-sm shadow-md active:scale-95 transition-all"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
