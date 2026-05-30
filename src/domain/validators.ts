/** RF-PAT-01, RF-PAT-03: Argentine license plate formats */
export function validarDominio(dominio: string): { valido: boolean; error?: string; formato?: string } {
  const normalizado = normalizarDominio(dominio);

  const formatos = [
    { regex: /^[A-Z]{2}\d{3}[A-Z]{2}$/, nombre: 'Mercosur auto (AA123AA)' },
    { regex: /^[A-Z]{3}\d{3}$/, nombre: 'Nacional auto (ABC123)' },
    { regex: /^[A-Z]\d{3}[A-Z]{3}$/, nombre: 'Mercosur moto (A123AAA)' },
    { regex: /^\d{3}[A-Z]{3}$/, nombre: 'Nacional moto (123ABC)' },
  ];

  for (const formato of formatos) {
    if (formato.regex.test(normalizado)) {
      return { valido: true, formato: formato.nombre };
    }
  }

  return {
    valido: false,
    error: 'Formato inválido. Formatos válidos: AA123AA (auto), ABC123 (auto viejo), A123AAA (moto), 123ABC (moto vieja)',
  };
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
  if (!Number.isInteger(minutos) || minutos < 60) {
    return { valido: false, error: 'La duración mínima es 1 hora' };
  }
  if (minutos > 1440) {
    return { valido: false, error: 'La duración máxima es 24 horas' };
  }
  return { valido: true };
}
