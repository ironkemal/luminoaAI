import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Personal Smart Fitness Platform uses client PIN lock screen
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
