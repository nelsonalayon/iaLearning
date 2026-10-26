# Plan de implementación: mapa de calor (specs/001-heat-map)

Traducción del QUÉ (spec.md) al CÓMO. Sin dependencias, sin archivos nuevos de app, con "hoy" siempre como parámetro en la lógica. Cada bloque indica los RF que cubre.

## 1. Archivos: qué se toca y para qué

| Archivo | Acción | Responsabilidad | RF |
|---|---|---|---|
| `AGENTS.md` | modificar **antes de la primera línea de código** | Reglas de negocio nuevas del mapa (13 columnas, 5 umbrales, leyenda de 6, textos exactos de la línea, los 3 disparadores), trampas nuevas (`hoy` como parámetro, marcadores PURE, botones en celdas) y qué probar. Principio 2. | previo a todos |
| `index.html` | modificar | Una tarjeta entre el panel `.stats` y el formulario con: `h2` "Últimas 12 semanas"; leyenda **estática** de 6 `li` (cada muestra con la misma clase modificadora que usará cada celda); contenedor de las 13 columnas; línea de detalle con el texto neutro `"Pulsa un día para ver sus minutos."`. Sin reglas de negocio: solo estructura y textos literales del spec. | RF-1 (contenedor), RF-4, RF-5 (línea neutra), RF-7 |
| `styles.css` | modificar | Paleta de los 5 niveles + estado futuro; celda futura con **borde discontinuo** (distinguible sin color); celdas de 18 px con separación (≥16 px a 375 px, sin scroll); columnas y fila de etiquetas de mes; leyenda; línea de detalle; `:focus-visible` en celdas; todo en los tokens de tinta del cuaderno. | RF-2 (color), RF-3, RF-4, RF-7, RNF-6/7 |
| `app.js` | modificar | Dos bloques nuevos, separados como ya manda la constitución: **lógica pura** (entre marcadores `// === PURE INICIO ===` / `// === PURE FIN ===`, sin `document` ni `localStorage`) y **pintado** (DOM + eventos). Un gancho en `render()` existente. | RF-1, RF-2, RF-3, RF-5, RF-6, RF-7 |
| `specs/001-heat-map/spec.md` | solo lectura | Contrato. No se toca salvo el punto del §9. | — |
| `MEMORY.md` | modificar al final | Estado y decisiones. | — |
| Tests | **fuera del repositorio**, en `%LOCALAPPDATA%\Temp\opencode\heatmap-tests\` | Ver §6. | RF-1…RF-5, RF-7 |
| *No se crea* | — | Ni cuarto archivo de app, ni `package.json`, ni `node_modules`, ni framework (constitución 1 y 4). | — |

**RF-6, sin disparadores nuevos**: la lista cerrada de CA-1.1 (carga, alta de sesión, foco recuperado) ya coincide con los tres puntos donde hoy se llama a `render()` (arranque, `submit`, `visibilitychange`). El mapa solo se cuelga de `render()`; no se añade ningún `setInterval` ni listener de tiempo: entre medias el mapa no cambia (CA-6.2).

## 2. Funciones puras (todas sin DOM; "hoy" como parámetro)

Ninguna lee el reloj: quien pinta calcula `hoyKey = todayKey()` una vez y lo baja. Eso es lo que permite tests deterministas (RNF-1, constitución 3).

| Función | Contrato | RF |
|---|---|---|
| `esFechaValida(key)` | `true` solo si cumple `AAAA-MM-DD` **y** el redondeo ida y vuelta devuelve la misma clave (mata `"2026-02-31"`). | RF-2 (CA-2.6) |
| `addDaysKey(key, delta)` | desplazamiento local con `setDate`; nunca `+ 86400000`. | RNF-5 |
| `weekStartKey(hoyKey = todayKey())` | refactor del existente: un parámetro opcional con valor por defecto. Mismo resultado para los llamadores actuales. | RF-1 |
| `heatmapStartKey(hoyKey)` | lunes de la semana de `hoy` − 84 días (primer día mostrado, **incluido**). | RF-1 (CA-1.1/1.4) |
| `heatmapLevel(minutes)` | `0` (sin sesión) \| `1` 1–30 \| `2` 31–60 \| `3` 61–120 \| `4` ≥121; defensivo ante `NaN`/negativos → `0`. | RF-2 (CA-2.2/2.3) |
| `dayTotals(sessions, hoyKey)` | `{ día: sumaMinutos }` filtrando una a una: fecha válida, minutos numéricos finitos ≥ 0, `día <= hoy`, `día >= heatmapStartKey(hoy)`. | RF-1 (CA-1.4), RF-2 (CA-2.1/2.4/2.5/2.6) |
| `heatmapColumns(hoyKey)` | 13 columnas `{ lunes, etiqueta }`: etiqueta = mes **del lunes** si difiere del lunes anterior; la primera siempre. | RF-1 (CA-1.2/1.3/1.5) |
| `cellState(dayKey, hoyKey, totals)` | `"futuro"` si `dayKey > hoyKey`; si no, `heatmapLevel(totals[dayKey] ?? 0)`. | RF-3 (CA-3.1), RF-2 |
| `formatDayShort(key)` | `"lun, 24 oct"` vía `toLocaleDateString("es-ES", …)`, igual que los rangos de las métricas. | RF-5 |
| `heatmapTexts(dayKey, hoyKey, totals)` | `{ linea, accesible }`: línea = `formatDayShort + " — 45 min" / " — sin sesión" / " — aún no ha llegado"` (minutos con el `formatMinutes` ya existente); accesible = fecha larga (`formatDate` ya existente) + estado. | RF-5 (CA-5.1/5.2/5.3) |
| `heatmapGrid(hoyKey, sessions)` | **fachada única**: 13 columnas × 7 días `{ dayKey, estado, linea, accesible }`. Lo que consume el pintado y los tests. | RF-1, RF-2, RF-3, RF-5, RF-7 |

Lo que NO es función: la leyenda (estática en HTML, CA-4.1) y el texto neutro (literal en HTML).

## 3. Algoritmo (pseudocódigo)

**A. Totales del día (filtros de datos) — RF-2, RF-1**

```
FUNCIÓN dayTotals(sesiones, hoyKey):
  inicio ← heatmapStartKey(hoyKey)
  totales ← mapa vacío
  PARA CADA s EN sesiones:
      SI NO esFechaValida(s.date)          ENTONCES CONTINUAR    // CA-2.6
      SI tipo(s.minutes) ≠ número
         O NO es finito O s.minutes < 0    ENTONCES CONTINUAR    // CA-2.6
      SI s.date > hoyKey                   ENTONCES CONTINUAR    // CA-2.5
      SI s.date < inicio                   ENTONCES CONTINUAR    // CA-1.4
      totales[s.date] ← (totales[s.date] ?? 0) + s.minutes       // CA-2.4
  DEVOLVER totales
