import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getCanonicalOrigin } from '@/lib/auth/origin';

export async function updateSession(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Static assets and internal routes pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|mp4|css|js|ico)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Public allowlist
  // - Landing page: "/"
  // - Auth callback: "/auth/callback"
  // - Public candidate reviews: "/api/reviews"
  // - Public leaderboard: "/api/leaderboard"
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/reviews') ||
    pathname.startsWith('/api/leaderboard');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed if Supabase configuration is missing or placeholder
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('sample-project')) {
    if (isPublicRoute) {
      return NextResponse.next();
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Supabase is not configured' },
        { status: 401 }
      );
    }
    const errUrl = new URL('/', getCanonicalOrigin(request.url));
    errUrl.searchParams.set('auth_error', 'supabase_not_configured');
    return NextResponse.redirect(errUrl);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes through
  if (isPublicRoute) {
    return supabaseResponse;
  }

  // Deny unauthenticated access
  if (!user) {
    // API routes receive 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    // Page routes redirect to landing page with safe relative next param
    const safeNext =
      pathname.startsWith('/') && !pathname.startsWith('//')
        ? `${pathname}${search}`
        : '';

    const loginUrl = new URL('/', getCanonicalOrigin(request.url));
    if (safeNext) {
      loginUrl.searchParams.set('next', safeNext);
    }
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
