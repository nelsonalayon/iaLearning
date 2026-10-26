# Caso práctico: Diario de Estudio — proceso de creación con IA

Ficha del proyecto que sirve de ejemplo vivo al curso
`C:\cursos-ia\metodo-ia\` (leer primero `README.md` de ahí). Esta app es la
**demostración**; el método está en el curso, fuera de esta carpeta.

## Qué es

Web estática de registro de sesiones de estudio con racha, mejor racha, minutos de la
semana, días del mes, lista de sesiones y mapa de calor de las últimas 12 semanas.

- **Archivos de app:** `index.html`, `styles.css`, `app.js` (nada más; `.md`, `docs/`,
  `specs/` y `opencode.json` no cuentan — constitución principio 1).
- **Sin frameworks, sin build, sin `package.json`**; funciona con doble clic (`file://`).
- **Datos:** `localStorage`, clave `diario-estudio:sesiones`.

## Artefactos del proceso (fases del curso entre paréntesis)

| Artefacto | Fase del curso | Contenido |
|---|---|---|
| `docs/constitution.md` | 01 | 6 principios innegociables, cada uno verificable |
| `AGENTS.md` | 02 | Reglas duras, reglas de negocio, trampas, verificación |
| `MEMORY.md` | 02 / 10 | Estado, decisiones, errores, próximos pasos (≤50 líneas) |
| `specs/001-heat-map/spec.md` | 03 | QUÉ: RF-1…RF-7, RNF-1…RNF-8, 18 casos límite, EARS |
| `specs/001-heat-map/plan.md` | 04 | CÓMO: 9 secciones, decisiones + alternativa descartada |
| `specs/001-heat-map/tasks.md` | 05 | T1 lógica+tests · T2 interfaz · T3 verificación+cierre |
| Tests en `%LOCALAPPDATA%\Temp\opencode\heatmap-tests\` | 06 | `extraer.js` (5 bloques PURE) + 6 `*.test.js` |
| Acta de auditoría (resumida en `MEMORY.md`) | 09 | RF por RF + veredicto |

## Línea temporal

| Fecha | Hito |
|---|---|
| 21/10 17:14 | Carpeta `C:\appRachas` (fuera de OneDrive) |
| 21/10 17:23 | App v1 desde un único prompt con Rol/Contexto/Tarea/Restricciones/Salida |
| 21/10 18:02 | `AGENTS.md` |
| 21/10 – 22:53 | 3 features con patrón "plan antes que código" (mejor racha, semana, mes) |
| 24/10 | Rediseño con la skill `frontend-design` |
| 25/10 | MCP Chrome DevTools + primer test de navegador |
| 25/10 23:46 | Spec del mapa de calor (sin código, 5 preguntas, EARS) |
| 25/10 23:59 | QA del spec (solo detecta) → decisiones del usuario |
| 26/10 00:09 | Plan → tareas → tests primero → código |
| 26/10 00:36 | Auditoría RF por RF |
| 26/10 | Este curso |

## Métricas de cierre

- **Tests: 33/33 en verde** (`node --test`, Node 24; extractor con 5 bloques PURE).
- **Auditoría: 7/7 criterios de finalización** → veredicto *spec cumplida*.
- Defecto hallado en la auditoría (CA-4.2, borde de las muestras de leyenda) corregido y
  con aserción de regresión.
- Mapa: 13 columnas × 7 filas = 91 celdas, 5 estados, leyenda de 6.
- Pase de navegador: consola limpia, 375 px sin scroll horizontal, render ≤50 ms.

## Cómo se verifica (comandos)

```powershell
$T = "$env:LOCALAPPDATA\Temp\opencode\heatmap-tests"
node "$T\extraer.js"
Set-Location $T
node --test        # en Node 24: `node --test <dir>` NO funciona
```

Navegador: abrir `C:\appRachas\index.html`, probar el flujo de alta, revisar consola,
emular `375x812x2,mobile,touch` y **borrar la emulación** al terminar.

## Deudas pendientes (decisión del usuario)

1. **Sin git** → sin rollback ni `git diff` de los cambios de la IA.
2. **Tests sin versionar** → viven en Temp por la regla "sin `package.json`"; si se limpia
   el temp, se pierden (y no están documentados en este repo).
3. **Auditoría en la misma sesión** que el código → idealmente, sesión nueva.

## Aviso sobre los tests y los datos

- Los tests **no forman parte de la app**: no se pueden ejecutar dentro de esta carpeta
  sin salir a Temp (constitución principios 1 y 4).
- `localStorage` de `file://` es compartido entre rutas y **no hay botón de borrar**: al
  probar, guarda siempre el snapshot y restáuralo.