```

**B. Nivel de intensidad — RF-2**

```
FUNCIÓN heatmapLevel(min):
  SI min ≤ 0  ENTONCES DEVOLVER 0
  SI min ≤ 30 ENTONCES DEVOLVER 1
  SI min ≤ 60 ENTONCES DEVOLVER 2
  SI min ≤ 120 ENTONCES DEVOLVER 3
  EN OTRO CASO            DEVOLVER 4
```

**C. Construcción de la cuadrícula — RF-1, RF-3, RF-5, RF-7**

```
FUNCIÓN heatmapGrid(hoyKey, sesiones):
  totales ← dayTotals(sesiones, hoyKey)
  lunesBase ← heatmapStartKey(hoyKey)          // lunes hace 84 días
  columnas ← lista vacía
  mesPrevio ← NULO

  PARA c DESDE 0 HASTA 12:                     // 13 columnas, siempre
      lunes ← addDaysKey(lunesBase, c × 7)
      mesColumna ← mesLocal(lunes)             // el mes del LUNES (CA-1.5)
      SI c = 0                                ENTONCES etiqueta ← mesCorto(lunes)
      SINO SI mesColumna ≠ mesPrevio          ENTONCES etiqueta ← mesCorto(lunes)
      SINO                                     etiqueta ← ""

      dias ← lista vacía
      PARA d DESDE 0 HASTA 6:                  // lunes → domingo, orden cronológico
          clave ← addDaysKey(lunes, d)
          estado ← SI clave > hoyKey ENTONCES "futuro" SINO heatmapLevel(totales[clave] ?? 0)
          textos ← heatmapTexts(clave, hoyKey, totales)
          AÑADIR A dias { dayKey: clave, estado, linea: textos.linea, accesible: textos.accesible }

      AÑADIR A columnas { lunes, etiqueta, dias }
      mesPrevio ← mesColumna

  DEVOLVER columnas                            // 13 × 7 = 91 celdas (invariante)
