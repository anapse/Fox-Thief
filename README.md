# 🦊 FOX THIEF — EL ZORRO LADRÓN

> **Juego Arcade Casual de Granja y Estrategia Rápida**  
> *Recoge huevos, llena y vende la cesta, recupera vida y arroja macetas sobre el Zorro Ladrón antes de que saquee tu corral.*

---

## 📖 1. Descripción del Proyecto

**Fox Thief — El Zorro Ladrón** es un juego arcade interactivo desarrollado con **React 19**, **TypeScript**, **HTML5 Canvas 2D Engine**, **Tailwind CSS** y **Web Audio API**.

El jugador asume el papel de un granjero encargado de recolectar los huevos producidos por sus tres gallinas en el gallinero, arrastrarlos hacia la cesta de mimbre para su venta y defender el corral arrojando macetas desde la barda superior para espantar al astuto Zorro Ladrón.

El juego incluye un **sistema de clasificación global Top 50**, **seguimiento de récords históricos en tiempo real**, persistencia y sincronización con **Firebase Firestore**, y un **Panel Administrativo completo** accesible mediante `/admin`.

---

## 🎯 2. Objetivo del Juego y Mecánicas Principales

1. **Producción y Descenso de Huevos:**
   - Tres gallinas ubicadas en las perchas del gallinero ponen huevos a intervalos regulares.
   - Cada huevo rueda por la rampa de madera hacia el nido de recolección central en el suelo.
2. **Arrastre y Recolección:**
   - El jugador toca o hace clic sobre los huevos del suelo y los arrastra con el cursor o el dedo hacia la cesta.
3. **Llenado y Venta de la Cesta:**
   - La cesta tiene una capacidad máxima de **10 huevos** (`0 / 10`).
   - Al alcanzar los 10 huevos, la cesta se vende automáticamente:
     - Otorga **+10 monedas de oro** (más bonificaciones de mejoras).
     - Desencadena un efecto visual en el que **monedas doradas animadas vuelan en arco desde la cesta hacia el panel del HUD**.
     - Recupera **+0.5 corazones** de vida.
     - Muestra un banner de celebración (*"¡CANASTA LLENA!"*).
4. **El Zorro Ladrón:**
   - El zorro entra periódicamente por la derecha, caminando junto a la barda de piedra con destino al nido del suelo.
5. **Defensa con Macetas:**
   - Cuatro macetas de flores descansan sobre la barda superior.
   - Si el jugador toca una maceta cuando el zorro pasa por debajo, la maceta cae y lo golpea (*"¡BONK!"*), aturdiéndolo y obligándolo a huir.
   - Las macetas rotas dejan fragmentos en el suelo y entran en un breve tiempo de recarga antes de reaparecer.
6. **Robo de Huevos y Penalización:**
   - Si el jugador no espanta al zorro y este alcanza el nido, **roba todos los huevos acumulados en el suelo**, se burla y resta **-0.5 corazones** de vida al granjero.
7. **Sistema de Vidas (Corazones):**
   - El jugador comienza con **3 corazones máximos** (representados en intervalos de medio corazón: lleno `❤️`, medio `💔`, vacío `🖤`).
   - Pérdida: `-0.5 corazones` por cada robo exitoso del zorro.
   - Recuperación: `+0.5 corazones` por cada cesta de 10 huevos completada y vendida.
   - Límite: Mínimo `0.0`, Máximo `3.0`.
8. **Condición de Derrota (Game Over):**
   - Si los corazones llegan a `0.0`, la partida finaliza inmediatamente.
   - Se reproduce el sonido de derrota y se abre el modal de fin de partida.

---

## 🏆 3. Sistema de Puntuación y Ranking Top 50

- **Evaluación al Perder:**
  - El sistema comprueba si las monedas acumuladas en la partida califican dentro de los 50 mejores puntajes.
  - **Si no califica:** Muestra el resumen de la partida (cestas vendidas, zorros espantados, huevos recogidos) y permite volver al menú.
  - **Si entra en el Top 50:** Muestra la felicitación *"¡ENTRASTE AL TOP 50!"* y el formulario de registro obligatorio de nombre.
- **Protección de Registro:**
  - El modal de Top 50 no puede cerrarse ni omitirse hasta que el jugador escriba un nombre válido (mínimo 2 caracteres) y presione *"GUARDAR EN EL TOP 50"*.
  - Tras guardar, se registra en Firestore (y LocalStorage), se indica la posición oficial obtenida (`#Rank`) y se permite navegar al menú o consultar la tabla de líderes.
- **Detección de Nuevos Récords Mundiales:**
  - Si la puntuación supera el récord histórico vigente, el sistema genera automáticamente un evento inmutable de **Nuevo Récord** (`fox_thief_records_history`) con el titular anterior, nuevo valor, diferencia (`+Δ Pts`), fecha, hora y timestamp.

