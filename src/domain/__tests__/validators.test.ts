import { describe, it, expect } from 'vitest';
import { validarDominio, normalizarDominio, validarEmail, validarTelefono } from '../validators';

describe('validarDominio', () => {
  // Valid new format AA000AA
  it('AA123BB — válido (nuevo)', () => expect(validarDominio('AA123BB').valido).toBe(true));
  it('ab123cd minúsculas — válido (normaliza)', () => expect(validarDominio('ab123cd').valido).toBe(true));
  it('AB 123 CD con espacios — válido', () => expect(validarDominio('AB 123 CD').valido).toBe(true));

  // Valid old format ABC123
  it('ABC123 — válido (viejo)', () => expect(validarDominio('ABC123').valido).toBe(true));
  it('xyz789 minúsculas — válido', () => expect(validarDominio('xyz789').valido).toBe(true));

  // Invalid
  it('cadena vacía — inválido', () => expect(validarDominio('').valido).toBe(false));
  it('123ABC — válido (moto vieja)', () => expect(validarDominio('123ABC').valido).toBe(true));
  it('ABCDEFG — inválido (solo letras)', () => expect(validarDominio('ABCDEFG').valido).toBe(false));
  it('AB12CD — inválido (faltan dígitos)', () => expect(validarDominio('AB12CD').valido).toBe(false));
  it('demasiado largo — inválido', () => expect(validarDominio('AB12345CD').valido).toBe(false));
  it('AB-123-CD con guiones — válido (normaliza)', () => expect(validarDominio('AB-123-CD').valido).toBe(true));
});

describe('validarDominio — formatos de moto', () => {
  it('A123AAA — válido (moto Mercosur)', () => expect(validarDominio('A123AAA').valido).toBe(true));
  it('123ABC — válido (moto vieja)', () => expect(validarDominio('123ABC').valido).toBe(true));
  it('a123bcd minúsculas — válido (moto Mercosur, normaliza)', () => expect(validarDominio('a123bcd').valido).toBe(true));
  it('1A2345 — inválido (formato mezclado)', () => expect(validarDominio('1A2345').valido).toBe(false));
});

describe('normalizarDominio', () => {
  it('elimina espacios y convierte a mayúsculas', () => {
    expect(normalizarDominio('ab 123 cd')).toBe('AB123CD');
  });
  it('elimina guiones', () => {
    expect(normalizarDominio('AB-123-CD')).toBe('AB123CD');
  });
});

describe('validarEmail', () => {
  it('email válido', () => expect(validarEmail('test@example.com')).toBe(true));
  it('sin @', () => expect(validarEmail('testexample.com')).toBe(false));
  it('sin dominio', () => expect(validarEmail('test@')).toBe(false));
});

describe('validarTelefono', () => {
  it('número argentino', () => expect(validarTelefono('387-4501234')).toBe(true));
  it('con prefijo +', () => expect(validarTelefono('+54 387 4501234')).toBe(true));
  it('demasiado corto', () => expect(validarTelefono('123')).toBe(false));
});
