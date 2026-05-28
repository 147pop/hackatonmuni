# SEM Digital — Plan de Implementacion MVP

**Objetivo:** Construir un MVP web responsive completo para SEM Digital basado en `SRS_SEM_Digital.md`, cubriendo los flujos de conductor, portal publico, permisionario y administrador municipal.

**Arquitectura:** Next.js App Router con TypeScript. MVP autocontenido con mock backend en `localStorage`, servicios de dominio tipados, datos de demo seeded, y boundaries claros para reemplazar mocks por integraciones reales despues.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, React Testing Library, Playwright, lucide-react.

**Cobertura:** 75 requisitos del SRS (61 Alta + 14 Media). Prioridad Baja excluida (RF-USR-02).

**Duracion:** 1 dia por sprint, 7 sprints (0-6).

---

## Reglas de Alcance

- Web responsive, no apps nativas mobile.
- Simular QR, OCR, MercadoPago, notificaciones y geolocalizacion (ver tabla de simulaciones).
- Sin autenticacion real: role switcher + usuarios seeded.
- Persistencia demo en `localStorage` con reset a datos iniciales.
- Priorizar happy paths primero, luego validacion y edge cases.
- No implementar pagos reales, Web Push real, MFA, ni seguridad de produccion.

## Simulaciones Explicitas

Toda feature simulada lleva badge `[SIMULACION]` visible en la UI.

| Componente | Implementacion |
|-----------|---------------|
| QR scanning | Dropdown/boton para seleccionar permisionario (no camara real) |
| OCR patente | Boton que llena input con placa seeded + delay simulado |
| MercadoPago | `mock-mercadopago.ts` con estados deterministas pending/success |
| Notificaciones | Toast/banner in-app almacenados en state (no Web Push/SMS) |
| Geolocalizacion | Coordenadas GPS fijas por cuadra seeded |
| Auth/MFA | Role switcher + usuarios seeded, sin auth real |
| Liquidacion transfer | Calculo real, transferencia = cambio de estado en localStorage |
| Tiempo real admin | Polling/re-render desde store compartido (no WebSocket) |

## Grafo de Dependencias

```
Sprint 0 (Fundacion)
    |
    v
Sprint 1 (Modelo de Dominio + Mock Backend)
    |
    +---> Sprint 2 (Permisionario) ---> Sprint 3 (Conductor + Portal)
    |                                        |
    +---> Sprint 4 (Admin Config) -----------+
                |                            |
                v                            v
           Sprint 5 (Admin Dashboard) <------+
                |
                v
           Sprint 6 (Integracion + Demo)
```

**Nota:** Permisionario se construye ANTES que conductor porque el conductor escanea el QR del permisionario, consulta deudas generadas por el permisionario, y recibe datos de la credencial digital. Construir oferta antes que demanda = cada sprint usa datos reales del anterior.

---

## Sprint 0: Fundacion del Proyecto

**Objetivo:** Crear la estructura del proyecto y shell compartido necesario para todos los sprints.

**Modulos SRS:** Infraestructura (ninguno directo).

**Dependencias:** Ninguna.

### Tareas

1. Scaffold Next.js App Router + TypeScript + Tailwind + Vitest + Playwright.
2. Shell responsive global (mobile: bottom nav, desktop: sidebar) con tipografia y tokens de color para UI municipal.
3. Role switcher con roles: Conductor, Portal Publico, Permisionario, Admin (sub-roles: administrador, supervisor, consulta).
4. Estructura de rutas para las 4 areas de usuario + sub-rutas admin.
5. Landing page operacional con role cards (no marketing).
6. Scripts CI en `package.json`: `lint`, `test`, `test:e2e`, `build`.
7. Smoke test E2E basico.

### Archivos

- `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/components/app-shell.tsx`, `src/components/role-switcher.tsx`
- `src/lib/routes.ts`
- `tests/smoke/home.spec.ts`

### Tests

- `npm run lint` — sin errores.
- `npm run build` — build de produccion completa.
- `npm run test:e2e -- tests/smoke/home.spec.ts` — home renderiza 4 roles, navegacion funciona.

