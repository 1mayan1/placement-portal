/**
 * Next.js Middleware — runs on EVERY request before the page loads.
 *
 * Rules:
 * - Not logged in → always redirect to /login
 * - Logged in as student trying to access /tpo/* → redirect to /student/dashboard
 * - Logged in as TPO trying to access /student/* → redirect to /tpo/dashboard
 * - Logged in user visiting /login or /signup → redirect to their dashboard
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // Redirect logged-in users away from login/signup pages
    if (pathname === "/login" || pathname === "/signup") {
      if (role === "student") {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
      if (role === "tpo") {
        return NextResponse.redirect(new URL("/tpo/dashboard", req.url));
      }
    }

    // Block students from TPO pages
    if (pathname.startsWith("/tpo") && role !== "tpo") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }

    // Block TPO from student pages
    if (pathname.startsWith("/student") && role !== "student") {
      return NextResponse.redirect(new URL("/tpo/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true = allow through to the middleware function above
      // Return false = redirect to the signIn page (/login)
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Public pages don't need a token
        if (pathname === "/login" || pathname === "/signup" || pathname === "/") {
          return true;
        }
        // Everything else requires being logged in
        return !!token;
      },
    },
  }
);

// Tell Next.js which routes this middleware applies to
export const config = {
  matcher: [
    "/student/:path*",
    "/tpo/:path*",
    "/login",
    "/signup",
  ],
};
