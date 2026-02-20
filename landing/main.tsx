import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from '../components/LandingPage';
import './styles.css';

/**
 * Standalone entry point for the public landing site at asmrwithmapa.com.
 * The LandingPage is always open; there is no in-app overlay context here.
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <LandingPage isOpen={true} onClose={() => { }} isPreview={false} />
    </React.StrictMode>
);