```

**D. Pintado — RF-1, RF-3, RF-5, RF-6, RF-7** (este bloque sí toca DOM)

```
FUNCIÓN renderHeatmap(sesiones):
  hoy ← todayKey()                             // única lectura de reloj (capa interfaz)
  columnas ← heatmapGrid(hoy, sesiones)

  vaciar el contenedor (textContent ← "")      // repintado completo
  PARA CADA columna:
      crear div de columna
      PARA CADA día EN columna.dias:
          celda ← <button type="button" class="heat__cell heat__cell--{estado}">
          celda.setAttribute("aria-label", día.accesible)   // CA-5.2, sin color
          celda.setAttribute("data-linea",  día.linea)      // texto ya calculado
          añadir celda al div de columna                     // orden = cronológico
      añadir span de etiqueta de mes (texto de columna.etiqueta)
  #heatmapDetail.textContent ← "Pulsa un día para ver sus minutos."   // CA-5.1: cada render reinicia

EVENTOS (delegación, solo 2) sobre el contenedor:
  EN pointerover Y focusin:
      si el destino es .heat__cell → #heatmapDetail.textContent ← destino.dataset.linea
      // no hacer nada si no lo es: la línea conserva el último día (CA-5.1)
```

## 4. Cómo se pinta la interfaz

- **Ubicación**: tarjeta entre el panel de estadísticas y el formulario (decisión tomada en las preguntas del spec).
- **Estructura por columna**: cada columna es un `div` con sus 7 botones y, al final, la etiqueta de mes. Así la etiqueta queda "bajo su columna" por construcción y el orden del DOM (columna a columna, lunes a domingo) **es** el orden cronológico → Tab recorre las celdas cronológicamente (RNF-6) sin atajos ni `tabindex` manuales.
- **Celdas = `<button type="button">`**: foco, teclado y dedo gratis, y su nombre accesible es el `aria-label` (fecha + estado). Nunca `disabled`: las futuras también deben enseñar su detalle (CA-5.1).
- **Colores**: la clase modificadora (`heat__cell--level-0` … `--level-4`, `--future`) es **la misma** en celdas y en las muestras de la leyenda → CA-4.2 queda garantizado por estructura, no a mano.
- **Futuro sin solo color**: `--future` combina relleno distinto **y** borde discontinuo (CA-3.1) más su `aria-label`.
- **Repintado**: se vacía el contenedor y se reconstruyen los 91 nodos con `createElement` + `textContent`/`setAttribute` — jamás `innerHTML` (constitución 5, trampa de `AGENTS.md`). La leyenda no se toca nunca (CA-6.1).
- **Sin etiquetas de fila** (lun/mar/…): el spec no las pide; añadirlas exigiría actualizar antes el spec (principio 2). Se anota aquí para que no aparezcan "por mejorar".
- **RNF-8**: 91 nodos + un `vaciar` por render; holgado frente a 50 ms.

## 5. Decisiones técnicas (y su alternativa descartada)

1. **`hoyKey` como parámetro en toda la lógica** — tests deterministas sin reloj falso. *Descartado*: `new Date()` dentro de la lógica (habría que parchear el reloj o aceptar tests que cambian a medianoche).
2. **Tests por extracción con marcadores PURE en `app.js`** — un script temporal lee `app.js`, corta los bloques marcados y añade el `module.exports`. *Descartado*: cuarto archivo `logica.js` (constitución 1); `module.exports` dentro de `app.js` (`require()` revienta: toca el DOM al cargarse, lo advierte `AGENTS.md`); framework de test (constitución 1 y 4).
3. **Refactor de `weekStartKey(hoyKey = todayKey())`** — una sola fuente de verdad para "semana = lunes a domingo". *Descartado*: duplicar la cuenta para el mapa (doble mantenimiento: si se corrige el `(+ 6) % 7` en un sitio, se olvida en el otro).
4. **`esFechaValida` = regex + ida y vuelta** — `"2026-02-31"` rueda a 1 de marzo con el constructor de `Date` y pasaría un solo regex. *Descartado*: solo `^\d{4}-\d{2}-\d{2}$`.
5. **Minutos estrictos (`typeof number`, finito, ≥ 0)** — coincide con la letra del CA-2.6 y con lo que el formulario siempre guarda (`Math.round(Number(…))`). *Descartado*: coerción con `Number()`, que daría entrada a textos corruptos.
6. **Celdas como `<button>`** — nombre accesible fiable, foco y dedo sin trucos. *Descartado*: `role="grid"` con filas reales (obliga a markup de filas y a reinventar el CSS de columnas); `<span tabindex>` con `aria-label` (el rol genérico no expone nombre de forma fiable).
7. **Delegación de 2 eventos en el contenedor** — `pointerover` cubre ratón y toque, `focusin` cubre teclado. *Descartado*: 91 listeners (más código y se pierden con cada repintado).
8. **Repintado completo (vaciar y reconstruir)** — 91 nodos, imperceptible. *Descartado*: actualizar solo la celda cambiada (estado mutable y código de parcheo para ahorrar milisegundos).
9. **Leyenda estática en HTML con las mismas clases que las celdas** — cumple CA-4.1 y hace CA-4.2 estructural. *Descartado*: generarla desde JS (más JS por un texto que nunca cambia, y es justo lo que obligó a sacar la leyenda de CA-6.1).
10. **Textos de detalle precalculados en `data-linea`** — cero estado entre módulos; sobrevive a los repintados. *Descartado*: variable de módulo con el último grid (se desincroniza) o recalcular en cada hover (necesitaría `totals` a mano).
11. **Minutos del día con el `formatMinutes` existente** — un día de 135 min enseña "2 h 15 min", igual que la métrica semanal. *Descartado*: `"135 min"` a secas (dos formatos distintos para lo mismo).
12. **Sin `aria-live` en la línea de detalle** — la información ya llega por el `aria-label` al enfocar. *Descartado*: `aria-live`, que anunciaría lo mismo dos veces.
13. **Paleta de 5 rellenos + borde de tinta en cada celda** — rampa clara→tinta con saltos perceptibles; el borde garantiza la cuadrícula visible ≥3:1 sobre el papel. *Descartado*: rellenos sin borde (la celda más clara se disuelve en el papel). **Ver §9**: el RNF-6 pide 3:1 *entre estados adyacentes*, que es imposible con 5 estados.

## 6. Estrategia de tests con `node --test`

Todo en `%LOCALAPPDATA%\Temp\opencode\heatmap-tests\`, nada dentro de `C:\appRachas` (constitución 1 y 4; cero `package.json`, cero `npm install`). Node v24 trae el runner: `node --test <carpeta>`.

```
$T = "$env:LOCALAPPDATA\Temp\opencode\heatmap-tests"
node "$T\extraer.js"      # 1) recorta los bloques PURE de C:\appRachas\app.js → logica.js
node --test "$T"          # 2) ejecuta los *.test.js (importan ./logica.js, generado)
```

- `extraer.js`: corta cada par `// === PURE INICIO/FIN ===`, **falla si un bloque contiene `document.` o `localStorage`** (constitución 3 automatizada) y añade el `module.exports` con la lista de funciones.
- Tests con `node:test` + `node:assert/strict`, y `hoyKey` **siempre literal** (`"2026-10-24"`, `"2027-01-04"`, …): nada depende del reloj de la máquina.
- Los tests estáticos leen los archivos del repositorio por ruta absoluta (solo lectura).