### Criterios de Aceptacion

- App abre en mobile y desktop sin scroll horizontal.
- Primera pantalla es operacional, no landing de marketing.
- Navegacion expone todas las areas MVP (pueden ser placeholders).
- Role switcher persiste seleccion en localStorage.

---

## Sprint 1: Modelo de Dominio + Reglas de Negocio + Mock Backend

**Objetivo:** Implementar toda la logica de negocio, tipos, validacion, calculo y gestion de estado — testeable sin UI.

**Modulos SRS:** RF-EST (reglas estacionamiento), RF-NOR (cumplimiento normativo), RF-PAG (logica de calculo), RF-PAT (validacion patentes).

**Dependencias:** Sprint 0.

### Tareas con RF-IDs

1. **Tipos de dominio** — definir entidades: `Permisionario`, `Conductor`, `Vehiculo`, `Estacionamiento`, `Pago`, `Deuda`, `Emergencia`, `Tarifa`, `Zona`, `Feriado`, `Liquidacion`, `AuditEvent`, `ConfiguracionNormativa`. Campos segun RF-PAG-12, RF-PAT-05, RF-EME-05.

2. **Calculo tarifario** — tarifa base $700/hr vehiculo, $300/hr moto (RF-EST-02). Descuento 20% digital automatico (RF-PAG-07, RF-NOR-04). Fraccionamiento 15 min a partir de 2da hora (RF-EST-04, RF-NOR-05). Tolerancia 5 min al inicio (RF-EST-03, RF-NOR-06).

3. **Validacion horaria** — turno diurno L-V 07:00-21:00, Sab 07:00-14:00 (RF-NOR-01). Bloqueo en feriados y no laborables (RF-NOR-02, RF-EST-07). Turno nocturno 22:00-05:00 solo en zonas configuradas (RF-NOR-03, RF-EST-08). Timestamp de servidor, no manual (RF-EST-09).

4. **Validacion patentes** — formatos argentinos AA000AA y ABC123 (RF-PAT-01, RF-PAT-03).

5. **Gestion de tiempo** — tiempo restante de ticket, transferencia entre cuadras sin costo adicional si hay tiempo pagado (RF-EST-05). Logica de extension de tiempo (RF-USR-08). Umbral de notificacion 5 min antes de vencimiento (RF-USR-07).

6. **Validacion permisionario** — solo opera en cuadra asignada y horario autorizado (RF-PER-08).

7. **Calculo liquidacion** — total recaudado en cuadra menos 20% cuota municipal (RF-PER-05).

8. **Store localStorage** — CRUD para todas las entidades. Registro automatico de audit events (RF-ADM-07). Seed data inicial. Funcion reset-to-demo.

9. **Mock services** — `mock-mercadopago.ts` (estados deterministas, simula redirect), `mock-ocr.ts` (retorna placa despues de delay), `mock-geolocation.ts` (coordenadas por cuadra), `mock-notifications.ts` (cola in-app).

10. **Seed data** — 3 permisionarios con cuadras asignadas, 5 vehiculos con estados mixtos, 2 deudas existentes, configuracion de tarifas, 3 feriados, 2 zonas nocturnas.

### Archivos

- `src/domain/types.ts`, `src/domain/seed.ts`, `src/domain/rules.ts`, `src/domain/calculations.ts`, `src/domain/validators.ts`
- `src/lib/storage.ts`, `src/lib/sem-store.ts`
- `src/lib/mock-mercadopago.ts`, `src/lib/mock-ocr.ts`, `src/lib/mock-geolocation.ts`, `src/lib/mock-notifications.ts`
- `src/components/reset-demo-data-button.tsx`
- `src/domain/__tests__/calculations.test.ts`, `src/domain/__tests__/rules.test.ts`, `src/domain/__tests__/validators.test.ts`
- `src/lib/__tests__/sem-store.test.ts`

### Tests

