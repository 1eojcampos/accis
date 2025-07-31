import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  // Check for Firebase auth token in cookies or authorization header
  const token = request.cookies.get('token')?.value || 
                request.cookies.get('firebaseToken')?.value ||
                request.headers.get('Authorization')?.split('Bearer ')[1]
 
  // Paths that require authentication
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/create-order',
    '/my-orders',
    '/my-printers'
  ]

  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Add auth token to request headers if it exists
  if (token) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('Authorization', `Bearer ${token}`)
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/create-order/:path*',
    '/my-orders/:path*',
    '/my-printers/:path*',
  ],
}
