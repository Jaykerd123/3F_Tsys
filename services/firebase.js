import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  initializeAuth,
  getReactNativePersistence
} from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  initializeFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  enableNetwork,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCud2rRXWMKzT4F3kHrhJs9roOY4NGa_hM',
  authDomain: 'f-tsys.firebaseapp.com',
  projectId: 'f-tsys',
  storageBucket: 'f-tsys.firebasestorage.app',
  messagingSenderId: '1024648106091',
  appId: '1:1024648106091:android:ac9b240518bcf45f48a12e',
}

const app = initializeApp(firebaseConfig)

// Fix for "auth/already-initialized" error
let auth;
try {
  auth = getAuth(app);
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

// Fix for Expo "Offline" issue: Force long-polling and disable fetch streams
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
})

// Force network to be enabled immediately
enableNetwork(db)
  .then(() => console.log("[Firestore] Network enabled manually"))
  .catch(err => console.error("[Firestore] Network enable error:", err));

const usersCol = collection(db, 'users')
const logsCol = collection(db, 'timeLogs')
const messagesCol = collection(db, 'messages')

export async function signUp(email, password, name, role = 'worker') {
  console.log(`[Auth] Attempting signup for ${email}...`);
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    const { uid } = credential.user
    console.log(`[Auth] User created (UID: ${uid}). Creating Firestore profile...`);
    
    try {
      await setDoc(doc(usersCol, uid), {
        name,
        email,
        role,
        createdAt: serverTimestamp(),
      })
      console.log("[Firestore] Profile created successfully!");
    } catch (dbError) {
      console.error("[Firestore] Profile creation failed:", dbError.message);
      // If the DB profile fails, the user is useless for our app. 
      // We should probably alert them that their profile wasn't fully set up.
      throw new Error(`Account created, but profile setup failed: ${dbError.message}`);
    }
    
    return credential
  } catch (error) {
    console.error("[Auth] Signup error:", error.message);
    throw error
  }
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export function onAuthStateChanged(callback) {
  return auth.onAuthStateChanged(callback)
}

export async function fetchUserProfile(uid) {
  const profileDoc = await getDoc(doc(usersCol, uid))
  if (!profileDoc.exists()) return null
  return { id: profileDoc.id, ...profileDoc.data() }
}

export async function updateUserProfile(uid, data) {
  return setDoc(doc(usersCol, uid), data, { merge: true })
}

export async function createTimeLog(uid, userName, timeIn = new Date().toISOString()) {
  return addDoc(logsCol, {
    userId: uid,
    userName,
    timeIn,
    timeOut: null,
    isOpen: true,
    createdAt: serverTimestamp(),
  })
}

export async function updateTimeLog(logId, timeOut = null, timeIn = null) {
  const docRef = doc(logsCol, logId)
  const payload = {}
  if (timeIn !== null) payload.timeIn = timeIn
  if (timeOut !== null) {
    payload.timeOut = timeOut
    payload.isOpen = false
  }
  return updateDoc(docRef, payload)
}

export async function deleteTimeLog(logId) {
  return deleteDoc(doc(logsCol, logId))
}

export function subscribeUserLogs(uid, callback) {
  // Removed server-side orderBy to avoid complex index requirements
  const logsQuery = query(logsCol, where('userId', '==', uid))
  return onSnapshot(logsQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort locally by createdAt desc
    docs.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0
      const dateB = b.createdAt?.seconds || 0
      return dateB - dateA
    })
    callback(docs)
  })
}

export function subscribeAllLogs(callback) {
  const logsQuery = query(logsCol)
  return onSnapshot(logsQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort locally by createdAt desc
    docs.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0
      const dateB = b.createdAt?.seconds || 0
      return dateB - dateA
    })
    callback(docs)
  })
}

export function subscribeMessages(callback) {
  const messagesQuery = query(messagesCol, orderBy('createdAt', 'asc'))
  return onSnapshot(messagesQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(docs)
  })
}

export async function fetchUsers() {
  console.log("[Firestore] Fetching users from 'users' collection...");
  try {
    const snapshot = await getDocs(usersCol)
    console.log(`[Firestore] Successfully fetched ${snapshot.docs.length} users.`);
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort locally by name
    docs.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return docs
  } catch (error) {
    console.error("[Firestore] Error fetching users:", error);
    throw error;
  }
}

export async function sendMessage(userId, userName, text) {
  return addDoc(messagesCol, {
    userId,
    userName,
    text,
    system: false,
    createdAt: serverTimestamp(),
  })
}

export async function sendSystemMessage(userName, text) {
  return addDoc(messagesCol, {
    userName,
    text,
    system: true,
    createdAt: serverTimestamp(),
  })
}

export async function fetchTimeLogsByRange(startDate, endDate) {
  const start = Timestamp.fromDate(new Date(`${startDate}T00:00:00`))
  const end = Timestamp.fromDate(new Date(`${endDate}T23:59:59`))
  const logsQuery = query(
    logsCol,
    where('createdAt', '>=', start),
    where('createdAt', '<=', end)
  )
  const snapshot = await getDocs(logsQuery)
  const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // Sort locally
  docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  return docs
}