- `npm run test -- src/domain/__tests__/calculations.test.ts` — montos correctos para vehiculo, moto, descuento digital, fraccionamiento.
- `npm run test -- src/domain/__tests__/rules.test.ts` — ventanas de estacionamiento permitidas/bloqueadas segun SRS.
- `npm run test -- src/domain/__tests__/validators.test.ts` — acepta `AA123BB`, `ABC123`; rechaza formatos invalidos.
- `npm run test -- src/lib/__tests__/sem-store.test.ts` — cada accion del store muta estado y registra audit events.

### Criterios de Aceptacion

- Todos los flujos UI posteriores usan servicios de dominio — sin duplicar logica de negocio.
- Reset de datos demo restaura dataset conocido.
- Reglas de negocio cubiertas con tests ANTES de que UI dependa de ellas.
- Mock services tienen interfaces limpias que reflejan lo que las integraciones reales tendrian.

---

## Sprint 2: Operaciones del Permisionario

**Objetivo:** Interfaz completa del permisionario para operacion diaria: QR, registro efectivo, incumplimiento, credencial digital, actividad, emergencias.

**Modulos SRS:** RF-PER-01 a RF-PER-04, RF-PER-07 a RF-PER-09, RF-PAT-01 a RF-PAT-05, RF-PAT-10, RF-PAG-05, RF-PAG-06, RF-PAG-11, RF-EME-01, RF-EME-04, RF-EME-06, RF-EST-09.

**Dependencias:** Sprint 1 (modelo de dominio, store, mock services).

### Tareas con RF-IDs

1. **Dashboard permisionario** — cuadra asignada, turno actual, resumen diario (RF-PER-07). Tipografia grande (min 16px) y botones amplios para usuarios de edad avanzada (RNF-16).

2. **QR fijo** — mostrar QR unico en formato digital (pantalla) e imprimible (RF-PER-01, RF-PER-02, RF-PER-09).

3. **Credencial digital** — foto, nombre completo, numero legajo, cuadra asignada, estado activo/inactivo (RF-PER-03, RF-PER-04). Verificable al escanear QR.

4. **Componente plate-input (compartido)** — entrada manual por teclado (RF-PAT-01) + boton simulacion OCR con delay (RF-PAT-02, RF-PAT-03). Etiqueta `[SIMULACION]` en OCR. Componente reutilizable para conductor y portal.

5. **Registro pago en efectivo** — permisionario ingresa dominio, tipo vehiculo, duracion; sistema genera ticket digital con numero unico de comprobante (RF-PAG-05, RF-PAG-06, RF-EST-09). Timestamp automatico del sistema.

6. **Registro incumplimiento** — ingresar dominio de vehiculo que no paga, genera deuda con fecha, hora, cuadra, monto (RF-PAT-04, RF-PAT-05, RF-PAT-10).

7. **Notificaciones de pago** — pagos digitales entrantes aparecen como toasts (RF-PAG-11).

8. **Acciones de emergencia** — boton panico silencioso sin feedback visual/sonoro (RF-EME-01, RF-EME-06). Boton disputa visible (RF-EME-04). Ambos registran ubicacion y timestamp.

9. **Lista de actividad diaria** — vehiculos registrados, pagos digitales vs efectivo, deudas generadas (RF-PER-07).

### Archivos

- `src/app/permisionario/page.tsx`, `src/app/permisionario/registrar/page.tsx`
- `src/app/permisionario/incumplimiento/page.tsx`, `src/app/permisionario/actividad/page.tsx`
- `src/app/permisionario/credencial/page.tsx`
- `src/components/plate-input.tsx`, `src/components/qr-card.tsx`, `src/components/credencial-card.tsx`
- `src/components/cash-payment-form.tsx`, `src/components/non-payment-form.tsx`
- `src/components/emergency-actions.tsx`, `src/components/daily-summary.tsx`
- `tests/e2e/permisionario.spec.ts`

### Tests

- E2E: permisionario registra pago efectivo → ve ticket en actividad.
- E2E: permisionario registra incumplimiento → consulta de deuda por dominio lo encuentra.
- E2E: boton panico no produce feedback visible pero crea alerta en store.
- Unit: plate-input acepta formatos validos, rechaza invalidos.

### Criterios de Aceptacion

