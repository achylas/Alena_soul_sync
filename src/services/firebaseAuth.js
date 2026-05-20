import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth,db } from '../../firebase'

// SIGN UP
export async function signup({ email, password, displayName, question, answer }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)

  if (displayName) {
    await updateProfile(cred.user, { displayName })
  }

  await setDoc(doc(db, 'users', cred.user.uid), {
    email,
    displayName: displayName || '',
    question,
    answer, // ⚠️ You can hash this later if required
    createdAt: new Date(),
  })

  return cred.user
}

// LOGIN
export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

// LOGOUT
export function logout() {
  return signOut(auth)
}

// RESET PASSWORD (Firebase email reset – far superior UX)
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

// PROFILE
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(uid, updates) {
  await updateDoc(doc(db, 'users', uid), updates)
}

// DELETE ACCOUNT
export async function deleteAccount(user) {
  await deleteDoc(doc(db, 'users', user.uid))
  await user.delete()
}

// AUTH STATE
export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
