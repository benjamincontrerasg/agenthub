/**
 * Configuración central de modo Backend vs Mock.
 * Por defecto es modo Backend (false).
 * Solo se activa mock si VITE_USE_MOCKS=true está explícitamente configurado.
 */
export const isMockMode = (): boolean => {
  return import.meta.env.VITE_USE_MOCKS === 'true';
};
