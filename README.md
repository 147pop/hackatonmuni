# Perímetro Digital Salta - SEM 🚀
**Hackathon PunaTech 2026**

Proyecto de transformación digital para el Sistema de Estacionamiento Medido (SEM) de la Municipalidad de Salta. Pasamos del talonario de papel manual a un ecosistema digital inteligente, transparente y en tiempo real.

---

## 🛠️ Tecnologías y Herramientas Utilizadas

**Frontend & Backend:**
- **Framework:** Next.js (App Router) + React
- **Estilos:** Tailwind CSS y Vanilla CSS (Glassmorphism, Micro-animaciones)
- **Mapas en Vivo:** Leaflet y React-Leaflet
- **Íconos:** Lucide React
- **Pagos:** Integración nativa con la API de Mercado Pago

**Desarrollo Asistido por IA (Agentes & Skills):**
- **Agente Principal:** Antigravity (Google DeepMind)
- **Capacidades Autónomas Usadas:**
  - `grep_search` y `multi_replace_file_content` para refactorización masiva de código.
  - `run_command` para control de terminal, commits de Git y gestión de dependencias.
  - `view_file` para análisis semántico del código base.
  - Diseño de interfaces visuales complejas de manera autónoma iterando junto al usuario.

---

## 📱 Panel del Conductor (App Vecino)

El panel del conductor está diseñado para maximizar la transparencia y darle el control total al ciudadano, eliminando cualquier posibilidad de cobro indebido o estafa:

- **Pagos Rápidos y Transparentes:** Integración con Mercado Pago. Si el vecino paga de forma digital, se aplica **automáticamente un 20% de descuento** normativo (Ej: la tarifa base de $700 pasa a $560).
- **Libre Movilidad (Tip Inteligente):** Si un conductor abona su estacionamiento y se mueve a otra cuadra dentro de esa misma hora, **el sistema unifica el cobro** y no le cobra nuevamente. (Demostrable en la sección de *Comprobantes*).
- **Tarifa Fraccionada:** A partir de la segunda hora, el sistema cobra de forma fraccionada cada 15 minutos, sin redondear horas completas a favor del municipio.
- **Prevención de Estafas (Bloqueo Horario):** Durante feriados o fuera del horario de cobro, un gran **banner rojo** le avisa al conductor que el sistema está pausado, bloqueando pagos innecesarios y demostrando que no hay trampas.
- **Horarios y Zonas:** Un módulo educativo donde se detallan las reglas claras del Turno Diurno, el Turno Nocturno (Ej: Paseo Balcarce) y Feriados.
- **Mapa de Disponibilidad:** El conductor puede visualizar un mapa interactivo (light-mode) donde las dársenas se muestran en verde o rojo en tiempo real según su ocupación.

---

## 📊 Panel de Administración (Centro de Monitoreo)

Una sala de control de última generación para la Municipalidad de Salta, pensada para la toma de decisiones y el control del tránsito en tiempo real:

- **Métricas Generales (KPIs):** Recaudación en vivo, cantidad de boxes ocupados, índice de evasión y rendimiento del sistema.
- **Mapa de Calor (Spray):** Visualización general de las zonas de mayor demanda en la ciudad.
- **Salta Street Live (Simulación en Vivo):** Un mapa de altísima precisión donde se trazaron poligonalmente las dársenas sobre el cordón de la Av. Independencia. El mapa muestra en tiempo real cómo los autos entran (cajas rojas) y salen (cajas verdes), respetando garajes, cruces de calles y reservas especiales (discapacitados).
- **Detección de Anomalías:** El sistema cruza datos y levanta alertas rojas automáticamente si detecta, por ejemplo, que hay un auto estacionado en un box pero que no ha registrado su pago.
- **Actividad de Permisionarios:** Un feed en tiempo real para visualizar la efectividad y el trabajo de los tarjeteros, garantizando la inclusión social pero sumándoles tecnología.

---

## 🚀 Cómo Ejecutar el Proyecto

1. Clonar el repositorio.
2. Instalar las dependencias con \`npm install\`.
3. Levantar el servidor de desarrollo con \`npm run dev\`.
4. Ingresar a \`http://localhost:3000/admin\` o \`http://localhost:3000/conductor\` para visualizar los paneles.

**Hackathon PunaTech 2026 - ¡Preparados para el futuro de Salta!**
