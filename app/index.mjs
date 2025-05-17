import { registerRootComponent } from 'expo';
import { initSentry } from '../utils/sentry';
import { initializeApp } from '../utils/appInitialization';
import App from './App';

// Initialize Sentry for error tracking
initSentry();

// Initialize app services
initializeApp();

// Register the root component
registerRootComponent(App);
