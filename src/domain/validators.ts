/** RF-PAT-01, RF-PAT-03: Argentine license plate formats AA000AA (new) and ABC123 (old) */
export function validarDominio(dominio: string): { valido: boolean; error?: string } {
  const normalizado = normalizarDominio(dominio);
  const nuevo = /^[A-Z]{2}\d{3}[A-Z]{2}$/;
  const viejo = /^[A-Z]{3}\d{3}$/;

  if (nuevo.test(normalizado) || viejo.test(normalizado)) {
    return { valido: true };
  }
  return { valido: false, error: 'Formato inválido. Use AA000AA (nuevo) o ABC123 (viejo)' };
}

export function normalizarDominio(dominio: string): string {
  return dominio.toUpperCase().replace(/[\s\-_]/g, '');
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefono(telefono: string): boolean {
  return /^\+?[\d\s\-()\\.]{7,20}$/.test(telefono.trim());
}

export function validarDuracion(minutos: number): { valido: boolean; error?: string } {
  if (!Number.isInteger(minutos) || minutos <= 0) {
    return { valido: false, error: 'La duración debe ser mayor a 0 minutos' };
  }
  if (minutos > 1440) {
    return { valido: false, error: 'La duración máxima es 24 horas' };
  }
  return { valido: true };
}
