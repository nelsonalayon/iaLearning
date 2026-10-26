# Constitución del Diario de Estudio

6 principios innegociables. Si un cambio rompe alguno, no se aprueba.

1. **Tres archivos y nada más**: la app son solo `index.html`, `styles.css` y `app.js`; sin dependencias, frameworks, build ni `package.json`. *Verificable: en la raíz solo hay tres archivos de app — los `.md`, las carpetas de documentación (`docs/`, `specs/`) y los ficheros de configuración de herramientas no cuentan.*
2. **El spec manda**: el código solo hace lo que dice `AGENTS.md`; cualquier cambio de comportamiento actualiza primero el spec. *Verificable: el diff del cambio incluye su diff en AGENTS.md.*
3. **Lógica e interfaz separadas**: las funciones de fechas, rachas y cálculos no tocan el DOM ni `localStorage`; el DOM solo en guardado y pintado, y el HTML no guarda reglas de negocio. *Verificable: `document.*`/`localStorage` solo en los bloques de guardado y render.*
4. **Tests sin instalar nada**: Node v24 ya está en la máquina; los tests se extraen a un script temporal en `%LOCALAPPDATA%\Temp\opencode` y se ejecutan con `node`. *Verificable: cero `package.json`, cero `npm install`.*
5. **Los datos del usuario son intocables**: solo se lee/escribe la clave `diario-estudio:sesiones`, el contenido se pinta con `textContent` (nunca `innerHTML`) y todo cambio que toque el guardado se prueba antes sobre una copia.
6. **Español en la interfaz, inglés en los identificadores**: UI, mensajes y fechas en `es-ES`; nombres de variables y funciones en inglés, comentarios en español para quien empieza a programar.
