// src/utils/sessionUtils.ts

/**
 * Utilidades para manejar la sesión de forma segura
 */

// Almacena solo el ID del usuario autenticado, no todo el certificado
export const setAuthenticatedUser = (userID: string): void => {
  sessionStorage.setItem('authenticated_user_id', userID);
};

// Obtiene el ID del usuario autenticado
export const getAuthenticatedUser = (): string | null => {
  return sessionStorage.getItem('authenticated_user_id');
};

// Verifica si hay un usuario autenticado
export const isAuthenticated = (): boolean => {
  return !!getAuthenticatedUser();
};

// Cierra la sesión
export const logout = (): void => {
  sessionStorage.removeItem('authenticated_user_id');
};