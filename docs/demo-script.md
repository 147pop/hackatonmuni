# SEM Digital — Demo Script · Hackathon 2026

**Duración estimada:** 5 minutos  
**Setup:** `npm install && npm run dev` → abrir `http://localhost:3000`  
**Requisito:** Hacer la demo entre semana, 07:00–21:00 (o sábado 07:00–14:00). Los horarios son parte del sistema (RF-NOR-01).

> **Reset rápido:** botón "Restaurar datos de demo" en la home page. Limpia todo y vuelve al estado inicial.

---

## Paso 1 — Permisionario registra un pago en efectivo (60 seg)

**Rol:** Permisionario (agente de calle)

1. Ir a **Permisionario** desde la home
2. Seleccionar **"Rosa Martínez"** (Balcarce 400)
3. Ver dashboard: turno activo, monitor de cuadra en vivo, resumen del día
4. Tocar **"Registrar pago efectivo"**
5. Click en el botón **OCR** → simula lectura de cámara `[SIMULACION]` → patente se completa automáticamente
6. Elegir **"1 hora"**
7. Click **"Registrar pago efectivo"**
8. Ver ticket generado con número único (T-XXXX) y monto cobrado
9. Volver al dashboard → **"Resumen de hoy"** muestra 1 ticket efectivo

**Lo que demuestra:** RF-PAG-05, RF-PAG-06, RF-PAT-02/03, RF-EST-09 (timestamp del sistema)

---

## Paso 2 — Conductor paga digitalmente (60 seg)

**Rol:** Conductor registrado

1. Ir a **Conductor** desde la home
2. Seleccionar **"Carlos"** (AB123CD)
3. Ver dashboard: botón "Estacionar" como acción principal
4. Tocar **"Estacionar"**
5. Seleccionar a **Rosa Martínez** de la lista → simula escaneo QR `[SIMULACION]`
6. Dominio ya viene pre-cargado (AB123CD)
7. Elegir **"30 min"** → ver precio con **descuento 20% digital automático**
8. Click **"Continuar al pago"**
9. Click **"Pagar con MercadoPago"** `[SIMULACION]` → 1.5s de proceso
10. Ver ticket confirmado → click **"Ver ticket activo"**
11. Página de ticket: **countdown en vivo** (mm:ss), nota de transferencia (RF-EST-05)

**Lo que demuestra:** RF-PAG-01→04, RF-PAG-07, RF-USR-06, RF-EST-05, RNF-15 (≤3 pasos)

---

## Paso 3 — Portal público consulta y paga una deuda (45 seg)

**Rol:** Ciudadano sin cuenta

1. Ir a **Portal Público** desde la home
2. Click **"Consultar deuda por patente"**
3. Ingresar **XYZ789** → click **"Consultar deudas"**
4. Ver deuda pendiente de $700 con fecha y cuadra
5. Click **"Pagar con MercadoPago"** `[SIMULACION]`
6. Deuda cambia a estado **"Pagadas"** en el mismo momento

**Lo que demuestra:** RF-PAT-07, RF-PAT-08, RF-PAG-09

---

## Paso 4 — Permisionario detecta overstay (45 seg)

**Contexto:** Volver al permisionario. El ticket de "30 min" del paso 2 debería estar venciendo pronto.

1. Volver a **Permisionario → Rosa Martínez**
2. El **Monitor de cuadra en vivo** muestra tickets activos con countdown
3. Cuando vence → aparece en sección **"Vencidos — ¿el auto sigue?"** con tiempo excedido
4. Opciones: **"Ya se fue"** (cierra limpio) o **"Hora extra"** (genera deuda)
5. Click **"Hora extra"** → página pre-llenada con ticket original vinculado
6. Click **"Registrar hora extra"** → deuda creada con tipo `hora_extra`

**Si el ticket no venció todavía:** Mostrar la pantalla `/permisionario/hora-extra` directo y rellenar manualmente con cualquier patente.

**Lo que demuestra:** Overstay detection, Sprint 3 tasks 14-17

---

## Paso 5 — Admin: dashboard, reportes y configuración (90 seg)

**Rol:** Administrador Municipal

1. Ir a **Administración Municipal** desde la home
2. **Dashboard:** mostrar métricas en vivo — recaudado hoy, tickets activos, deudas pendientes
3. Click **"Pagos"** → tabla filtrables con todos los pagos del flujo
4. Click **"Deudas"** → mostrar la deuda `hora_extra` distinguida de incumplimiento

### Configuración (sub-rol demo)

5. Cambiar sub-rol a **"Consulta"** (banner arriba) → todas las acciones se bloquean
6. Cambiar a **"Administrador"** → acceso completo
7. Ir a **"Tarifas"** → cambiar precio auto de $700 a $800 → preview en vivo actualiza
8. Guardar → "Tarifas actualizadas"
9. Ir a **"Feriados"** → agregar una fecha → mencionar que bloquea pagos automáticamente

### Liquidaciones

10. Ir a **"Liquidaciones"** → seleccionar mes actual
11. Ver Rosa Martínez con recaudación del día → **Total − 20% cuota = liquidado**
12. Click **"Transferir [SIMULACION]"** → aparece "Liquidación transferida"

### Emergencias (bonus si hay tiempo)

13. Volver al permisionario → click en ícono **"Ayuda"** (botón de pánico silencioso — RF-EME-06, cero feedback visual)
14. Ir a **Admin → Alertas** → aparece "ALERTA DE PÁNICO" con cuadra y GPS simulado
15. Escribir notas → **"Marcar como resuelta"** → pasa a historial

**Lo que demuestra:** RF-ADM-01/02/04/06/09/11/12, RF-PER-05/06, RF-EME-03/05/07

---

## Puntos clave a mencionar durante la demo

| Qué mostrar | Dónde |
|---|---|
| Timestamp del sistema (no manual) | Error en formulario si horario incorrecto |
| Descuento 20% digital automático | Preview en pago digital — se calcula solo |
| Patentes validadas (formatos arg.) | `AB123CD` ✓ · `ZZZZZZ` ✗ (mensaje claro) |
| QR fijo del permisionario | `/permisionario/credencial` → tab QR |
| Notificaciones in-app | Campana en header (permisionario/conductor) |
| Audit trail completo | Admin → Auditoría |
| Reset demo | Botón en home |

---

## Comandos de arranque

```bash
# Desde checkout limpio
npm install
npm run dev

# Tests unitarios (58 tests)
npm run test

# Build producción
npm run build

# E2E (requiere dev server corriendo)
npm run test:e2e
```

---

## Datos de demo pre-cargados

| Entidad | Detalle |
|---|---|
| Permisionarios | Rosa Martínez (Balcarce 400), Jorge Pérez (España 400), Ana Rodríguez (Pellegrini 200) |
| Conductores | Carlos (AB123CD), María (XYZ789) |
| Deudas | XYZ789 — $700 pendiente (Balcarce 400) · PQR123 — $700 pendiente (España 400) |
| Tarifas | Auto $700/h · Moto $300/h · Descuento digital 20% · Tolerancia 5min |
| Zonas | Centro (diurno) · Nocturna Norte (diurno + nocturno) |
| Feriados | 25-May, 9-Jul, 1-Ene |

---

*PunaTech 2026 · Hackathon MVP · Todos los datos son simulados en localStorage*
