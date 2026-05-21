/**
 * Resolves the backend API base URL dynamically.
 * 1. Prioritizes the environment variable `NEXT_PUBLIC_API_URL` if defined.
 * 2. If running on client browser, resolves dynamically using current hostname to enable multi-device (mobile, tablet, laptop) connections in same network.
 * 3. Falls back to local development environment on port 8000.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    // Keep port 8000 if we are on a custom local host/IP address
    return `${protocol}//${hostname}:8000`;
  }
  
  return "http://localhost:8000";
}
