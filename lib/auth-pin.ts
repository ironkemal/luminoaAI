/**
 * Single-user PIN Authentication & Screen Lock
 */

const PIN_STORAGE_KEY = "lumino_fitness_pin";
const AUTH_STATE_KEY = "lumino_fitness_unlocked";
const DEFAULT_PIN = "1234";

export function getStoredPin(): string {
  if (typeof window === "undefined") return DEFAULT_PIN;
  return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
}

export function setCustomPin(newPin: string): boolean {
  if (!newPin || newPin.length < 4 || newPin.length > 6) return false;
  if (typeof window === "undefined") return false;
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
  return true;
}

export function isAppUnlocked(): boolean {
  if (typeof window === "undefined") return true;
  return sessionStorage.getItem(AUTH_STATE_KEY) === "true";
}

export function verifyPin(inputPin: string): boolean {
  const currentPin = getStoredPin();
  if (inputPin === currentPin) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(AUTH_STATE_KEY, "true");
    }
    return true;
  }
  return false;
}

export function lockApp(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(AUTH_STATE_KEY);
  }
}
