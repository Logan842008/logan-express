import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCR3mzoB1WbIP3n2DRghDEziJEm2h1RbKw",
  authDomain: "logan-express.firebaseapp.com",
  projectId: "logan-express",
  storageBucket: "logan-express.appspot.com",
  messagingSenderId: "647144110234",
  appId: "1:647144110234:web:04da11aa192c87809d8723",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Export app and db as named exports
export { app, db, storage };
