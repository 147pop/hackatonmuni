# OCR real para permisionario

Fecha: 2026-05-29

## Objetivo

Implementar lectura real de patentes desde navegador para el flujo del permisionario, priorizando uso en telefonos. El OCR reemplaza la simulacion actual solo para operaciones del permisionario y mantiene ingreso manual como fallback obligatorio.

## Alcance

El OCR real aplica a:

- Registro de pago efectivo.
- Registro de incumplimiento.
- Cobro de hora extra.
- Busqueda por patente en actividad.

El conductor y el portal publico pueden seguir usando el comportamiento actual por ahora. El cambio debe quedar preparado para extender OCR real a esos flujos despues.

## Enfoque elegido

Usar OCR cliente-only con camara del navegador y Tesseract.js.

El permisionario abre un lector desde el input de dominio. La app solicita la camara trasera con `facingMode: environment`, muestra un visor mobile-first, captura un frame en canvas y ejecuta OCR localmente. El resultado se normaliza y se valida contra los formatos argentinos existentes:

- `AA123AA`
- `ABC123`

Si se detecta una patente valida, el campo se completa automaticamente. Si falla, el usuario puede reintentar o cargar el dominio manualmente.

## Arquitectura

### `src/lib/ocr.ts`

Responsabilidades:

- Ejecutar OCR sobre `HTMLCanvasElement`, `ImageData`, `Blob` o data URL.
- Normalizar texto OCR.
- Extraer candidatos de dominio argentino desde texto ruidoso.
- Validar candidatos usando el validador de dominio existente.
- Devolver un resultado tipado con estado, dominio detectado, confianza opcional y texto bruto.

### `src/components/plate-ocr-scanner.tsx`

Modal mobile-first para permisionario:

- Solicita permisos de camara solo al abrirse.
- Usa camara trasera cuando el dispositivo la permite.
- Muestra visor de video con guia visual para encuadrar patente.
- Permite capturar, procesar, reintentar y cancelar.
- Libera el stream al cerrar.
- Expone `onDetected(dominio)` y `onCancel()`.

### `src/components/plate-input.tsx`

Mantiene el input manual y agrega un modo de OCR:

- `ocrMode="real"`: abre `PlateOcrScanner`.
- `ocrMode="mock"`: usa simulacion actual.
- `ocrMode="off"`: oculta OCR.

Por defecto puede seguir en mock para no cambiar flujos no incluidos. Las paginas de permisionario pasan `ocrMode="real"`.

## Flujo de usuario

1. El permisionario toca el boton OCR junto al campo de dominio.
2. La app abre el visor de camara.
3. El permisionario encuadra la patente y toca capturar.
4. La app procesa la imagen localmente con Tesseract.js.
5. Si encuentra una patente valida, completa el input y cierra el visor.
6. Si no detecta una patente valida, muestra error y permite reintentar o volver a carga manual.

## Manejo de errores

- Sin permisos de camara: informar el problema y mantener carga manual.
- Camara no disponible o contexto no seguro: informar que el navegador no permite camara y mantener carga manual.
- OCR sin resultado valido: mostrar mensaje corto y permitir reintento.
- Error de Tesseract o timeout: mostrar error y permitir reintento.
- Resultado invalido: no completar el campo hasta que pase `validarDominio`.

## Performance

- Cargar Tesseract.js de forma diferida al iniciar OCR, no en el bundle inicial de la app.
- Procesar una captura por vez.
- Preferir resolucion acotada del canvas para reducir costo en telefonos.
- Mostrar estado de lectura durante el procesamiento.

## Privacidad

La imagen no se sube a ningun backend. El procesamiento ocurre en el navegador del dispositivo. No se persiste la foto capturada; solo se usa para extraer el dominio.

## Tests

- Unit tests de normalizacion y extraccion de patente desde texto OCR ruidoso.
- Component tests con mocks de `navigator.mediaDevices.getUserMedia` y resultado OCR.
- E2E minimo para permisionario: boton OCR visible y carga manual sigue funcionando si OCR no se usa.

## Fuera de alcance inicial

- OCR backend.
- Reconocimiento continuo en video sin boton capturar.
- Guardar fotos como evidencia.
- Mejoras por IA/vision especializada.
- OCR real en conductor y portal publico.
