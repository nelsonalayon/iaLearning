# MEMORY.md - Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que ya no aporte.

## Estado actual
- v4: registrar sesiones, racha actual, mejor racha, minutos de la semana, días estudiados del mes, lista.
- **Diseño "hoja de cuaderno"** (revisión con la skill `frontend-design`): tinta azul, línea de margen roja a la izquierda de todo y un único trazo de marcatextos amarillo detrás de la racha actual.
- Las 4 métricas son **un panel con filetes de 1px** (`.stats` > `.cell`), no 4 tarjetas con sombra; 2 columnas desde 420px, apiladas debajo.
- Tipografía: **Georgia** (título, etiquetas de celda, cifras) + sans del sistema (UI, datos). Formulario con campos tipo renglón (solo línea inferior); estado vacío en caja punteada con CTA.
- Datos en `localStorage` (`diario-estudio:sesiones`): `{ date, topic, minutes, createdAt }`, `date` como `"AAAA-MM-DD"`.
- Fechas futuras bloqueadas (`max` + `validate()`); estadísticas repintadas al recuperar el foco (`visibilitychange`).
- Existe `opencode.json` en la raíz (config de la herramienta, no de la app): MCP `chrome-devtools` con el esquema V2 `mcp.servers` + `"type": "local"` + `command` como array. El formato `mcpServers`/`args` del README de npm es para Claude Desktop y OpenCode lo ignora.
- **`docs/constitution.md`**: 6 principios innegociables aprobados por el usuario (3 archivos y cero deps · el spec manda · lógica/interfaz separadas · tests con `node` sin instalar nada · datos intocables con `textContent` · español en la interfaz e inglés en identificadores). Cualquier cambio nuevo pasa por ahí.
- **Test e2e en Chrome (MCP) superado**: 3 sesiones por UI → racha 3, mejor 3, semana 135 min, mes 3, consola limpia. `localStorage` restaurado a `null` después (la app no tiene borrar: los datos de prueba serían permanentes).
- **`specs/001-heat-map/spec.md`** (revisado por QA, sin dudas abiertas) **+ `plan.md` + `tasks.md`**: mapa de **13 columnas fijas** (12 semanas + actual = **91 celdas**), 5 estados (sin sesión / 1–30 / 31–60 / 61–120 / 121+), leyenda **estática de 6 entradas** en HTML, línea fija de detalle con textos exactos, etiqueta de mes por el **lunes**, hoy sin realce. Plan: `hoyKey` siempre como parámetro, bloques `// === PURE ===` en `app.js` extraídos a temp, celdas `<button>` con delegación de 2 eventos, hook en `render()` (sin disparadores nuevos).
- **T1 completada (25/10)**: `AGENTS.md` actualizado con las reglas del mapa **antes** de tocar código; lógica pura en `app.js` (bloques PURE en Fechas/Racha/Semana/Mes/Mapa + refactor `weekStartKey(hoyKey = todayKey())`); tests escritos antes en `%LOCALAPPDATA%\Temp\opencode\heatmap-tests` (`extraer.js` + 5 `*.test.js`) → **27/27 en verde** con `node --test`; app cargada en Chrome con consola limpia (13 columnas, 91 celdas). Corregido el caso límite 13 del spec: la semana del 31 ago–6 sep etiqueta "ago." (lo decide su lunes), no "sep." — contradecía CA-1.5.
- Correcciones derivadas del QA: `AGENTS.md` (Verificación: sin framework/suite/CI, pero sí pruebas Node temporales — antes decía "no hay tests automáticos") y constitución principio 1 (la verificación ya no es "un dir de la raíz": exime `.md`, `docs/`, `specs/` y config de herramientas como `opencode.json`).
- **T2 + T3 completadas (25/10)**: RNF-6 reescrito en el spec (3:1 cuadrícula/papel, 4.5:1 textos, rampa perceptible, significado en leyenda/`aria-label`); tarjeta `heat` en `index.html` (leyenda estática de 6 con las mismas clases que las celdas, `#heatmap`, `#heatmapDetail` con texto neutro); paleta en `styles.css` (rampa `--level-0…4` con borde de tinta, futuro rayado + borde discontinuo, celdas 18 px, `:focus-visible`); `renderHeatmap()` + delegación `pointerover`/`focusin` colgada de `render()`. Tests **33/33**; pase MCP: CA uno a uno, 375 px sin scroll, consola limpia, render ≈29 ms (≤50), datos del usuario intactos. Detalle: la etiqueta de mes usa la abreviatura ICU de es-ES ("sept", sin punto) — anotado en CA-1.5 del spec.
- **Auditoría RF por RF (26/10)**: 33/33 tests ejecutados + RF/RNF verificados en navegador → **7/7 criterios, veredicto: spec cumplida**. Defecto real encontrado: CA-4.2 (las muestras de leyenda no llevaban el borde de tinta) → corregido en `styles.css` + aserción de regresión en `estaticos.test.js`. Matices declarados: "solo 3 disparadores" verificado estáticamente, sin tap físico, celda táctil de 18 px.
- **Curso del método creado en `C:\cursos-ia\metodo-ia\`** (26/10): `README.md` + fases `00`–`10` + `prompts-plantillas.md` + `lecciones.md` + `prompts-verbatim.md` con los **39 prompts reales** recuperados de `opencode.db` (tabla `session_message`, tipo `user`). Ficha del caso en `docs/caso-diario-estudio.md`. Deudas anotadas ahí: sin git, tests sin versionar (viven en Temp), auditoría en la misma sesión.

## Decisiones (y por qué)
- Sin backend ni dependencias ni fuentes externas: se abre con doble clic y funciona offline.
- Mejor racha, total semanal y días del mes: **recalculados en cada render**, nunca persistidos.
- **Semana = lunes a domingo y suma minutos. Mes = día 1 → hoy y cuenta días distintos** (Set). Solo mes en curso.
- Rangos visibles ("19 – 25 oct", "1 – 31 oct") para evitar la ambigüedad de "esta semana/mes".
- Un solo momento llamativo (marcatextos); sin emojis como iconos, sin versales, sin gradients.

## Aprendizajes y errores a evitar
- **Suite verde ≠ spec cumplida**: con 33/33 la auditoría aún encontró CA-4.2; y hubo 2 bugs en tests propios (nivel 1 vs 2; "julio" vs "jul"). Leer resultados, no sólo el recuento; todo defecto acaba en un test.
- `new Date("AAAA-MM-DD")` se parsea como UTC → usar `parseDateKey()`. `getDay()`: 0 = domingo → offset `(getDay() + 6) % 7`.
- Último día del mes: `new Date(año, mes + 1, 0)`; `setDate(0)` sobre "hoy" da el mes **anterior**.
- No sumar `86400000` ms (DST) → `setDate()`.
- **Georgia da cifras oldstyle** (la "0" parece minúscula y la cifra pierde presencia) → forzar `font-variant-numeric: lining-nums` + `font-feature-settings: "lnum" 1`.
- `text-transform: capitalize` arruinaba la fecha → formato corto "sábado, 24 de oct de 2026" (sacado del CSS, no del JS).
- Capturas con headless Edge: `--headless=new --screenshot` funciona, pero en Windows `--window-size` tiene un **mínimo ~516px** (viewport ~492): no sirve para móvil; validar el stacked forzando 1 columna en una copia de preview en Temp. Con el MCP pasa igual: `resize_page` no baja de ~485px → usar `emulate({ viewport: "375x812x2,mobile,touch" })` y borrarlo al terminar (`viewport: ""`).
- Al probar, no des por hecho `localStorage` limpio: el bucket `file://` es compartido entre rutas.

## Próximos pasos
- Mapa de calor **completo** (T1 + T2 + T3): spec, plan, tareas, código y verificación cerrados.
- Botón de borrar/editar sesiones (pendiente de que el usuario lo apruebe).
