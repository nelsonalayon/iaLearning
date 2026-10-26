# Tareas — mapa de calor (001)

Desglose de `plan.md`. Cada tarea se marca al terminarse. Flujo por tarea: primero los tests, luego el código, luego `node --test` y pase de navegador.

## T1 — Lógica pura + tests con `node --test`

- [x] `AGENTS.md`: reglas de negocio del mapa, trampas y comandos de verificación (antes de tocar `app.js`, principio 2).
- [x] `spec.md`: corrección del ejemplo de caso límite 13 (contradecía CA-1.5).
- [x] Tests en `%LOCALAPPDATA%\Temp\opencode\heatmap-tests\`: `extraer.js` + `rango`, `intensidad`, `detalle`, `invariantes`, `constitucion`.
- [x] `app.js`: bloques `// === PURE ===` (Fechas, Racha, Semana, Mes, Mapa), funciones del mapa (§2 del plan) y refactor `weekStartKey(hoyKey = todayKey())`.
- [x] `node --test` en verde → **27/27 tests** (Node v24.11.1), extractor con 5 bloques PURE. Comprobado también en el navegador: consola limpia, 13 columnas y 91 celdas.

**RF cubre**: RF-1, RF-2, RF-3, RF-5 (lógica) y RF-7; RNF-1 y RNF-5. Constitución 1/3/4.
**No cubre** (va en T2): RF-4 (leyenda en HTML), RF-6 (pintado y disparadores), parte visual de RF-3/RF-5/RF-7, RNF-6/7/8.

## T2 — Interfaz: `index.html` + `styles.css` + pintado + eventos

- [x] `spec.md`: RNF-6 reescrito (plan §9): 3:1 entre cuadrícula y papel + 4.5:1 en textos + rampa perceptible + significado por leyenda/`aria-label`. El original (3:1 entre estados adyacentes) era imposible (3⁴ = 81:1).
- [x] Tests estáticos (`estaticos.test.js`): 6 entradas de leyenda, clases compartidas leyenda↔pintado, texto neutro literal, ids HTML↔JS, contraste ≥4.5:1.
- [x] Tarjeta en `index.html` (leyenda estática de 6 con las clases `heat__cell--*`, contenedor `#heatmap`, línea `#heatmapDetail` con el texto neutro).
- [x] `styles.css`: rampa `--level-0…4` (hoja → tinta) con borde de tinta en cada celda, futuro **rayado + borde discontinuo**, celdas 18 px, columnas con etiqueta de mes, leyenda, línea de detalle, `:focus-visible`.
- [x] `app.js`: `renderHeatmap()` + `showHeatDetail()` con delegación de `pointerover`/`focusin`, colgado de `render()` (los 3 disparadores existentes; sin timers).

**RF cubre**: RF-4, RF-6, resto visual de RF-3/RF-5/RF-7; RNF-6, RNF-7, RNF-8.
**Notas**: hoy era domingo, así que no había celdas futuras que pintar — su aspecto se verificó en la muestra de la leyenda (misma clase: `border-style: dashed` + rayado) y su estado en los tests de Node. La etiqueta de mes usa la abreviatura de `es-ES` del navegador ("jul", "ago", "sept", "oct"), la misma de los rangos de las métricas.

## T3 — Verificación de navegador y cierre

- [x] Pase con el MCP de Chrome DevTools:
  - **RF-1/CA-1.x**: 13 columnas, 91 celdas, última columna = lunes 19 oct, etiquetas `jul/ago/sept/oct`, orden cronológico del DOM ✓.
  - **RF-2/CA-2.4**: dos sesiones del usuario hoy (45 + 15) → celda `level-2` y línea "1 h"; tras registrar +61 min → `level-4` y "2 h 1 min" ✓.
  - **CA-6.1**: alta real por el formulario → mapa actualizado sin recargar, leyenda intacta (6) ✓. **CA-6.2**: `visibilitychange` dispara `render()` ✓.
  - **RF-5/CA-5.1**: `pointerover` y foco escriben la línea; cada render la devuelve al neutro ✓. `aria-label` con fecha + estado (CA-5.2) ✓.
  - **RF-7/CA-7**: con las sesiones retiradas → 13 columnas, 91 celdas `level-0`, leyenda 6, sin errores; datos restaurados ✓.
  - **RNF-6**: orden de tabulación = orden cronológico (arrays de `aria-label` idénticos), contraste en tests ✓.
  - **RNF-7 @375 px**: 0 px de scroll, celdas 18×18, todo dentro de la tarjeta ✓ (captura revisada).
  - **RNF-8**: pintado + cálculo ≈ 29 ms (≤50) ✓ — dominado por `toLocaleDateString`.
  - **Consola**: sin errores ni avisos en todo el pase ✓.
- [x] Constitución (3 archivos de app, cero deps, mapa solo lee) + `MEMORY.md`.

**RF cubre**: la comprobación final de todos los RF en navegador.
