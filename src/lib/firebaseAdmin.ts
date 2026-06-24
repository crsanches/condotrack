import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

console.log('PROJECT_ID =', process.env.FIREBASE_PROJECT_ID)
console.log('CLIENT_EMAIL =', process.env.FIREBASE_CLIENT_EMAIL)
console.log('PRIVATE_KEY =', !!process.env.FIREBASE_PRIVATE_KEY)

const app =
  getApps().length > 0
    ? getApps()[0]
    
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(
            /\\n/g,
            '\n'
          ),
        }),
      })

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)