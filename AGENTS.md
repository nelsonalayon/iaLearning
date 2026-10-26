# Diario de Estudio — instrucciones para agentes

Web estática para registrar sesiones de estudio y ver la racha de días seguidos.
Proyecto en `C:\appRachas` (Windows, PowerShell).

## Reglas duras del proyecto

Vienen del usuario, no son preferencias: no las "mejores" sin preguntar.

- **La app son solo tres archivos**: `index.html`, `styles.css`, `app.js`. Nada más (los `.md` de documentación no cuentan).
- **Sin frameworks, sin librerías, sin paso de compilación, sin `package.json`, sin `npm install`.**
- **Debe funcionar abriendo `index.html` con doble clic** (`file://`). Nada de servidor, bundler, `fetch` a rutas relativas ni módulos ES (`type="module"` falla con `file://` por CORS).
- **Toda la interfaz en español** (etiquetas, mensajes de error, fechas con `toLocaleDateString("es-ES")`).
- **No añadas funcionalidades que no estén en el spec original.** La app no tiene botón de borrar, ni editar sesiones, ni totales, ni filtros. Pregunta antes de añadir.

## Reglas de negocio de la racha

Son el spec, no detalles implementativos: cualquier cambio debe respetarlas.

1. Un día cuenta si tiene **al menos una sesión**.
2. La racha son los días consecutivos con sesión **que terminan hoy**.
3. Si hoy no hay sesión pero ayer sí, **la racha sigue viva** (no se rompe hasta que acaba el día).
4. **Siempre fecha local, nunca UTC.**
5. **Mejor racha**: el tramo de días consecutivos más largo ya alcanzado. Se **recalcula** desde todas las sesiones, no se guarda (rellenar un hueco del pasado puede alargar un tramo y un pico guardado quedaría viejo). Los días futuros no cuentan en ninguna de las dos rachas.
6. **Las fechas futuras están prohibidas**: el input de fecha lleva `max = hoy` y `validate()` las rechaza al enviar.
7. **Total de la semana**: suma de los minutos de las sesiones cuyo día cae en la semana en curso (lunes a domingo, hora local). Un día con varias sesiones suma todos sus minutos (no se deduplica). Días fuera de la semana o futuros no cuentan. Se recalcula en cada render.
8. **Días estudiados del mes**: nº de días **distintos** con al menos una sesión dentro del mes en curso (día 1 → hoy, hora local). Un día con varias sesiones cuenta **una sola vez** (Set): aquí se cuentan días, no se suman minutos. Días futuros y de meses anteriores no cuentan. Se recalcula en cada render.

Implementación en `calculateStreak()` y `calculateBestStreak()` (`app.js`), con `isNextDay()` como helper de días consecutivos.

## Reglas de negocio del mapa de calor

Son el spec (`specs/001-heat-map/spec.md`); respétalas al pie de la letra.

1. **Rango fijo**: siempre 13 columnas × 7 filas = 91 celdas. La primera columna es el lunes hace 12 semanas (borde izquierdo **incluido**) y la última es la semana en curso, aunque esté incompleta. Filas de lunes a domingo.
2. **Cinco estados con umbrales definitivos**: sin sesión, 1–30, 31–60, 61–120 y 121+ min. Cambiarlos obliga a actualizar el spec primero.
3. **Día futuro** (fecha > hoy): estado "futuro" con borde discontinuo además del color. Hoy es un día normal, sin realce.
4. **Minutos por día**: suma de todas las sesiones del día. Se ignora una a una cualquier entrada con fecha que no sea `AAAA-MM-DD` válida, minutos no numéricos o < 0, fecha futura o anterior al rango — sin descartar el resto y sin errores.
5. **Etiqueta de mes**: la decide el **lunes** de cada columna; solo aparece cuando cambia de mes, y la primera columna siempre lleva.
6. **Leyenda**: estática en el HTML, 6 entradas, nunca se repinta.
7. **Línea de detalle** (textos exactos): inicial `"Pulsa un día para ver sus minutos."`; después `"lun, 24 oct — 45 min"`, `"… — sin sesión"` o `"… — aún no ha llegado"`. Conserva el último día y vuelve al texto neutro en cada render.
8. **Disparadores**: solo los tres de `render()` (carga, alta de sesión, foco de la pestaña). Sin timers.

### Trampas del mapa

- **La lógica del mapa recibe `hoyKey` como parámetro**: nada de `new Date()` dentro de esas funciones (los tests dependerían del reloj). `todayKey()` solo en la capa de pintado.
- La lógica pura vive entre `// === PURE INICIO ===` y `// === PURE FIN ===` (secciones Fechas, Racha, Semana, Mes y Mapa de calor): `extraer.js` la copia a un script temporal y **falla si un bloque toca `document` o `localStorage`**.
- Comparar fechas como texto (`"AAAA-MM-DD"`) solo después de `esFechaValida()`: `"2026-02-31"` es inválida aunque el `Date` la "corrige".
- El mapa solo accede a los datos a través de `loadSessions()`; pinta con `createElement`/`textContent`/`setAttribute`, nunca `innerHTML`. Las celdas son `<button>` con `aria-label` y `data-linea`.

## Trampas del código

