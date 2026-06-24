import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  const body = await req.json()

  const userRecord =
    await adminAuth.createUser({
      email: body.email,
      password: body.password,
      displayName: body.name,
    })

  await adminDb
    .collection('users')
    .doc(userRecord.uid)
    .set({
      name: body.name,
      email: body.email,
      role: body.role,
      active: true,
      canDelete:
        body.role === 'sindico' ||
        body.role === 'subsindico',
    })

  return NextResponse.json({
    success: true,
  })
}