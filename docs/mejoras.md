# Mejoras propuestas — SEM Digital

Estado actual: MVP hackathon funcional con mocks para MercadoPago, OCR y notificaciones. Todas las páginas están completas. Las mejoras están ordenadas por impacto y esfuerzo.

---

## 1. Integración real de MercadoPago

**Por qué:** El flujo de pago actual usa un simulador que siempre devuelve éxito. Para cobrar de verdad se necesita el SDK oficial.

**Qué cambiar:**

### 1a. API route para crear preferencia de pago

Crear `/src/app/api/pagos/crear/route.ts`:

```ts
import MercadoPago from 'mercadopago';

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(req: Request) {
  const { monto, dominio, cuadra, duracion } = await req.json();

  const preference = await mp.preferences.create({
    items: [{ title: `Estacionamiento ${cuadra}`, quantity: 1, unit_price: monto }],
    external_reference: `SEM-${dominio}-${Date.now()}`,
    notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
    back_urls: {
      success: `${process.env.APP_URL}/conductor/pagar?estado=ok`,
      failure: `${process.env.APP_URL}/conductor/pagar?estado=error`,
    },
  });

  return Response.json({ preferenceId: preference.id });
}
```

### 1b. Webhook para confirmar pagos

Crear `/src/app/api/webhooks/mercadopago/route.ts`:

```ts
export async function POST(req: Request) {
  const body = await req.json();
  if (body.type !== 'payment') return Response.json({ ok: true });

  const pago = await mp.payments.get({ id: body.data.id });
  if (pago.status === 'approved') {
    // Actualizar ticket en store/BD usando pago.external_reference
  }

  return Response.json({ received: true });
}
```

### 1c. Payment Brick en el frontend

Reemplazar `src/components/mercadopago-simulator.tsx` con `src/components/mercadopago-brick.tsx`:

```tsx
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

export function MercadoPagoBrick({ preferenceId, onSuccess }: Props) {
  return (
    <Payment
      initialization={{ preferenceId }}
      onSubmit={async ({ formData }) => {
        const res = await fetch('/api/pagos/procesar', { method: 'POST', body: JSON.stringify(formData) });
        if (res.ok) onSuccess();
      }}
    />
  );
}
```

**Variables de entorno necesarias** (`.env.local`):

```
MP_ACCESS_TOKEN=APP_USR-...       # Token de producción/sandbox
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-... # Clave pública
MP_WEBHOOK_SECRET=...              # Para validar firma de webhooks
APP_URL=https://tu-dominio.com
```

**Paquetes a instalar:**

```bash
npm install mercadopago @mercadopago/sdk-react
```

**Archivos a modificar:**

| Archivo | Acción |
|---|---|
| `src/lib/mock-mercadopago.ts` | Eliminar |
| `src/components/mercadopago-simulator.tsx` | Reemplazar por Brick |
| `src/components/payment-wizard.tsx` | Usar Brick + llamar API |
| `src/app/api/pagos/crear/route.ts` | Crear |
| `src/app/api/webhooks/mercadopago/route.ts` | Crear |

---

## 2. Lector de patentes mejorado (Plate Recognizer + Cámara en vivo) - IMPLEMENTADO

**Estado:** Implementado con fallback en cascada.

**Qué se implementó:**
- **Plate Recognizer API** como motor primario (cloud, especializado en patentes argentinas, `regions=ar` con `region=strict`)
- **Cámara en vivo** con overlay guía para encuadrar la patente (`getUserMedia`)
- **Fallback a Tesseract.js** cuando Plate Recognizer no está disponible o falla
- **Pre-procesamiento de imagen** (grayscale, contraste, resize) antes de OCR local
- **Pre-carga del worker** de Tesseract en layout del permisionario
- **Indicador de confianza** (Alta/Media/Baja) y fuente del resultado (Plate Recognizer / Tesseract)
- **Validación de formatos de moto** (A123AAA Mercosur moto, 123ABC moto vieja)
- **Componente unificado PlateInput** eliminando duplicación con PatenteInput inline

**Archivos nuevos:**
| Archivo | Propósito |
|---|---|
| `src/lib/plate-recognizer.ts` | Servicio Plate Recognizer + función unificada `scanPlate()` |
| `src/components/camera-capture.tsx` | Componente de cámara en vivo con overlay guía |
| `src/app/api/ocr/patente/route.ts` | API route proxy para Plate Recognizer (oculta el token) |
| `src/lib/env.ts` | Variables de entorno tipadas |
| `src/app/permisionario/layout.tsx` | Pre-carga del worker Tesseract |