| Archivo de test | Qué comprueba | RF |
|---|---|---|
| `rango.test.js` | 13 columnas siempre; primera columna = lunes − 84 días y su día es lunes; última columna = lunes de `hoy`; 91 celdas, claves únicas y ordenadas; primera columna con etiqueta y etiquetas solo al cambiar de mes del lunes; semana que cruza año (hoy en enero → columna de diciembre); sesión antes del rango fuera y sesión en el primer día dentro; `sessions = []` → todo nivel 0; `addDaysKey` cruza cambio de hora (`2026-10-25 → 2026-10-26`) y año. | RF-1, RF-7, RNF-5 |
| `intensidad.test.js` | bordes 0/1/30/31/60/61/120/121/480; dos sesiones un día → suma (15+16 = nivel 2); fecha `"2026-02-31"` o formato raro → ignorada sin descartar el resto; minutos en texto/negativos → ignorados; sesión con fecha futura → ignorada; celda futura → `"futuro"` aunque haya datos; hoy con sesión → nivel, no futuro. | RF-2, RF-3 |
| `detalle.test.js` | los 3 formatos exactos de CA-5.1 (`"— 45 min"`, `"— sin sesión"`, `"— aún no ha llegado"`), el día de la semana correcto y el texto accesible de vacías y futuras; `heatmapTexts` coincide con `toLocaleDateString('es-ES', …)` calculado en el propio test. | RF-5 |
| `estaticos.test.js` | `index.html`: exactamente 6 entradas de leyenda, con "Sin sesión" y "Aún no ha llegado", y el texto neutro literal; las clases de la leyenda existen en `styles.css` **y son las mismas** que usa el pintado (CA-4.2); `app.js` no contiene `innerHTML`; no existe `package.json` en la raíz; contraste ≥4.5:1 del texto (`--ink-soft` sobre `--paper`) leyendo los hex de `:root`. | RF-4, RNF-3, RNF-4, constitución 1/3/5 |
| `invariantes.test.js` | `91 = 13 × 7`; todo estado ∈ `{"futuro", 0..4}`; ningún `dayKey > hoy` con estado ≠ `"futuro"`; las 6 entradas de la leyenda ↔ los estados usados; toda clave pasa `esFechaValida`. | RF-1, RF-2, RF-3, RF-4 |

