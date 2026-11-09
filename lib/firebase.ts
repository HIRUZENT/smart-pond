// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAng0vMZxu8ZneOrtWNyLBqnoEp3yNQ4O8",
  authDomain: "periode2-smart-pond.firebaseapp.com",
  projectId: "periode2-smart-pond",
  storageBucket: "periode2-smart-pond.firebasestorage.app",
  messagingSenderId: "1018491053482",
  appId: "1:1018491053482:web:d84c368665557b425537d3",
  measurementId: "G-BG591MXDLB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);