import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  // Your Firebase config will be automatically picked up from google-services.json
  // No need to manually add the config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app; 