---

## 🕹️ 4. HUD (Interfaz en Pantalla)

El HUD superior está optimizado para teléfonos y escritorio sin invadir el área de juego:

```text
┌──────────────────────────────┐
│ [ ❤️ ❤️ ❤️ ]                  │
│ [ 🪙 120   ]                  │   [ 🥚 0 / 10 ]   [ ⏸️ ]
└──────────────────────────────┘
  Panel Vertical Combinado       Panel Cesta      Pausa
```

1. **Panel Vertical Combinado:**
   - Fila 1: Corazones de vida (llenos, medios o vacíos).
   - Fila 2: Icono de moneda + contador de monedas de oro.
2. **Panel de Cesta:** Indicador numérico `0 / 10` y barra de progreso.
3. **Botón de Pausa:** Acceso directo al menú de pausa con opciones de reanudar, reiniciar y silenciar.

---

## 🔐 5. Panel Administrativo (`/admin`)

El juego incluye un **portal de gestión y analítica privado** accesible mediante la ruta:

```text
/admin
```
*(O mediante hash `#/admin` para despliegues estáticos).*

### Características del Panel Admin:
1. **Acceso Seguro:**
   - Pantalla de inicio de sesión protegida mediante autenticación criptográfica (SHA-256 + Firebase Auth).
   - Credenciales iniciales: Usuario `anapse`, Contraseña `16546203`.
   - Token de sesión seguro en `sessionStorage` con expiración de 4 horas y botón de *"SALIR"*.
   - La ruta administrativa **NO** está expuesta como botón dentro del juego público.
2. **Secciones del Dashboard:**
   - **`[ RESUMEN ]`**: Récord histórico vigente (titular, fecha y hora), visitas totales, partidas iniciadas, partidas completadas (tasa de finalización), monedas acumuladas, promedio de puntos, huevos cosechados y zorros espantados; feed de actividad reciente en tiempo real.
   - **`[ RANKING ]`**: Listado de todas las puntuaciones con posición, nombre, ID de registro, monedas, cestas, zorros espantados, fecha y hora; buscador por nombre y filtros por rango de puntaje.
   - **`[ HISTORIAL DE RÉCORDS ]`**: Cronología inmutable de todas las marcas batidas, indicando jugador, récord anterior, nuevo récord, incremento (`+Δ Pts`), fecha y hora exacta.
   - **`[ VISITAS ]`**: Registros de tráfico con fecha, hora, desglose móvil vs escritorio y navegador.
   - **`[ JUGADORES ]`**: Consolidado de granjeros con total de partidas jugadas, récord personal y última fecha de actividad.
   - **`[ ANALÍTICA ]`**: Métricas de eficiencia de juego (porcentaje de acierto de macetas, duración media de partida) y gráfico comparativo de visitas vs partidas de los últimos 7 días.

---

## 📂 6. Estructura del Proyecto

```text
fox-thief/
├── index.html                     # Punto de entrada HTML con meta tags y tipografías
├── metadata.json                  # Metadatos del juego oficial
├── package.json                   # Dependencias y scripts de construcción
├── tsconfig.json                  # Configuración de TypeScript
├── vite.config.ts                 # Configuración de Vite (base: './' para GitHub Pages)
├── LICENSE                        # Licencia personalizada (Todos los derechos reservados)
├── README.md                      # Documentación completa del proyecto
├── .env.example                   # Plantilla de variables de entorno (Firebase, etc.)
├── public/
│   └── assets/
│       └── sprites/
│           ├── fondo.png          # Fondo oficial del gallinero y patio
│           ├── Gallina en el nido.png # Sprites de gallinas en perchas
│           ├── Huevo individual.png   # Sprite de huevo individual
│           ├── Cesta.png          # Sprite de la cesta de mimbre
│           ├── macetas.png        # Spritesheet de macetas intactas, cayendo y rotas
│           ├── zorro.png          # Spritesheet de animaciones del zorro ladrón
│           └── logo.png           # Logotipo oficial del juego
└── src/
    ├── main.tsx                   # Renderizado raíz de React
    ├── App.tsx                    # Orquestador del juego, enrutador /admin y telemetría
    ├── index.css                  # Estilos globales y Tailwind CSS v4
    ├── audio/
    │   └── soundManager.ts        # Sintetizador procedural con Web Audio API (cero 404s)
    ├── components/
    │   ├── GameCanvas.tsx         # Contenedor del Canvas 2D
    │   ├── HUD.tsx                # HUD con panel vertical combinado de corazones y monedas
    │   ├── MainMenu.tsx           # Menú principal con logo oficial y botones compactos
    │   ├── admin/
    │   │   ├── AdminPortal.tsx    # Orquestador de autenticación administrativa
    │   │   ├── AdminLogin.tsx     # Pantalla de login administrativo
    │   │   └── AdminDashboard.tsx # Dashboard con Resumen, Ranking, Récords y Analítica
    │   └── modals/
    │       ├── GameOverModal.tsx  # Modal de fin de partida y registro obligatorio Top 50
    │       ├── HowToPlayModal.tsx # Tutorial gráfico deslizable de 10 pasos
    │       ├── LeaderboardModal.tsx # Tabla pública Top 50
    │       ├── PauseModal.tsx     # Modal de pausa y configuración
    │       ├── StatsModal.tsx     # Estadísticas locales del jugador
    │       └── ContactModal.tsx   # Modal de contacto con anapse_video@hotmail.com
    ├── game/
    │   ├── constants.ts           # Coordenadas y dimensiones (9:16 - 720x1280)
    │   ├── AssetManager.ts        # Cargador y gestor de sprites con rutas relativas
    │   ├── SpriteStorage.ts       # Soporte de almacenamiento de assets
    │   └── GameEngine.ts          # Bucle principal, físicas, partículas, monedas y macetas
    ├── types/
    │   └── game.ts                # Tipos e interfaces de TypeScript
    └── utils/
        ├── firebase.ts            # Cliente modular de Firebase Firestore y Auth
        ├── adminService.ts        # Servicio de autenticación y analítica para /admin
        ├── leaderboardService.ts  # Servicio del Top 50 con fallback local
        └── storage.ts             # Almacenamiento local seguro
```