**Archivos modificados:**
| Archivo | Cambio |
|---|---|
| `src/lib/ocr.ts` | Pre-procesamiento de imagen, worker compartido, función `extractPlate()` |
| `src/components/plate-input.tsx` | Integración con CameraCapture + scanPlate unificado + badge de confianza |
| `src/app/permisionario/page.tsx` | Eliminado PatenteInput inline, usa PlateInput compartido |
| `src/domain/validators.ts` | Agregados formatos de moto |

**Variables de entorno necesarias:**
```
PLATE_RECOGNIZER_API_TOKEN=TU_TOKEN_AQUI
```

Obtener token en: https://app.platerecognizer.com/accounts/signup/ (Free tier: 2,500 lookups/mes)

**Limitaciones conocidas:**
- Free tier de Plate Recognizer: 2,500 lookups/mes, 1 request/segundo
- Si no hay token configurado, el sistema cae automáticamente a Tesseract.js local
- La cámara en vivo requiere HTTPS en producción (funciona en localhost para desarrollo)

---

## 3. Mejoras UX / Visuales

### 3a. Pantallas de "sin usuario seleccionado" más informativas

**Problema:** Varias páginas del permisionario muestran solo "Primero seleccioná tu usuario" con un botón Volver sin contexto.

**Afecta:** `/permisionario/credencial`, `/permisionario/actividad`, `/permisionario/incumplimiento`, `/permisionario/hora-extra`

**Propuesta:** Reemplazar el mensaje genérico por un estado vacío visual:

```tsx
// Ejemplo para credencial
<div className="flex flex-col items-center gap-4 py-16 px-6 text-center">
  <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
    <User className="w-10 h-10 text-amber-600" />
  </div>
  <h2 className="text-xl font-bold text-gray-800">Seleccioná tu perfil</h2>
  <p className="text-gray-500 text-sm">
    Para ver tu credencial primero tenés que elegir tu usuario en la pantalla principal.
  </p>
  <Link href="/permisionario" className="btn-xl bg-amber-600 text-white">
    Ir al inicio
  </Link>
</div>
```

### 3b. Confirmación visual al seleccionar cuadra en el pago

**Problema:** Al seleccionar una cuadra en el PaymentWizard no hay feedback visual de "estás aquí".

**Propuesta:** Mostrar una card de resumen debajo del selector cuando hay cuadra elegida:

```tsx
{selectedCuadra && (
  <div className="flex items-center gap-3 p-3 bg-municipal-50 border border-municipal-200 rounded-xl">
    <MapPin className="w-5 h-5 text-municipal-600 flex-shrink-0" />
    <div>
      <p className="font-semibold text-municipal-800">{selectedCuadra}</p>
      <p className="text-xs text-municipal-600">{zona?.nombre}</p>
    </div>
    <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
  </div>
)}
```

### 3c. Botón de pago sticky en móvil

**Problema:** En el formulario de pago el botón "Continuar al pago" queda al final de un form largo y el usuario no lo ve sin scrollear.

**Propuesta:** Separar el precio + botón en un footer sticky dentro del formulario:

```tsx
{/* Formulario de datos */}
<div className="space-y-5 pb-28">
  {/* PlateInput, cuadras, tipo, duración */}
</div>

{/* Footer sticky con precio y acción */}
<div className="fixed bottom-16 inset-x-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3 z-20">
  <div className="flex-1">
    <p className="text-xs text-gray-500">Total con 20% off</p>
    <p className="text-xl font-bold text-gray-900">${monto.toLocaleString('es-AR')}</p>
  </div>
  <button
    onClick={handleNext}
    disabled={!isValid}
    className="btn-xl bg-municipal-600 text-white disabled:bg-gray-200 disabled:text-gray-400 px-8"
  >
    Pagar
  </button>
</div>
```

### 3d. Spinner de carga durante el pago

**Problema:** Cuando se procesa el pago (Brick de MP o simulador) no hay feedback visual de "en proceso".

**Propuesta:** Crear `src/components/loading-spinner.tsx` y usarlo mientras MP procesa:

```tsx
export function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="w-10 h-10 border-4 border-municipal-200 border-t-municipal-600 rounded-full animate-spin" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
```

### 3e. Mejorar el estado vacío del historial

**Problema:** `/conductor/historial` muestra "Sin estacionamientos registrados" con un ícono de reloj sin acción.

**Propuesta:** Botón de acción directo al flujo de pago:

```tsx
// Actualmente ya tiene el botón "Estacionar ahora" — mejorar el ícono y el texto
<div className="py-16 text-center space-y-4">
  <Car className="w-16 h-16 text-gray-200 mx-auto" />
  <div>
    <p className="font-semibold text-gray-700">Todavía no estacionaste</p>
    <p className="text-sm text-gray-400 mt-1">Tu historial aparecerá aquí</p>
  </div>
  <Link href="/conductor/pagar" className="btn-xl bg-blue-600 text-white inline-flex items-center gap-2">
    <Car className="w-4 h-4" /> Estacionar ahora
  </Link>
</div>
```