**Lo que Node no cubre**: RF-6 (disparadores), el aspecto visual (paleta, borde discontinuo), 375 px sin scroll y la consola limpia → pase de navegador con el MCP de Chrome DevTools, como manda `AGENTS.md`, más la comprobación manual de los CA uno a uno.

## 7. Cobertura de RF (resumen)

| RF | Cubierto en |
|---|---|
| RF-1 rango/estructura/mes | §2 (`heatmapStartKey`, `heatmapColumns`), §3C, §4, `rango.test.js` |
| RF-2 intensidad | §2 (`heatmapLevel`, `dayTotals`), §3A/3B, §4 (color), `intensidad.test.js` |
| RF-3 futuro vs pasado | §2 (`cellState`), §3C, §4 (borde discontinuo), `intensidad.test.js` + `estaticos.test.js` |
| RF-4 leyenda | §1 (HTML estático), §4 (clases compartidas), `estaticos.test.js` |
| RF-5 detalle | §2 (`heatmapTexts`), §3D, §4 (delegación), `detalle.test.js` + `estaticos.test.js` |
| RF-6 actualización | §1 (gancho en `render()` existente, sin disparadores nuevos) → pase de navegador |
| RF-7 mapa sin datos | §3D (sin rama de "vacío": se pinta siempre), `rango.test.js` con `[]` → pase de navegador |

## 8. Ajuste a la constitución

1. Cero archivos nuevos de app; tests fuera de la raíz. 2. `AGENTS.md` antes de codificar (§1). 3. Lógica pura marcada y verificable sin DOM (§2, `extraer.js` la falla si la toca); el HTML no guarda reglas. 4. `node --test` con Node ya instalado, sin `package.json` (`estaticos.test.js` lo comprueba). 5. El mapa solo lee `localStorage` vía `loadSessions()` existente; pintado con `textContent`/`setAttribute`. 6. Interfaz y textos en español/`es-ES`; identificadores en inglés.

## 9. Pendiente antes de codificar (principio 2)

**RNF-6 es imposible tal y como está redactado.** Pide "contraste ≥3:1 entre cada estado y el fondo **y entre estados adyacentes**"; con 5 estados encadenados eso exige 3⁴ = 81:1 de recorrido, cuando el máximo (blanco/negro) es 21:1. Hay que ajustar una frase del spec antes de la primera línea de código — propuesta: 3:1 entre la cuadrícula/estados y el papel, ≥4.5:1 en textos, rampa perceptible y significado garantizado por leyenda + `aria-label` (que ya exigen CA-4.1 y CA-5.2). Todo lo demás del spec está cubierto.
