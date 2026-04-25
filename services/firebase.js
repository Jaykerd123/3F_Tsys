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
  getFirestore,
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
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
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
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
})
const db = getFirestore(app)
const usersCol = collection(db, 'users')
const logsCol = collection(db, 'timeLogs')
const messagesCol = collection(db, 'messages')

export async function signUp(email, password, name, role = 'worker') {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  const { uid } = credential.user
  await setDoc(doc(usersCol, uid), {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  })
  return credential
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
  return updateDoc(doc(usersCol, uid), data)
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
  const logsQuery = query(logsCol, where('userId', '==', uid), orderBy('createdAt', 'desc'))
  return onSnapshot(logsQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(docs)
  })
}

export function subscribeAllLogs(callback) {
  const logsQuery = query(logsCol, orderBy('createdAt', 'desc'))
  return onSnapshot(logsQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(docs)
  })
}

export async function fetchUsers() {
  const snapshot = await getDocs(query(usersCol, orderBy('name')))
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export function subscribeMessages(callback) {
  const messagesQuery = query(messagesCol, orderBy('createdAt', 'asc'))
  return onSnapshot(messagesQuery, snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(docs)
  })
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
    where('createdAt', '<=', end),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(logsQuery)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