- **`new Date("AAAA-MM-DD")` se interpreta como UTC** y desplaza el día según el huso. Usa siempre `parseDateKey()`, que construye la fecha local a medianoche. Prohibido `toISOString()`, `getUTC*()`, `setUTC*()`.
- **Para saber si dos fechas son días consecutivos, usa `isNextDay()`** (`setDate()` local). **Nunca sumes 24 h en milisegundos** (`+ 86400000`): en días con cambio de hora un día no dura 24 h exactas y la comparación falla.
- La mejor racha **no se persiste** en `localStorage`: se recalcula en cada render junto a la actual.
- **`getDay()` devuelve 0 para el domingo** (no 1). El offset desde el lunes es `(getDay() + 6) % 7`. Un error aquí hace que el lunes de la semana apunte al domingo anterior.
- El total semanal compara fechas como texto `"AAAA-MM-DD"` (lexicográfico = cronológico con ceros a la izquierda). No hace falta parsear a `Date` para el filtro.
- El total del mes usa `Set` (**deduplica**: un día con varias sesiones cuenta una vez) mientras el de la semana **suma minutos**. No mezcles los dos criterios.
- Último día del mes: `new Date(año, mes + 1, 0)` (constructor numérico = hora local). Ojo: `setDate(0)` sobre "hoy" da el último día del mes **anterior**.
- El topic del usuario se pinta con `textContent`, nunca con `innerHTML` (el contenido viene de `localStorage`, es entrada no confiable).
- La clave de `localStorage` es `diario-estudio:sesiones` (`app.js:4`) y guarda objetos `{ date, topic, minutes, createdAt }`, con `date` como texto `"AAAA-MM-DD"`.
- **El almacenamiento en `file://` no está particionado por ruta** (en Chrome/Edge/Firefox, todas las páginas `file://` del navegador comparten el mismo `localStorage`): otra copia de esta app en otra ruta ve los mismos datos. Y si el navegador bloquea el almacenamiento, `localStorage` lanza excepción → `loadSessions()` la captura (devuelve `[]`) y `saveSessions()` muestra error en el formulario. Al probar, no des por hecho un estado limpio: borra la clave desde DevTools.
- Si el usuario abre la app desde otro huso horario, las fechas de la lista se desplazan un día (están guardadas como texto, sin zona).
- `app.js` **no es un módulo ES y toca el DOM al cargarse**, así que no se puede `require()`/importar en Node.

## Verificación

No hay framework de test, ni scripts de npm, ni CI. Para verificar:

- Abre `C:\appRachas\index.html` con doble clic (`Start-Process "C:\appRachas\index.html"`) y prueba a mano: añadir sesión, recargar, comprobar que persiste.
- Para la lógica pura de fechas/racha, Node v24 está instalado en la máquina: extrae `toDateKey`, `parseDateKey`, `todayKey`, `calculateStreak`, `calculateBestStreak`, `isNextDay`, `weekStartKey`, `weekEndKey`, `calculateWeekMinutes`, `formatMinutes`, `monthStartKey`, `monthEndKey` y `calculateMonthDays` de `app.js` a un script temporal en `%LOCALAPPDATA%\Temp\opencode` y ejecútalo con `node`. Comprueba siempre el cruce de mes/año y el caso "hoy vacío pero ayer con sesión".
- Casos obligatorios para el total semanal: el domingo anterior excluido, mañana excluido, dos sesiones el mismo día suman ambas, `parseDateKey(weekStartKey()).getDay() === 1` (es lunes), `parseDateKey(weekEndKey()).getDay() === 0` (es domingo).
- Casos obligatorios para los días del mes: un día con varias sesiones cuenta **una** vez, último día del mes anterior excluido, día futuro excluido, `parseDateKey(monthStartKey()).getDate() === 1` (y mismo mes/año que hoy), y `monthEndKey()` = último día real del mes.
- Casos que deben cubrir los tests de la mejor racha: días duplicados (un día con varias sesiones cuenta **una** vez), huecos que rompen un tramo, días futuros ignorados, y el invariante **mejor racha ≥ racha actual**.
- Comprobación estática útil: los `id` de `index.html` deben coincidir con los `getElementById` de `app.js` y las clases usadas por el JS existir en `styles.css`.

## Decisiones pendientes de revisión del usuario

No son bugs: son puntos que el usuario aún no ha aprobado. Si tocas esta área, menciónalo.

- Sin borrar ni editar sesiones → una sesión mal puesta queda para siempre.
- Al añadir, se vacían tema y minutos pero **la fecha se conserva** (para apuntar varias sesiones del mismo día).
- Validación propia en JS (mensajes en español) en vez de la nativa del navegador (`required`/`min`), cuyos textos dependen del idioma del SO.
- Los minutos se redondean al entero y no hay límite máximo.

## Contexto del entorno

- La carpeta está en `C:\appRachas` **a propósito, fuera del Escritorio**: el Escritorio de este usuario es `C:\Users\neanm\OneDrive\Desktop` y OneDrive rompe git con archivos bloqueados por sincronización.
- **El proyecto no es un repositorio git** (`git status` falla). No des por hecho que puedes hacer commits.

## Memoria

- al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las desiciones tomadas.
- Al terminar una tarea, acualizalo: estado actual, desiciones importantes (con su por qué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se converte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales)

## Verificación

- No hay framework de tests, ni suite, ni CI. Después de cada cambio, verifica con el MCP de Chrome DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la vista móvil.
- Para la lógica pura de fechas/racha sí se usan pruebas con Node en un script temporal en `%LOCALAPPDATA%\Temp\opencode` (constitución, principio 4): sin `package.json`, sin `npm install`. Del mapa de calor (verificado en Node 24: `node --test <dir>` NO vale, trata el directorio como módulo): primero `node "$env:LOCALAPPDATA\Temp\opencode\heatmap-tests\extraer.js"`, después `Set-Location "$env:LOCALAPPDATA\Temp\opencode\heatmap-tests"; node --test`.
- Para empezar de cero: DevTools → Application → Local Storage → borrar la clave `diario-estudio:sesiones`.