import { NextResponse } from 'next/server';

export function middleware(request) {
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '*';

    // Create a new response
    const response = NextResponse.next();

    // Add the CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');

    return response;
}

// Configure which paths should be processed by this middleware
export const config = {
    matcher: '/api/:path*',
};