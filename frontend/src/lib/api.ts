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
  
  const defaultProdBackend = "https://taxa-backend-10i9.onrender.com";

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Check if running locally (localhost, loopback, or private/local network)
    const isLocal = 
      hostname === "localhost" || 
      hostname === "127.0.0.1" || 
      hostname === "[::1]" || 
      hostname.startsWith("192.168.") || 
      hostname.startsWith("10.") || 
      hostname.endsWith(".local");
      
    if (isLocal) {
      return `${protocol}//${hostname}:8000`;
    } else {
      return defaultProdBackend;
    }
  }
  
  return "http://localhost:8000";
}