- Todas las acciones principales accesibles desde primera pantalla del permisionario.
- OCR simulado visualmente distinto de entrada manual (etiqueta `[SIMULACION]`).
- Boton panico tiene zero feedback visual/audio (RF-EME-06).
- Todos los datos persisten en localStorage y son visibles en store para admin.
- Pago efectivo y generacion de deuda usan las mismas validaciones del dominio.

---

## Sprint 3: Conductor + Portal Publico — Flujos de Pago

**Objetivo:** Flujos de pago digital del conductor registrado (via web SEM) y del conductor sin cuenta (via portal publico), consulta/pago de deudas.

**Modulos SRS:** RF-PAG-01 a RF-PAG-04, RF-PAG-07 a RF-PAG-10, RF-PAG-12, RF-USR-01, RF-USR-03 a RF-USR-08, RF-PAT-06 a RF-PAT-09, RF-EME-02, RF-EME-04, RF-EST-01, RF-EST-05.

**Dependencias:** Sprint 2 (QRs y credenciales del permisionario existen en store; componente plate-input existe).

**Nota:** Conductor y portal comparten ~80% de componentes (escanear QR, ingresar patente, elegir tiempo, pagar). Portal = conductor sin cuenta. Se construyen juntos para evitar duplicar trabajo, pero con rutas y navegacion separadas.

### Tareas — Conductor Registrado

1. **Formulario de registro** — nombre, email, telefono, un dominio (RF-USR-01). Almacenado en localStorage.

2. **Simulacion escaneo QR** — seleccionar permisionario de lista, muestra perfil verificado con foto, nombre, legajo, estado activo (RF-PAG-01, RF-USR-04, RF-USR-05, RF-PER-04).

3. **Flujo de pago digital** — ingresar dominio (reusa plate-input), seleccionar duracion, ver monto calculado con descuento 20% digital automatico (RF-PAG-03, RF-PAG-07, RF-EST-02), confirmar, simulacion MercadoPago (RF-PAG-04), recibir ticket digital (RF-PAG-12). Flujo Apendice A.1.

4. **Flujo MercadoPago directo** — variante donde usuario "viene de app MP"; dominio comunicado verbalmente al permisionario (RF-PAG-09, Apendice A.5).

5. **Vista ticket activo** — tiempo restante con countdown, cuadra actual, nota sobre transferencia a otra cuadra sin costo (RF-USR-06, RF-EST-05).

6. **Extension de tiempo** — boton para extender antes de que expire (RF-USR-08).

7. **Notificacion vencimiento** — alerta in-app 5 minutos antes de que expire (RF-USR-07).

8. **Historial** — lista de estacionamientos y pagos pasados (RF-USR-03).

9. **Consulta y pago de deudas** — buscar por dominio, ver estados pendiente/pagada/vencida, pagar via simulacion MP (RF-PAT-06, RF-PAT-08, RF-PAT-09).

10. **Emergencias conductor** — boton panico silencioso (RF-EME-02, RF-EME-06) + boton disputa (RF-EME-04).

### Tareas — Portal Publico (sin cuenta)

11. **Landing QR** — sin cuenta requerida, muestra perfil permisionario y cuadra (RF-PAG-08). Flujo Apendice A.2.

12. **Pago sin cuenta** — mismo flujo de pago que conductor menos registro. Solo necesita cuenta MercadoPago.

13. **Consulta deudas publica** — ingresar dominio, ver deudas pendientes, pagar via simulacion MP (RF-PAT-07, RF-PAT-08).

### Archivos

- `src/app/conductor/page.tsx`, `src/app/conductor/registro/page.tsx`
- `src/app/conductor/pagar/page.tsx`, `src/app/conductor/ticket/[ticketId]/page.tsx`
- `src/app/conductor/historial/page.tsx`, `src/app/conductor/deudas/page.tsx`
- `src/app/portal/page.tsx`, `src/app/portal/pagar/page.tsx`, `src/app/portal/deudas/page.tsx`
- `src/components/payment-summary.tsx`, `src/components/ticket-card.tsx`
- `src/components/mercadopago-simulator.tsx`, `src/components/debt-list.tsx`
- `src/components/time-remaining.tsx`
- `tests/e2e/conductor-payment.spec.ts`, `tests/e2e/public-portal.spec.ts`