---

## 🛠️ 7. Tecnologías Utilizadas

- **Framework:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Empaquetador y Servidor Dev:** [Vite 8](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Motor Gráfico:** HTML5 Canvas 2D con renderizado por capas a 60 FPS
- **Motor de Audio:** Web Audio API procedural con osciladores y filtros sintetizados en tiempo real
- **Base de Datos y Autenticación:** [Firebase Firestore](https://firebase.google.com/) y Firebase Auth con fallback transparente a LocalStorage
- **Iconografía:** [Lucide React](https://lucide.dev/)

---

## 🚀 8. Instalación y Ejecución Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) v9 o superior

### Pasos de Instalación:
1. Clona o descarga el repositorio:
   ```bash
   git clone https://github.com/anapse/fox-thief.git
   cd fox-thief
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en:
   - Juego Público: `http://localhost:3000`
   - Panel Admin: `http://localhost:3000/admin` (o `http://localhost:3000/#admin`)

---

## 📦 9. Compilación para Producción

Para generar el paquete optimizado de producción:

```bash
npm run build
```

Los archivos compilados se generarán en el directorio `./dist`.

Para probar la versión de producción localmente:
```bash
npm run preview
```

---

## 🌐 10. Configuración de Firebase (Opcional)

El juego funciona al 100% de forma inmediata en modo local/offline. Para habilitar la sincronización global en la nube de Firebase Firestore:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Crea una base de datos **Cloud Firestore** en modo producción.
3. Copia el archivo `.env.example` a un nuevo archivo `.env`:
   ```bash
   cp .env.example .env
   ```
4. Completa las credenciales de tu proyecto:
   ```env
   VITE_FIREBASE_API_KEY="tu-api-key"
   VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="tu-proyecto"
   VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
   VITE_FIREBASE_APP_ID="tu-app-id"
   ```

### Colecciones Automáticas de Firestore:
- `fox_thief_ranking`: Puntuaciones de los jugadores.
- `fox_thief_records_history`: Historial de nuevos récords mundiales.
- `fox_thief_sessions`: Telemetría de partidas y visitas.
- `fox_thief_meta`: Métricas agregadas y récord actual en el documento `stats`.

---

## 🚀 11. Despliegue en GitHub Pages

El proyecto ya está configurado con `base: './'` en `vite.config.ts` y rutas relativas con `import.meta.env.BASE_URL`, permitiendo que el juego y los sprites carguen sin errores 404 bajo cualquier subdirectorio (ej. `https://anapse.github.io/fox-thief/`).

### Despliegue con GitHub Actions:
1. Sube el código a tu repositorio de GitHub.
2. En GitHub, ve a **Settings > Pages**.
3. En **Build and deployment > Source**, selecciona **GitHub Actions**.
4. Puedes utilizar un flujo estándar de Vite/Static HTML para publicar la carpeta `dist`.

---

## ✉️ 12. Contacto y Soporte

Para consultas, sugerencias o autorizaciones:
- **Correo Oficial:** `anapse_video@hotmail.com`

---

## ⚖️ 13. Licencia

**Copyright © 2026 Titular del Proyecto "Fox Thief — El Zorro Ladrón". Todos los derechos reservados.**  
Queda estrictamente prohibida la copia, reproducción, modificación, redistribución o uso no autorizado del código fuente, diseño, sprites, ilustraciones, mecánicas o logotipos de este proyecto sin autorización previa y por escrito. Consulta el archivo [LICENSE](./LICENSE) para más detalles.
