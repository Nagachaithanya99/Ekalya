let tokenGetter = null;

/**
 * Call this once from a React component where you have access to useAuth().getToken
 */
export function setTokenGetter(fn) {
  tokenGetter = fn;
}

export async function getAuthToken() {
  if (!tokenGetter) {
    throw new Error("Token getter not set. Call setTokenGetter(getToken) once.");
  }
  const token = await tokenGetter();
  if (!token) throw new Error("No auth token available (not signed in?)");
  return token;
}
