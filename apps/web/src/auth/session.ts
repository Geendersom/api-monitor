const AUTH_STORAGE_KEY = "api-monitor-authenticated";

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(AUTH_STORAGE_KEY) === "true";
};

export const setAuthenticated = (): void => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
};

export const clearAuthenticated = (): void => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
};
