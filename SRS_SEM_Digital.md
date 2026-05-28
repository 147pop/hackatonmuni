# Especificacion de Requisitos de Software (SRS)

## Sistema de Estacionamiento Medido Digital — Municipalidad de Salta

**Estandar:** IEEE 830-1998  
**Version:** 1.0  
**Fecha:** 28 de mayo de 2026  
**Proyecto:** PunaTech 2026 — Hackathon  

---

## Tabla de Contenidos

1. [Introduccion](#1-introduccion)
2. [Descripcion General](#2-descripcion-general)
3. [Requisitos Especificos](#3-requisitos-especificos)
4. [Apendices](#4-apendices)

---

## 1. Introduccion

### 1.1 Proposito

Este documento especifica los requisitos de software para el Sistema de Estacionamiento Medido Digital (SEM Digital), una plataforma tecnologica que reemplaza integralmente la operatoria manual basada en talonarios fisicos por un ecosistema digital de registro, cobro y gestion del estacionamiento medido en el microcentro de la ciudad de Salta.

El documento esta dirigido a los equipos de desarrollo, al jurado del hackathon PunaTech 2026 y a los referentes tecnicos de la Municipalidad de Salta.

### 1.2 Alcance

El sistema SEM Digital comprende:

- **App Conductor**: Aplicacion movil para conductores (registro opcional, pago digital, consulta de deuda, emergencias).
- **App/Herramienta Permisionario**: Interfaz para que el permisionario gestione su cuadra, registre estacionamientos y emita tickets digitales.
- **Portal Web Publico**: Pagina web para pago sin registro y consulta/pago de deudas por dominio.
- **Panel Administrativo Municipal**: Dashboard web completo para gestion, reportes en tiempo real, auditoria y administracion del sistema.
- **Backend y APIs**: Servicios centrales que integran MercadoPago, gestionan la logica de negocio y almacenan toda la informacion.

**Fuera de alcance** en esta version:
- Rol de inspector municipal (funcionalidad dedicada).
- Integracion con sistemas de transito o multas preexistentes.
- Sensores fisicos de ocupacion en calzada.

### 1.3 Definiciones, Acronimos y Abreviaturas

| Termino | Definicion |
|---------|-----------|
| SEM | Sistema de Estacionamiento Medido |
| Permisionario | Persona jubilada o con discapacidad autorizada por la Municipalidad para gestionar el cobro en una cuadra (hasta 100m lineales) |
| Conductor | Persona que estaciona un vehiculo en zona SEM |
| Dominio | Patente o numero de identificacion del vehiculo |
| QR Fijo | Codigo QR unico e inmutable asignado a cada permisionario para recibir pagos |
| OCR | Reconocimiento Optico de Caracteres |
| MP | MercadoPago |
| Ordenanza | Ordenanza Municipal N.º 12.170 |
| Turno diurno | Lunes a viernes 07:00-21:00, sabados 07:00-14:00 |
| Turno nocturno | Lunes a domingo 22:00-05:00, en zonas habilitadas |
| Fraccionamiento | Cobro cada 15 minutos a partir de la segunda hora |

### 1.4 Referencias

| ID | Documento |
|----|-----------|
| REF-01 | IEEE Std 830-1998 — Recommended Practice for Software Requirements Specifications |
| REF-02 | Ordenanza Municipal N.º 12.170 — Regulacion del SEM, Municipalidad de Salta |
| REF-03 | Documentacion API MercadoPago — https://www.mercadopago.com.ar/developers |
| REF-04 | Consigna Hackathon PunaTech 2026 — Diagnostico de SEM |

### 1.5 Vision General del Documento

La seccion 2 describe el producto en forma general: contexto, usuarios, restricciones y supuestos. La seccion 3 detalla los requisitos funcionales organizados por modulo, las interfaces externas y los requisitos no funcionales. La seccion 4 contiene apendices con flujos y matrices de trazabilidad.

---

## 2. Descripcion General

### 2.1 Perspectiva del Producto

#### 2.1.1 Situacion Actual

El SEM opera con ~900 permisionarios que gestionan el cobro mediante talonarios fisicos. Los principales problemas son:

- Ausencia total de trazabilidad digital.
- Imposibilidad de control en tiempo real.
- Cobros indebidos fuera de horario por desconocimiento normativo.
- Exclusion de medios de pago digitales.
- Costos logisticos por compra presencial de talonarios.
- Conductores que no pagan sin consecuencias practicas.

#### 2.1.2 Solucion Propuesta

SEM Digital es un ecosistema que:

1. Asigna a cada permisionario un **QR fijo** que los conductores escanean para pagar.
2. Centraliza todos los pagos (digitales y efectivo) en la **cuenta de la Municipalidad**, que luego liquida al permisionario.
3. Registra electronicamente el 100% de las transacciones, eliminando talonarios fisicos.
4. Aplica automaticamente las reglas de la Ordenanza (horarios, tarifas, fraccionamiento, descuentos).
5. Genera **deuda por dominio** cuando un conductor no paga, cobrable via app o web municipal.
6. Provee **botones de emergencia** para seguridad fisica y resolucion de disputas.

#### 2.1.3 Contexto del Sistema

```
+-------------------+       +-------------------+       +-------------------+
|   App Conductor   |<----->|                   |<----->| App Permisionario |
| (iOS/Android/Web) |       |   Backend SEM     |       |  (iOS/Android)    |
+-------------------+       |   Digital         |       +-------------------+
                             |                   |
+-------------------+       |   - API REST      |       +-------------------+
|  Portal Web       |<----->|   - Base de datos |<----->| Panel Admin       |
|  Publico          |       |   - Motor reglas  |       | Municipal (Web)   |
+-------------------+       |                   |       +-------------------+
                             +--------+----------+
                                      |
                                      v
                             +-------------------+
                             |   MercadoPago     |
                             |   API             |
                             +-------------------+
```

### 2.2 Funciones del Producto (Resumen)

| ID | Funcion | Descripcion |
|----|---------|-------------|
| F01 | Pago digital via QR | Conductor escanea QR fijo del permisionario y paga via MercadoPago |
| F02 | Pago en efectivo con registro | Permisionario registra pago en efectivo digitalmente |
| F03 | Pago sin cuenta | Conductor paga via web publica sin necesidad de registrarse en la app |
| F04 | Lectura de patente | Ingreso manual o captura OCR del dominio del vehiculo |
| F05 | Deuda por dominio | Generacion y gestion de deuda asociada a patente por falta de pago |
| F06 | Identidad verificable | Conductor puede verificar identidad del permisionario via app y credencial digital |
| F07 | Emergencias | Boton de panico silencioso y boton de disputa con geolocalizacion |
| F08 | Cumplimiento normativo | Aplicacion automatica de horarios, tarifas, descuentos y restricciones |
| F09 | Liquidacion a permisionarios | Calculo y transferencia de ingresos descontando cuota municipal |
| F10 | Panel administrativo | Dashboard de gestion, reportes y auditoria para la Municipalidad |

### 2.3 Caracteristicas de los Usuarios

#### 2.3.1 Conductor Registrado

- **Perfil**: Persona que estaciona en zona SEM y posee la app instalada con cuenta creada.
- **Nivel tecnico**: Variable, desde bajo hasta alto.
- **Frecuencia de uso**: Diaria a esporadica.
- **Capacidades**: Pago digital, historial, consulta de deuda, verificacion de permisionario, emergencias.

#### 2.3.2 Conductor sin Cuenta

- **Perfil**: Persona que estaciona pero no tiene la app ni desea registrarse.
- **Nivel tecnico**: Puede ser bajo.
- **Frecuencia de uso**: Esporadica.
- **Capacidades**: Pago escaneando QR (via MercadoPago propio), pago en efectivo al permisionario, consulta y pago de deuda via web municipal ingresando dominio.

#### 2.3.3 Permisionario

- **Perfil**: Persona jubilada o con discapacidad, autorizada por la Municipalidad. Aproximadamente 900 personas.
- **Nivel tecnico**: Potencialmente bajo. Puede no disponer de smartphone propio.
- **Frecuencia de uso**: Diaria durante su turno.
- **Capacidades**: Registrar estacionamientos, registrar pagos en efectivo, portar QR fijo (impreso o digital), emitir credencial digital, usar boton de emergencia.

#### 2.3.4 Administrador Municipal

- **Perfil**: Personal de la Municipalidad (Coordinacion de Modernizacion, Subsecretaria de Nuevos Proyectos).
- **Nivel tecnico**: Medio a alto.
- **Frecuencia de uso**: Diaria.
- **Capacidades**: Gestion completa del sistema, reportes, auditoria, configuracion de tarifas y zonas.

### 2.4 Restricciones

| ID | Restriccion |
|----|-------------|
| R01 | La solucion debe cumplir integramente la Ordenanza N.º 12.170 |
| R02 | MercadoPago es la plataforma de pago digital obligatoria |
| R03 | Los permisionarios deben mantenerse como agentes activos del sistema con ingresos garantizados |
| R04 | El tiempo total de una transaccion de pago no debe superar los 10 segundos |
| R05 | El sistema debe funcionar con conectividad de datos moviles estandar |
| R06 | El sistema debe ser usable por personas con bajo manejo de smartphone |
| R07 | No se puede asumir que el permisionario posee smartphone propio |
| R08 | Todo pago (digital o efectivo) debe quedar registrado electronicamente |
| R09 | Los talonarios fisicos quedan eliminados |

### 2.5 Suposiciones y Dependencias

| ID | Suposicion/Dependencia |
|----|----------------------|
| S01 | Conectividad de datos moviles razonable en toda el area SEM |
| S02 | MercadoPago mantiene disponible su API con tiempos de respuesta aceptables (<3s) |
| S03 | La Municipalidad provee listado actualizado de permisionarios, cuadras habilitadas y zonas nocturnas |
| S04 | La Municipalidad puede emitir credenciales digitales a permisionarios |
| S05 | Para permisionarios sin smartphone, la Municipalidad puede proveer dispositivo o el QR se imprime en material fisico |
| S06 | El calendario de feriados nacionales y provinciales esta disponible como dato de entrada |
| S07 | Las tarifas son configurables por la Municipalidad y pueden actualizarse sin despliegue de software |

---

## 3. Requisitos Especificos

### 3.1 Interfaces Externas

#### 3.1.1 Interfaces de Usuario

| Interfaz | Plataforma | Descripcion |
|----------|-----------|-------------|
| UI-01 App Conductor | iOS / Android | Registro, pago, historial, verificacion permisionario, emergencias, consulta deuda |
| UI-02 App Permisionario | iOS / Android | Registro estacionamiento, ingreso patente (manual/OCR), registro efectivo, credencial digital, emergencias |
| UI-03 Portal Web Publico | Navegador web responsive | Pago sin cuenta via QR, consulta y pago de deuda por dominio |
| UI-04 Panel Admin | Navegador web desktop | Dashboard, reportes, gestion de permisionarios, zonas, tarifas, multas, auditoria |

#### 3.1.2 Interfaces de Hardware

| Interfaz | Descripcion |
|----------|-------------|
| HW-01 | Camara del smartphone para lectura OCR de patentes |
| HW-02 | Camara del smartphone para escaneo de codigos QR |
| HW-03 | GPS del smartphone para geolocalizacion en emergencias y validacion de zona |
| HW-04 | QR impreso en material resistente (tarjeta plastificada/chapa) para permisionarios sin smartphone |

#### 3.1.3 Interfaces de Software

| Interfaz | Descripcion |
|----------|-------------|
| SW-01 | API MercadoPago: creacion de cobros, QR estatico, consulta de pagos, notificaciones webhook |
| SW-02 | Servicio de notificaciones push (FCM / APNs) |
| SW-03 | Servicio de OCR para reconocimiento de patentes |
| SW-04 | API del backend SEM Digital (REST) |

#### 3.1.4 Interfaces de Comunicacion

| Interfaz | Descripcion |
|----------|-------------|
| COM-01 | HTTPS/TLS 1.2+ para toda comunicacion cliente-servidor |
| COM-02 | WebSocket o SSE para notificaciones en tiempo real al panel admin |
| COM-03 | Webhooks MercadoPago para confirmacion asincrona de pagos |

---

### 3.2 Requisitos Funcionales

#### 3.2.1 Modulo de Pagos (RF-PAG)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-PAG-01 | El sistema debe permitir al conductor pagar escaneando el QR fijo del permisionario con la app SEM o con la app MercadoPago | Alta |
| RF-PAG-02 | El QR fijo del permisionario debe estar vinculado a la cuenta MercadoPago de la Municipalidad, no del permisionario | Alta |
| RF-PAG-03 | Al escanear el QR, el sistema debe presentar al conductor las opciones de tiempo de estacionamiento con el monto correspondiente | Alta |
| RF-PAG-04 | El sistema debe admitir pago con transferencia bancaria, tarjeta de debito y tarjeta de credito a traves de MercadoPago | Alta |
| RF-PAG-05 | El sistema debe registrar digitalmente los pagos en efectivo. El permisionario ingresa el monto y dominio; el sistema genera un ticket digital como comprobante | Alta |
| RF-PAG-06 | Para pagos en efectivo, el sistema debe generar un comprobante digital (numero unico) que el conductor puede consultar con su dominio | Alta |
| RF-PAG-07 | El sistema debe aplicar automaticamente el descuento del 20% en pagos digitales. Este descuento lo absorbe la Municipalidad de su porcion, sin afectar el ingreso del permisionario | Alta |
| RF-PAG-08 | El sistema debe permitir el pago sin cuenta: el conductor escanea el QR con la camara nativa del celular, se abre una pagina web donde ingresa su dominio y paga via MercadoPago sin necesitar cuenta en la app SEM | Alta |
| RF-PAG-09 | El sistema debe admitir pago directo desde la app MercadoPago del conductor (escaneando el QR del permisionario) sin requerir la app SEM | Media |
| RF-PAG-10 | Toda transaccion debe completarse en menos de 10 segundos desde la confirmacion del conductor | Alta |
| RF-PAG-11 | El sistema debe emitir notificacion al permisionario cuando un pago digital se confirma exitosamente | Alta |
| RF-PAG-12 | El sistema debe registrar para cada pago: timestamp, dominio, monto, medio de pago, ID permisionario, ubicacion (cuadra), duracion contratada | Alta |

#### 3.2.2 Modulo de Estacionamiento (RF-EST)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-EST-01 | El sistema debe registrar el inicio y fin del estacionamiento de cada vehiculo | Alta |
| RF-EST-02 | La tarifa base es de $700/hora para vehiculos y $300/hora para motocicletas. Las tarifas deben ser configurables por el administrador sin modificar codigo | Alta |
| RF-EST-03 | El sistema debe aplicar una tolerancia de 5 minutos al inicio del estacionamiento antes de comenzar el cobro | Alta |
| RF-EST-04 | A partir de la segunda hora de estadia, el sistema debe fraccionar el cobro en periodos de 15 minutos | Alta |
| RF-EST-05 | Si el conductor paga una hora completa y se retira antes, el sistema debe permitirle estacionarse en otra cuadra habilitada sin costo adicional hasta que se cumpla el tiempo pagado. El ticket digital debe indicar el tiempo restante | Alta |
| RF-EST-06 | El sistema debe validar automaticamente que el estacionamiento se registre dentro del horario permitido segun turno y dia | Alta |
| RF-EST-07 | El sistema debe impedir el registro de cobros en dias feriados y no laborables para el turno diurno | Alta |
| RF-EST-08 | El sistema debe diferenciar turno diurno y nocturno, aplicando las reglas correspondientes a cada uno | Alta |
| RF-EST-09 | Al registrar un estacionamiento, el sistema debe capturar la hora de inicio automaticamente del servidor (no ingresada manualmente) para evitar manipulacion | Alta |

#### 3.2.3 Modulo de Gestion de Patentes (RF-PAT)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-PAT-01 | El sistema debe permitir al permisionario ingresar el dominio del vehiculo de forma manual (teclado) | Alta |
| RF-PAT-02 | El sistema debe ofrecer opcionalmente la captura del dominio mediante OCR usando la camara del smartphone | Media |
| RF-PAT-03 | El OCR debe reconocer formatos de patente argentinos vigentes (AA 000 AA y formatos anteriores) | Media |
| RF-PAT-04 | Cuando un conductor no paga el estacionamiento, el sistema debe generar una deuda asociada al dominio del vehiculo | Alta |
| RF-PAT-05 | La deuda por dominio debe registrar: fecha, hora, ubicacion (cuadra), monto adeudado, ID permisionario que registro el incumplimiento | Alta |
| RF-PAT-06 | El conductor debe poder consultar y pagar su deuda desde la app SEM ingresando su dominio | Alta |
| RF-PAT-07 | El conductor sin cuenta debe poder consultar y pagar su deuda desde el portal web publico de la Municipalidad ingresando su dominio | Alta |
| RF-PAT-08 | El pago de deuda debe realizarse a traves de MercadoPago con los mismos medios habilitados (transferencia, debito, credito) | Alta |
| RF-PAT-09 | El sistema debe mantener un historial de deudas por dominio con su estado (pendiente, pagada, vencida) | Alta |
| RF-PAT-10 | El permisionario debe poder registrar un vehiculo estacionado que se niega a pagar, ingresando el dominio para que se genere la deuda correspondiente | Alta |

#### 3.2.4 Modulo de Permisionarios (RF-PER)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-PER-01 | Cada permisionario debe tener un QR fijo unico asignado por el sistema, vinculado a su legajo y cuadra | Alta |
| RF-PER-02 | El QR debe poder generarse en formato digital (pantalla) e imprimible (para permisionarios sin smartphone) | Alta |
| RF-PER-03 | El permisionario debe contar con una credencial digital municipal que muestre: foto, nombre completo, numero de legajo, cuadra asignada y estado (activo/inactivo) | Alta |
| RF-PER-04 | La credencial digital debe ser verificable: al escanear el QR del permisionario, el conductor ve el perfil verificado con foto y datos | Alta |
| RF-PER-05 | El sistema debe calcular la liquidacion del permisionario: total recaudado en su cuadra menos el 20% de cuota municipal | Alta |
| RF-PER-06 | El sistema debe transferir la liquidacion al permisionario a traves de MercadoPago o el medio que defina la Municipalidad, en la frecuencia configurada | Alta |
| RF-PER-07 | El permisionario debe poder visualizar un resumen de su actividad diaria: cantidad de vehiculos, monto recaudado, pagos digitales vs efectivo | Media |
| RF-PER-08 | El sistema debe validar que el permisionario solo opere dentro de su cuadra asignada y horario autorizado | Alta |
| RF-PER-09 | Para permisionarios sin smartphone: el QR impreso en material resistente (tarjeta plastificada) es suficiente para que el conductor pague. El registro del estacionamiento puede realizarse desde un dispositivo provisto por la Municipalidad o por el conductor via la app | Alta |
| RF-PER-10 | El sistema debe permitir al administrador dar de alta, modificar y dar de baja permisionarios | Alta |

#### 3.2.5 Modulo de Conductor (RF-USR)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-USR-01 | El conductor debe poder registrarse en la app con: nombre, email, telefono y al menos un dominio de vehiculo | Media |
| RF-USR-02 | El conductor debe poder agregar multiples dominios a su cuenta | Baja |
| RF-USR-03 | El conductor debe poder consultar su historial de estacionamientos y pagos | Media |
| RF-USR-04 | Al escanear el QR del permisionario, la app debe mostrar automaticamente el perfil verificado del permisionario (foto, nombre, legajo, estado activo) para que el conductor valide su identidad | Alta |
| RF-USR-05 | El conductor debe poder verificar la identidad del permisionario tambien escaneando la credencial digital que porta el permisionario | Alta |
| RF-USR-06 | El conductor debe poder consultar el tiempo restante de su estacionamiento activo | Media |
| RF-USR-07 | El sistema debe notificar al conductor cuando su tiempo de estacionamiento este por vencer (5 minutos antes) | Media |
| RF-USR-08 | El conductor debe poder extender su tiempo de estacionamiento desde la app antes de que expire | Media |

#### 3.2.6 Modulo de Emergencias (RF-EME)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-EME-01 | La app del permisionario debe incluir un boton de panico silencioso para situaciones de inseguridad o agresion fisica | Alta |
| RF-EME-02 | La app del conductor debe incluir un boton de panico silencioso con la misma funcionalidad | Alta |
| RF-EME-03 | Al activar el boton de panico, el sistema debe enviar una alerta silenciosa con la ubicacion GPS en tiempo real a la central de seguridad municipal y/o policia | Alta |
| RF-EME-04 | La app del permisionario y del conductor deben incluir un boton visible de "Reportar disputa" para conflictos entre conductor y permisionario | Alta |
| RF-EME-05 | Al reportar una disputa, el sistema debe registrar: ubicacion, timestamp, IDs de las partes involucradas, y notificar a un supervisor designado | Alta |
| RF-EME-06 | El boton de panico silencioso no debe producir ningun feedback visual o sonoro en el dispositivo que pueda alertar al agresor | Alta |
| RF-EME-07 | El sistema debe mantener un registro de todas las emergencias y disputas reportadas para auditoria | Media |

#### 3.2.7 Modulo de Administracion (RF-ADM)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-ADM-01 | El panel debe mostrar un dashboard en tiempo real con: recaudacion total, cantidad de estacionamientos activos, ocupacion por zona | Alta |
| RF-ADM-02 | El panel debe permitir generar reportes de recaudacion por periodo (diario, semanal, mensual), por zona, por permisionario y por medio de pago | Alta |
| RF-ADM-03 | El panel debe permitir gestionar permisionarios: alta, baja, modificacion, asignacion de cuadra, consulta de actividad | Alta |
| RF-ADM-04 | El panel debe permitir configurar tarifas (monto por hora vehiculo, monto por hora moto) sin necesidad de despliegue de software | Alta |
| RF-ADM-05 | El panel debe permitir configurar zonas habilitadas para turno diurno y nocturno | Alta |
| RF-ADM-06 | El panel debe permitir configurar el calendario de feriados y dias no laborables | Alta |
| RF-ADM-07 | El panel debe mostrar un registro de auditoria completo: todas las transacciones, modificaciones de configuracion, accesos al sistema | Alta |
| RF-ADM-08 | El panel debe mostrar alertas de emergencia en tiempo real (botones de panico activados) | Alta |
| RF-ADM-09 | El panel debe permitir consultar deudas por dominio y su estado | Media |
| RF-ADM-10 | El panel debe mostrar indicadores de rendimiento: tiempo promedio de transaccion, tasa de pagos digitales vs efectivo, tasa de incumplimiento | Media |
| RF-ADM-11 | El panel debe permitir generar la liquidacion de permisionarios y consultar el historial de liquidaciones | Alta |
| RF-ADM-12 | El sistema debe implementar control de acceso basado en roles para el panel administrativo (administrador, supervisor, consulta) | Alta |

#### 3.2.8 Modulo de Cumplimiento Normativo (RF-NOR)

| ID | Requisito | Prioridad |
|----|-----------|-----------|
| RF-NOR-01 | El sistema debe impedir el cobro fuera del horario autorizado: turno diurno L-V 07:00-21:00, sabados 07:00-14:00 | Alta |
| RF-NOR-02 | El sistema debe impedir el cobro diurno en feriados y dias no laborables | Alta |
| RF-NOR-03 | El turno nocturno (22:00-05:00, L-D) solo debe habilitarse en las zonas expresamente configuradas (Paseo Balcarce, Paseo Guemes, Plaza Alvarado, inmediaciones de locales de diversion) | Alta |
| RF-NOR-04 | El descuento del 20% para pagos digitales debe aplicarse automaticamente, absorbido por la cuota municipal | Alta |
| RF-NOR-05 | El fraccionamiento de 15 minutos a partir de la segunda hora debe aplicarse automaticamente | Alta |
| RF-NOR-06 | El sistema debe respetar la tolerancia de 5 minutos establecida por la ordenanza | Alta |
| RF-NOR-07 | El sistema debe permitir la incorporacion futura de nuevas zonas nocturnas por parte del administrador | Media |
| RF-NOR-08 | Todas las reglas normativas deben ser configurables desde el panel admin, de modo que cambios en la ordenanza no requieran modificacion de codigo | Media |

---

### 3.3 Requisitos No Funcionales

#### 3.3.1 Rendimiento

| ID | Requisito |
|----|-----------|
| RNF-01 | Una transaccion de pago digital debe completarse en menos de 10 segundos de extremo a extremo |
| RNF-02 | La lectura OCR de patente debe resolverse en menos de 3 segundos |
| RNF-03 | El panel admin debe cargar el dashboard en menos de 3 segundos |
| RNF-04 | El sistema debe soportar al menos 900 permisionarios operando simultaneamente |
| RNF-05 | El sistema debe soportar al menos 5000 transacciones concurrentes en horario pico |

#### 3.3.2 Disponibilidad

| ID | Requisito |
|----|-----------|
| RNF-06 | El sistema debe tener una disponibilidad minima del 99.5% durante horarios SEM |
| RNF-07 | Las ventanas de mantenimiento deben programarse fuera del horario SEM (05:00-07:00) |
| RNF-08 | El registro de pagos en efectivo debe contar con mecanismo de cola offline que sincronice al recuperar conectividad |

#### 3.3.3 Seguridad

| ID | Requisito |
|----|-----------|
| RNF-09 | Toda comunicacion debe realizarse sobre HTTPS con TLS 1.2 o superior |
| RNF-10 | Las credenciales y tokens de pago no deben almacenarse en el dispositivo del usuario |
| RNF-11 | El acceso al panel administrativo debe requerir autenticacion multifactor (MFA) |
| RNF-12 | Los datos personales deben almacenarse cifrados en reposo |
| RNF-13 | El sistema debe mantener logs de auditoria inmutables por al menos 2 anos |
| RNF-14 | El boton de panico silencioso no debe dejar rastro visible en pantalla |

#### 3.3.4 Usabilidad y Accesibilidad

| ID | Requisito |
|----|-----------|
| RNF-15 | La app del conductor debe ser operable con un maximo de 3 pasos para completar un pago (escanear QR, confirmar tiempo, confirmar pago) |
| RNF-16 | La interfaz del permisionario debe usar tipografia grande (minimo 16sp) y botones amplios, considerando usuarios de edad avanzada |
| RNF-17 | El sistema debe funcionar en smartphones con Android 8+ y iOS 14+ |
| RNF-18 | El portal web publico debe ser responsive y funcional en navegadores moviles sin requerir instalacion |
| RNF-19 | Los flujos criticos (pago, registro estacionamiento) deben poder completarse sin necesidad de leer instrucciones |

#### 3.3.5 Escalabilidad

| ID | Requisito |
|----|-----------|
| RNF-20 | La arquitectura debe permitir incorporar nuevas zonas y cuadras sin modificacion de codigo |
| RNF-21 | El sistema debe poder escalar horizontalmente para soportar incremento de permisionarios y transacciones |
| RNF-22 | Las tarifas, zonas, horarios y reglas de negocio deben ser parametrizables desde el panel admin |

---

## 4. Apendices

### Apendice A: Flujos de Pago

#### A.1 Flujo de Pago Digital (Conductor con App SEM)

```
1. Conductor llega a cuadra SEM y estaciona
2. Conductor abre App SEM → escanea QR fijo del permisionario
3. App muestra perfil verificado del permisionario (foto, nombre, legajo)
4. Conductor ingresa dominio (manual o OCR) y selecciona duracion
5. App calcula monto con descuento 20% digital automatico
6. Conductor confirma → se redirige a MercadoPago
7. MercadoPago procesa pago (transferencia/debito/credito) → confirma
8. Backend registra transaccion completa
9. Permisionario recibe notificacion de pago confirmado
10. Conductor recibe ticket digital con tiempo restante
```

#### A.2 Flujo de Pago sin Cuenta (QR con camara nativa)

```
1. Conductor escanea QR del permisionario con camara nativa del celular
2. Se abre pagina web publica del SEM
3. Web muestra datos del permisionario y cuadra
4. Conductor ingresa dominio y selecciona duracion
5. Web calcula monto con descuento 20% digital
6. Conductor paga via MercadoPago (sin cuenta SEM, solo cuenta MP)
7. Backend registra transaccion
8. Permisionario recibe notificacion
```

#### A.3 Flujo de Pago en Efectivo

```
1. Conductor indica al permisionario que pagara en efectivo
2. Permisionario abre app → "Registrar estacionamiento"
3. Permisionario ingresa dominio (manual o OCR)
4. Permisionario selecciona duracion y registra pago en efectivo
5. Sistema genera ticket digital con numero unico de comprobante
6. Conductor recibe el numero de comprobante (verbal o mostrado en pantalla)
7. Conductor puede consultar su comprobante en web publica con su dominio
8. Transaccion queda registrada electronicamente al 100%
```

#### A.4 Flujo de Deuda por No Pago

```
1. Permisionario detecta vehiculo estacionado sin pago
2. Permisionario abre app → "Registrar incumplimiento"
3. Permisionario ingresa dominio del vehiculo (manual o OCR)
4. Sistema genera deuda asociada al dominio con fecha, hora, cuadra y monto
5. Deuda queda pendiente en el sistema
6. Conductor puede consultar y pagar la deuda:
   a. Desde App SEM → seccion "Mis deudas" → pago via MercadoPago
   b. Desde portal web municipal → ingresa dominio → ve deudas → paga via MercadoPago
7. Al pagar, la deuda cambia de estado a "pagada" y se registra el pago
```

#### A.5 Flujo de Pago con MercadoPago Directo

```
1. Conductor abre su app MercadoPago
2. Escanea QR fijo del permisionario
3. MercadoPago muestra la opcion de pago a cuenta de la Municipalidad
4. Conductor completa el pago
5. Webhook de MercadoPago notifica al backend SEM
6. Backend registra la transaccion y notifica al permisionario
Nota: en este flujo el conductor debe comunicar el dominio al permisionario
      para que este lo registre manualmente en su app
```

### Apendice B: Matriz de Trazabilidad

| Problema actual | Requisitos que lo resuelven |
|----------------|-----------------------------|
| Ausencia de trazabilidad | RF-PAG-12, RF-PAG-05, RF-PAG-06, RF-ADM-07 |
| Control nulo / cobros indebidos | RF-NOR-01 a RF-NOR-08, RF-EST-06, RF-EST-07, RF-EST-09 |
| Cobros fuera de horario | RF-NOR-01, RF-NOR-02, RF-PER-08 |
| Conductor no paga sin consecuencias | RF-PAT-04 a RF-PAT-10 (deuda por dominio) |
| Exclusion de medios digitales | RF-PAG-01 a RF-PAG-04, RF-PAG-08, RF-PAG-09 |
| Costos logisticos talonarios | Eliminados por digitalizacion completa (R09) |
| Sin datos en tiempo real | RF-ADM-01, RF-ADM-02, RF-ADM-10 |
| Velocidad de transaccion (problema 2024) | RNF-01 (< 10s), QR fijo elimina generacion dinamica |
| Seguridad permisionario/conductor | RF-EME-01 a RF-EME-07 |
| Identidad no verificable del permisionario | RF-PER-03, RF-PER-04, RF-USR-04, RF-USR-05 |

---

*Fin del documento SRS — SEM Digital v1.0*