---

## 4. Mejoras técnicas / código

### 4a. Error boundaries por ruta

**Problema:** Si `localStorage` falla (modo privado, cuota llena) la app crashea silenciosamente.

**Propuesta:** Agregar `error.tsx` en cada segmento de ruta:

```tsx
// src/app/conductor/error.tsx
'use client';

export default function ErrorConductor({ reset }: { reset: () => void }) {
  return (
    <div className="p-8 text-center space-y-4">
      <p className="text-lg font-semibold text-gray-800">Algo salió mal</p>
      <p className="text-sm text-gray-500">Intentá recargar o limpiar los datos de demo.</p>
      <button onClick={reset} className="btn-xl bg-blue-600 text-white">Reintentar</button>
    </div>
  );
}
```

Crear un `error.tsx` en: `src/app/conductor/`, `src/app/permisionario/`, `src/app/admin/`, `src/app/portal/`.

### 4b. Múltiples patentes por conductor (RF-USR-02)

**Problema:** `Conductor` solo tiene `dominioDefault: string`. El SRS permite múltiples vehículos.

**Propuesta:** Extender el tipo y la UI:

```ts
// src/domain/types.ts
export interface Conductor {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  dominios: string[];         // Lista de dominios registrados
  dominioDefault: string;     // Vehículo seleccionado por defecto
  createdAt: string;
}
```

En `/conductor/pagar`, agregar selector de vehículo si hay más de uno:

```tsx
{conductor.dominios.length > 1 && (
  <div className="space-y-2">
    <label>¿Con qué vehículo?</label>
    <div className="flex gap-2 flex-wrap">
      {conductor.dominios.map(d => (
        <button key={d} onClick={() => setDominio(d)}
          className={d === dominio ? 'border-municipal-600 bg-municipal-50' : 'border-gray-200'}>
          {d}
        </button>
      ))}
    </div>
  </div>
)}
```

### 4c. Tests faltantes

Agregar en `src/lib/__tests__/sem-store.test.ts`:

- `transferirTicketACuadra()` — valida que el ticket mantiene vencimiento original
- Generación de deuda automática por overstay — ticket vencido → `deudaStore.create()`
- `pagoStore.getByPermisionario()` con filtro de fecha para liquidaciones

### 4d. Mocks más realistas (mientras no haya backend)

Modificar `src/lib/mock-mercadopago.ts` para simular fallos reales:

```ts
export async function mockMPPagar(): Promise<{ ok: boolean; transactionId?: string; error?: string }> {
  const failRate = parseFloat(process.env.NEXT_PUBLIC_MP_MOCK_FAILURE_RATE ?? '0');
  const rand = Math.random();

  await sleep(800 + Math.random() * 1200); // 800ms - 2000ms de latencia variable

  if (rand < failRate * 0.8) return { ok: false, error: 'Tarjeta rechazada' };
  if (rand < failRate) return { ok: false, error: 'Fondos insuficientes' };

  return { ok: true, transactionId: `MP-${generateId()}` };
}
```

Agregar a `.env.local`:

```
NEXT_PUBLIC_MP_MOCK_FAILURE_RATE=0.05   # 5% de fallos en desarrollo
```

### 4e. Centralizar validación de entrada con Zod

**Problema:** Validaciones dispersas en varios componentes y archivos de dominio.

**Propuesta:** Agregar `zod` y crear schemas reutilizables:

```bash
npm install zod
```

```ts
// src/domain/schemas.ts
import { z } from 'zod';

export const crearTicketSchema = z.object({
  dominio: z.string().regex(/^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/),
  duracionMinutos: z.number().min(30).max(180).multipleOf(30),
  metodoPago: z.enum(['efectivo', 'digital']),
  cuadra: z.string().min(1),
});

export const registrarPagoSchema = crearTicketSchema.extend({
  permisionarioId: z.string().min(1),
});
```

---

## Resumen de prioridades

| # | Mejora | Esfuerzo | Impacto |
|---|---|---|---|
| 1 | MercadoPago real (Brick + API routes + webhook) | Alto | Crítico |
| 2 | OCR real con Tesseract.js + cámara | Medio | Alto |
| 3c | Botón de pago sticky en móvil | Bajo | Alto |
| 3a | Estados vacíos informativos | Bajo | Medio |
| 4a | Error boundaries por ruta | Bajo | Medio |
| 3b | Confirmación visual de cuadra | Bajo | Medio |
| 4b | Múltiples patentes por conductor | Medio | Medio |
| 4c | Tests faltantes | Medio | Medio |
| 3d | Spinner de carga | Bajo | Bajo |
| 4d | Mocks con fallos realistas | Bajo | Bajo |
| 4e | Schemas con Zod | Medio | Bajo |
