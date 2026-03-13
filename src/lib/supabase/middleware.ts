import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // If magic link landed on root with a code param, forward to auth callback
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.get('code')) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/callback';
    return NextResponse.redirect(url);
  }

  // Redirect root to /app for convenience
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/app';
    return NextResponse.redirect(url);
  }

  // Clear any stale Supabase auth cookies that cause timeouts
  const response = NextResponse.next({ request });
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
