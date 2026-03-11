import React, { useEffect } from 'react';
import CuriosChat from './components/chat/CuriosChat';
import { APP_NAME, APP_TAGLINE } from './branding';

function App() {
  useEffect(() => {
    document.title = APP_NAME;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', APP_TAGLINE);
  }, []);

  return <CuriosChat />;
}

export default App;