### Tests

- E2E: conductor selecciona QR, ingresa patente, confirma pago, llega a pagina de ticket — 3 pasos mayores per RNF-15.
- E2E: portal publico paga sin cuenta y puede consultar ticket/deuda por dominio.
- E2E: extension de tiempo antes de vencimiento.
- E2E: ticket muestra eligibilidad de transferencia entre cuadras.
- Regresion: tests de dominio del Sprint 1 siguen pasando.

### Criterios de Aceptacion

- Jurado puede completar pago desde viewport mobile en 3 pasos: QR, tiempo, pago (RNF-15).
- Descuento 20% es automatico y visible en el resumen.
- Ticket muestra tiempo restante con countdown.
- Portal no requiere creacion de cuenta.
- Flujo MP directo (A.5) esta representado aunque simplificado.
- Pagos actualizan totales de admin y actividad del permisionario via estado compartido.

---

## Sprint 4: Admin — Configuracion y Gestion

**Objetivo:** Paginas de configuracion del admin y gestion de permisionarios, zonas, tarifas, feriados. El lado "escritura" del admin.

**Modulos SRS:** RF-ADM-03 a RF-ADM-06, RF-ADM-11, RF-ADM-12, RF-PER-05, RF-PER-06, RF-PER-10, RF-NOR-07, RF-NOR-08.

**Dependencias:** Sprint 1 (modelo de dominio), Sprint 2 (datos de permisionarios existen).

**Nota:** Admin se divide en dos sprints. Sprint 4 = configuracion/gestion (escrituras). Sprint 5 = dashboard/reportes/monitoreo (lecturas). Configuracion debe existir antes de que el dashboard pueda reflejar datos configurables.

### Tareas con RF-IDs

1. **Control de acceso por roles** — tres sub-roles: administrador (acceso completo), supervisor (lectura + alertas), consulta (solo lectura). Route guards en layout admin (RF-ADM-12).

2. **CRUD permisionarios** — alta, baja, modificacion, asignacion de cuadra, consulta de actividad (RF-ADM-03, RF-PER-10).

3. **Configuracion de tarifas** — editar monto/hora vehiculo y moto, porcentaje descuento digital. Sin redespliegue (RF-ADM-04, RF-NOR-08).

4. **Gestion de zonas** — configurar zonas habilitadas para turno diurno y nocturno. Agregar nuevas zonas nocturnas (RF-ADM-05, RF-NOR-07).

5. **Calendario de feriados** — CRUD de feriados nacionales/provinciales y dias no laborables (RF-ADM-06, RF-NOR-02).

6. **Liquidaciones** — calcular liquidacion por permisionario (total recaudado - 20% cuota municipal), "transferir" (simulado), ver historial de liquidaciones (RF-ADM-11, RF-PER-05, RF-PER-06).

7. **Reglas normativas configurables** — editar tolerancia (minutos), umbral fraccionamiento, parametros horario — todo sin modificar codigo (RF-NOR-08).

### Archivos

- `src/app/admin/layout.tsx` (con role guard)
- `src/app/admin/permisionarios/page.tsx`, `src/app/admin/permisionarios/[id]/page.tsx`
- `src/app/admin/configuracion/tarifas/page.tsx`, `src/app/admin/configuracion/zonas/page.tsx`
- `src/app/admin/configuracion/feriados/page.tsx`
- `src/app/admin/liquidaciones/page.tsx`
- `src/components/admin/permisionario-form.tsx`, `src/components/admin/tariff-form.tsx`
- `src/components/admin/zone-manager.tsx`, `src/components/admin/holiday-calendar.tsx`
- `src/components/admin/liquidacion-table.tsx`
- `tests/e2e/admin-config.spec.ts`

### Tests

- E2E: editar tarifa → hacer pago como conductor → verificar que nuevo monto se aplico.
- E2E: agregar feriado → verificar que pago se bloquea en esa fecha.
- E2E: rol "consulta" no puede editar configuracion.
- E2E: generar liquidacion → verificar calculo (total - 20%).

