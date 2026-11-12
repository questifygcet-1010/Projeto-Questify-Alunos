import React from 'react';
import { createRoot } from 'react-dom/client';
import NovaQuest from './NovaQuest.jsx';
import './quests.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><NovaQuest /></React.StrictMode>);
