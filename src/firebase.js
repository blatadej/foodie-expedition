import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, update, onValue, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyACTuSxubTL12__j5V6qfumtreIP7zxe_8",
  authDomain: "foodieexpeditionroom.firebaseapp.com",
  databaseURL: "https://foodieexpeditionroom-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "foodieexpeditionroom",
  storageBucket: "foodieexpeditionroom.firebasestorage.app",
  messagingSenderId: "224569828835",
  appId: "1:224569828835:web:95af6a4288f18a895cecd6",
  measurementId: "G-JDMRCSRZX0"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export function roomRef(id) { return ref(db, `rooms/${id}`); }
export function guestRef(roomId, guestId) { return ref(db, `rooms/${roomId}/guests/${guestId}`); }
export { set, update, onValue, get };

export function generateRoomId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