### Criterios de Aceptacion

- Cambios de tarifa afectan inmediatamente el calculo del proximo pago.
- Role guard previene que rol "consulta" edite.
- Calendario de feriados bloquea pagos en fechas configuradas.
- Calculo de liquidacion es transparente y coincide con formula RF-PER-05.
- Todas las reglas normativas son editables desde UI sin tocar codigo.

---

## Sprint 5: Admin — Dashboard, Reportes y Monitoreo

**Objetivo:** Paginas de lectura/monitoreo del admin — dashboard, reportes, auditoria, alertas. El lado "observacion" del admin.

**Modulos SRS:** RF-ADM-01, RF-ADM-02, RF-ADM-07 a RF-ADM-10, RF-EME-03, RF-EME-05, RF-EME-07.

**Dependencias:** Sprint 4 (datos de configuracion existen), Sprint 2+3 (datos de transacciones existen).

### Tareas con RF-IDs

1. **Dashboard tiempo real** — recaudacion total, estacionamientos activos, ocupacion por zona. Todo derivado del store, nada hardcodeado (RF-ADM-01).

2. **Reportes** — recaudacion por periodo (diario, semanal, mensual), por zona, por permisionario, por medio de pago. Con filtros (RF-ADM-02).

3. **Tabla de pagos** — busqueda y filtro de todos los pagos registrados (subconjunto de RF-ADM-02).

4. **Vista deudas admin** — buscar deudas por dominio, ver estado pendiente/pagada/vencida (RF-ADM-09).

5. **Log de auditoria** — trail completo: transacciones, cambios de configuracion, accesos al sistema (RF-ADM-07).

6. **Panel alertas de emergencia** — pantalla de panico/disputas activas con ubicacion GPS simulada en tiempo real (RF-ADM-08, RF-EME-03, RF-EME-05).

7. **Historial de emergencias** — log historico de todas las emergencias y disputas para auditoria (RF-EME-07).

8. **Indicadores de rendimiento** — tiempo promedio de transaccion, ratio pagos digitales vs efectivo, tasa de incumplimiento (RF-ADM-10).

### Archivos

- `src/app/admin/page.tsx` (dashboard)
- `src/app/admin/reportes/page.tsx`, `src/app/admin/pagos/page.tsx`
- `src/app/admin/deudas/page.tsx`, `src/app/admin/auditoria/page.tsx`
- `src/app/admin/alertas/page.tsx`
- `src/components/admin/metric-grid.tsx`, `src/components/admin/report-filters.tsx`
- `src/components/admin/payments-table.tsx`, `src/components/admin/debts-table.tsx`
- `src/components/admin/audit-log.tsx`, `src/components/admin/alerts-panel.tsx`
- `src/components/admin/performance-indicators.tsx`
- `tests/e2e/admin-dashboard.spec.ts`

### Tests

- E2E: dashboard muestra datos generados en sprints 2-3.
- E2E: alerta de panico del permisionario aparece en panel de alertas admin.
- E2E: indicadores de rendimiento calculan correctamente desde datos del store.
- E2E: filtros de reportes producen resultados coherentes.

### Criterios de Aceptacion

- Toda metrica se deriva del store compartido (zero valores hardcodeados).
- Admin puede filtrar reportes por al menos periodo y zona.
- Log de auditoria muestra entradas de acciones de todos los sprints anteriores.
- Indicadores de rendimiento se actualizan al ocurrir nuevas transacciones.
- Panel admin da una demo creible de la operacion SEM en tiempo real.

---

## Sprint 6: Integracion + Hardening de Demo

**Objetivo:** Verificacion cross-module, polish responsive, script de demo, y gate de calidad final.

**Modulos SRS:** Verificacion cruzada de todos los modulos.

**Dependencias:** Todos los sprints anteriores.

### Tareas

1. **Test E2E cross-flow completo** — permisionario registra pago efectivo → conductor paga digitalmente → admin ve ambos en dashboard y reportes → deuda generada y pagada → liquidacion calculada correctamente.

2. **Verificacion responsive** — todas las paginas a 390px, 768px, 1280px, 1440px. Sin overflow, sin truncamiento, acciones primarias visibles above-the-fold en mobile.

3. **Estados de validacion** — patente invalida, horario bloqueado, feriado, duracion insuficiente, pago fallido en simulacion — todos con mensajes de error claros.

4. **Estados vacios** — todas las tablas y listas muestran empty states significativos con call to action.

5. **Labels de simulacion** — badge `[SIMULACION]` en cada feature simulada (OCR, MercadoPago, geolocalizacion, notificaciones) para que jurados entiendan el boundary.

6. **Demo script** — `docs/demo-script.md` con walkthrough de 5 minutos para jurado, cubriendo los 4 tipos de usuario.

7. **Reset demo data** — boton one-click en home page.

8. **Build produccion** — `npm run build`, `npm run lint`, suite completa de tests verde.

### Tests

- `npm run test` — todos los tests unitarios/dominio pasan.
- `npm run test:e2e` — todos los flujos Playwright pasan.
- `npm run build` — build de produccion completa.
- `npm run lint` — sin errores de lint.
- Review manual de viewports: sin texto superpuesto, sin scroll horizontal, acciones primarias visibles en mobile.

### Criterios de Aceptacion

- Jurado puede correr la demo desde checkout limpio con `npm install && npm run dev`.
- Demo script ejercita todos los modulos del SRS sin setup oculto.
- Toda integracion simulada esta claramente etiquetada.
- Todos los tests pasan, build exitoso, zero errores de lint.

---

## Definicion Final de Done

- `npm run lint` pasa.
- `npm run test` pasa.
- `npm run test:e2e` pasa.
- `npm run build` pasa.
- App usable en viewports mobile y desktop.
- `docs/demo-script.md` explica el camino de demostracion.
- Sin dependencias de app nativa mobile ni requisitos iOS/Android.
- MVP se mantiene en alcance de hackathon, sin overbuild de produccion.

## Cadencia de Commits Recomendada

1. `chore: scaffold nextjs mvp with app router`
2. `feat: add SEM domain model, rules, and mock backend`
3. `feat: add permisionario operations and credencial digital`
4. `feat: add conductor payment flows and portal publico`
5. `feat: add admin configuration and permisionario management`
6. `feat: add admin dashboard, reports, and monitoring`
7. `test: add cross-module E2E and demo hardening`
8. `docs: add demo script for hackathon presentation`

## Cobertura de Requisitos SRS

### Features previamente faltantes — ahora cubiertas

| Feature | Sprint |
|---------|--------|
| OCR simulacion (RF-PAT-02, RF-PAT-03) | Sprint 2, tarea 4 |
| Registro conductor (RF-USR-01) | Sprint 3, tarea 1 |
| Historial estacionamientos (RF-USR-03) | Sprint 3, tarea 8 |
| Extension tiempo (RF-USR-08) | Sprint 3, tarea 6 |
| Notificacion vencimiento (RF-USR-07) | Sprint 3, tarea 7 |
| Tiempo restante activo (RF-USR-06) | Sprint 3, tarea 5 |
| Credencial digital (RF-PER-03, RF-PER-04) | Sprint 2, tarea 3 |
| Liquidacion (RF-PER-05, RF-PER-06) | Sprint 4, tarea 6 |
| Calendario feriados (RF-ADM-06) | Sprint 4, tarea 5 |
| Gestion zonas (RF-ADM-05) | Sprint 4, tarea 4 |
| RBAC admin (RF-ADM-12) | Sprint 4, tarea 1 |
| Flujo MP directo (RF-PAG-09) | Sprint 3, tarea 4 |
| Indicadores rendimiento (RF-ADM-10) | Sprint 5, tarea 8 |
| Reglas normativas configurables (RF-NOR-07, RF-NOR-08) | Sprint 4, tarea 7 |
| Liquidacion admin (RF-ADM-11) | Sprint 4, tarea 6 |
| Resumen diario permisionario (RF-PER-07) | Sprint 2, tarea 9 |
