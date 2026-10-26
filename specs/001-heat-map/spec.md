# Especificación: Mapa de calor de las últimas 12 semanas

Estado: revisado por QA y corregido, sin dudas abiertas (pendiente de aprobación final). 5 preguntas + 4 aclaraciones + 25 hallazgos de QA resueltos el 25/10/2026 (ver "Revisión QA" al final).

## Contexto y objetivo

Hoy el Diario de Estudio muestra cuatro cifras sueltas (racha actual, mejor racha, minutos de la semana y días del mes) y una lista cronológica. Las cifras resumen el presente; la lista obliga a leer día por día para entender el patrón de estudio.

El mapa de calor añade la visión de **tendencia**: dónde has estudiado mucho, dónde poco y dónde nada, en un vistazo. Objetivo: que la persona reconozca su constancia de las últimas semanas sin leer nada, y que al indagar pueda consultar los minutos exactos de cualquier día.

Por qué 12 semanas: es un horizonte fijo que cabe en pantalla, no crece con el uso de la app y basta para ver un trimestre de hábitos. La semana en curso se muestra además, aunque esté incompleta: son **13 columnas siempre**.

## Usuarios

- **Persona que estudia** (usuario principal): registra sesiones y quiere ver su constancia.
- **Persona con lector de pantalla o visión reducida**: necesita acceder al mismo contenido por texto y con contraste suficiente.
- **Mantenedor** (quien programa la app, a menudo principiante): necesita que la lógica nueva sea separada y comprobable para no romper lo existente.

## Historias de usuario

- **HU-1**: Como persona que estudio, quiero ver mis últimas 12 semanas en un mapa, para reconocer mi constancia de un vistazo.
- **HU-2**: Como persona que estudio, quiero que los días con más minutos se vean más intensos de color, para identificar mis mejores días sin leer números.
- **HU-3**: Como persona que estudio, quiero consultar los minutos exactos de un día concreto, para contrastar el mapa con mis sesiones.
- **HU-4**: Como persona que estudio, quiero distinguir los días que aún no llegaron de los días en los que no estudié, para no confundir el futuro con un fracaso.
- **HU-5**: Como mantenedor principiante, quiero que la lógica del mapa viva separada de la interfaz, para poder cambiarla sin miedo.

## Requisitos funcionales

Criterios de aceptación en notación EARS. Patrones usados: **Evento** (cuando…), **Ubicación** (mientras…), **Deseo** (el sistema debe…), **Condición adversa** (si… entonces…).

### RF-1. Rango y estructura del mapa

- **CA-1.1 (Evento)**: Cuando la aplicación carga, cuando se registra una sesión o cuando la pestaña recupera el foco —y solo en esos tres momentos, la lista cerrada de RF-6—, el sistema debe mostrar el mapa, que siempre tiene 13 columnas: las últimas 12 semanas completas más la semana en curso.
- **CA-1.2 (Deseo)**: El sistema debe organizar el mapa en columnas cronológicas de semana (de la más antigua a la más reciente) y 7 filas de lunes a domingo, igual que la semana de la métrica existente.
- **CA-1.3 (Deseo)**: El sistema debe situar la semana en curso siempre en la última columna, aunque esté incompleta.
- **CA-1.4 (Condición adversa)**: Si una sesión es anterior al primer día mostrado, entonces el mapa no debe pintarla, sin que eso afecte a la racha, a las métricas ni a la lista de sesiones. El primer día mostrado (el lunes de la semana 12) **sí está incluido** en el rango.
- **CA-1.5 (Deseo)**: El sistema debe mostrar bajo las columnas una etiqueta de mes en español con el mes abreviado (p. ej. "oct.") en la primera columna y en cada columna cuyo **lunes** caiga en un mes distinto al de la columna anterior.
  - *Nota (25/10/2026)*: la abreviatura es la que devuelve el navegador en `es-ES` con `month: "short"` ("jul", "ago", "sept", "oct"), exactamente la misma que producen ya los rangos de las métricas; el "oct." del enunciado era el ejemplo.

### RF-2. Intensidad de cada día

Los umbrales son definitivos para esta versión: cambiarlos obliga a actualizar esta especificación antes (principio 2 de la constitución).

- **CA-2.1 (Deseo)**: El sistema debe calcular para cada día la suma de los minutos de todas las sesiones de ese día.
- **CA-2.2 (Deseo)**: El sistema debe clasificar cada día en uno de estos cinco estados: sin sesión, 1–30 min, 31–60 min, 61–120 min y 121 o más min.
- **CA-2.3 (Deseo)**: El sistema debe representar los cinco estados con colores de intensidad creciente, de modo que un día con más minutos se distinga visualmente de uno con menos.
- **CA-2.4 (Condición adversa)**: Si un día tiene varias sesiones, entonces el sistema debe sumar sus minutos; un día con varias sesiones debe pintarse como un solo día, nunca como varias celdas.
- **CA-2.5 (Condición adversa)**: Si entre los datos guardados hay una sesión con fecha posterior a hoy, entonces el mapa no debe pintarla (las métricas existentes también la ignoran); ese día se representa como futuro vacío según RF-3.
- **CA-2.6 (Condición adversa)**: Si una entrada guardada no tiene fecha con formato "AAAA-MM-DD" válida o sus minutos no son un número mayor o igual que 0, entonces el sistema debe ignorar esa entrada sin descartar el resto de sesiones y sin mostrar ningún error.

### RF-3. Días que aún no han llegado

- **CA-3.1 (Condición adversa)**: Si la fecha de una celda es posterior a hoy, entonces el sistema debe pintarla con un aspecto distinto al de un día pasado sin sesión; la diferencia debe poder percibirse **sin apoyarse solo en el color** y debe reflejarse en el texto accesible de la celda (CA-5.2).
- **CA-3.2 (Deseo)**: El sistema debe mantener la cuadrícula completa de la semana en curso, de modo que se vean también los días futuros con su aspecto diferenciado.
- **CA-3.3 (Deseo)**: El sistema debe tratar la celda de hoy como un día normal, sin realce propio, para conservar el "un solo momento llamativo" del diseño (el marcatextos de la racha actual).

### RF-4. Leyenda

- **CA-4.1 (Deseo)**: El sistema debe mostrar de forma permanente una leyenda **estática** en español con seis entradas: los cinco estados de CA-2.2 —con la entrada "Sin sesión" sin rango de minutos— y el estado de día futuro, etiquetado "Aún no ha llegado".
- **CA-4.2 (Deseo)**: La leyenda debe usar exactamente los mismos colores que el mapa.

### RF-5. Detalle de un día

- **CA-5.1 (Evento)**: Cuando el usuario pase el puntero, toque o enfoque una celda, el sistema debe mostrar en la línea fija bajo el mapa —sin ventana flotante— la fecha de ese día y su detalle, con estos formatos exactos: `"lun, 24 oct — 45 min"`, `"lun, 24 oct — sin sesión"` y `"lun, 24 oct — aún no ha llegado"` (para celdas futuras). La línea está siempre visible: antes de la primera interacción muestra `"Pulsa un día para ver sus minutos."`; al terminar la interacción conserva el último día mostrado; y en cada render (RF-6) vuelve al texto neutro.
- **CA-5.2 (Deseo)**: El sistema debe dar a cada celda —también a las vacías y a las futuras— un texto accesible con su fecha y su estado, de modo que el contenido se entienda sin color. El mecanismo concreto (contenido o atributo) se decide en el plan de implementación.
- **CA-5.3 (Condición adversa)**: Si un día no tiene sesión, entonces la línea debe indicarlo con el texto "sin sesión", nunca con un número.

### RF-6. Actualización del mapa

- **CA-6.1 (Evento)**: Cuando se registra una sesión nueva, el sistema debe actualizar el mapa en el momento, sin recargar la página. La leyenda no cambia nunca: es estática (CA-4.1).
- **CA-6.2 (Ubicación)**: Mientras la pestaña vuelve a estar visible, el sistema debe recalcular el mapa y su rango de 13 columnas por si ha cambiado el día o la semana. El rango solo se recorta en estos tres momentos (CA-1.1): entre medias, el mapa no cambia por sí solo.

### RF-7. Mapa sin datos

- **CA-7.1 (Condición adversa)**: Si no hay ninguna sesión o los datos no se pueden leer, entonces el sistema debe mostrar el mapa vacío con su leyenda y sin mensajes de error.
- **CA-7.2 (Deseo)**: El sistema debe mostrar el mapa aunque esté vacío, igual que hoy las métricas muestran 0 en lugar de ocultarse.

## Requisitos no funcionales

- **RNF-1 (separación lógica/interfaz)**: El cálculo de rango de fechas y niveles de intensidad debe funcionar como lógica pura: recibe datos de sesiones y una fecha, devuelve qué pintar, sin consultar el DOM ni el almacenamiento. Así puede probarse con Node sin dependencias (principio 3 de la constitución).
- **RNF-2 (datos intocables)**: El mapa solo lee los datos de sesiones existentes; no escribe, no borra ni transforma nada en el almacenamiento (principio 5).
- **RNF-3 (idioma)**: Toda la interfaz del mapa (leyenda, rangos, fechas, etiquetas de mes, textos de la línea de detalle y mensajes) en español con fechas `es-ES`; identificadores en inglés (principio 6).
- **RNF-4 (stack)**: Sin dependencias, sin build y sin cambios que rompan la apertura con doble clic (principio 1).
- **RNF-5 (fechas)**: Misma disciplina de fecha local que el resto: semana de lunes a domingo, hora local, nunca UTC ni sumas de 24 h en milisegundos.
- **RNF-6 (accesibilidad, medible)**: contraste mínimo de 3:1 entre la cuadrícula y el papel y ≥4.5:1 en los textos; rampa de color perceptible entre los cinco estados; todas las celdas alcanzables con el tabulador, en orden cronológico; usable también con el dedo; nada identificable solo por color (el significado lo llevan la leyenda y el `aria-label` de cada celda). *Redactado el 25/10/2026: la versión anterior exigía 3:1 "entre estados adyacentes", lo que con 5 estados encadenados pediría 3⁴ = 81:1 de recorrido (máximo teórico: 21:1) — imposible; ver plan.md §9.*
- **RNF-7 (responsivo, medible)**: el mapa completo (13 columnas, etiquetas de mes, leyenda y línea de detalle) cabe a 375 px de ancho sin desplazamiento horizontal, con celdas de al menos 16 px por lado.
- **RNF-8 (rendimiento, medible)**: el cálculo y el pintado de las 91 celdas (13 × 7) deben tardar 50 ms o menos en cada render.

## Casos límite

1. **Sin sesiones**: mapa completo vacío + leyenda visible (RF-7).
2. **Datos ilegibles en el almacenamiento** (JSON roto): se comporta como "sin sesiones"; no muestra errores ni impide el resto de la app.
3. **JSON válido con entradas malformadas** (fecha que no sea "AAAA-MM-DD", minutos en texto, negativos o no numéricos): esas entradas se ignoran una a una y el resto de sesiones se pinta con normalidad (CA-2.6).
4. **Día futuro en la semana en curso**: aspecto propio, distinto de "pasado sin sesión", distinguible también sin color (RF-3).
5. **Sesión guardada con fecha futura**: no se pinta (CA-2.5); su día se muestra como futuro vacío. Igual que las métricas existentes, que la ignoran.
6. **Sesión anterior a las 12 semanas**: no aparece en el mapa; sigue contando en racha, mejor racha, totales y lista (CA-1.4).
7. **Todas las sesiones son anteriores al rango**: mapa vacío con leyenda, aunque las cifras muestren actividad. El mapa vacío no implica "sin datos".
8. **Historial más corto que 12 semanas**: las columnas de la izquierda quedan vacías; el mapa sigue teniendo 13 columnas.
9. **Sesión en el primer día del rango** (lunes de la semana 12): se pinta; el borde izquierdo está incluido (CA-1.4).
10. **Día con varias sesiones**: se suman sus minutos en una sola celda (CA-2.4).
11. **Bordes exactos de los umbrales**: 30 → nivel 1, 31 → nivel 2; 60 → nivel 2, 61 → nivel 3; 120 → nivel 3, 121 → nivel 4. Sin huecos ni solapes.
12. **Minutos muy altos** (p. ej. 480 en un día): nivel máximo, sin techo ni error.
13. **Rango que cruza mes o año**: se pinta como cualquier otra semana; la etiqueta de mes de cada columna la decide su lunes (CA-1.5), así que en una semana del 31 ago al 6 sep aparece "ago.", porque su lunes (31 de agosto) es de agosto.
14. **Semana en curso incompleta** (lunes a hoy): las celdas restantes de la columna son futuras, no vacías.
15. **Hoy sin sesión**: es un día pasado sin sesión (celda vacía normal), no un día futuro, y sin realce propio (CA-3.3).
16. **Cambio de día o de semana con la pestaña abierta**: el mapa y su rango solo se recalculan al recuperar el foco (CA-6.2); entre medias no cambian. Cada render devuelve la línea de detalle al texto neutro, para no mostrar datos caducados.
17. **Cambio de huso horario con la app abierta**: fuera de alcance; misma limitación documentada para la lista de sesiones. Al recuperar el foco se recalcula con la hora local vigente.
18. **Interacción con una celda que deja de existir** (la columna más antigua sale del rango en un recálculo): la línea vuelve al texto neutro (CA-5.1).

## Fuera de alcance (esta versión)

- Borrar o editar sesiones (pendiente de aprobación general, no de esta funcionalidad).
- Escala relativa (percentiles) o degradado continuo: solo los cinco estados fijos.
- Umbral configurable por la persona usuaria o persistencia de preferencias.
- Datos anteriores a las 12 semanas dentro del mapa.
- Filtros por tema, colores por tema, búsqueda o estadísticas agregadas por columna.
- Ventanas flotantes (tooltips) de cualquier tipo: el detalle vive en la línea fija (CA-5.1).
- Realce especial de hoy, objetivos diarios, recordatorios, notificaciones, exportar imagen o compartir.
- Modo oscuro, animaciones o efectos adicionales.
- Garantías sobre cambios de huso horario o de reloj fuera de los disparadores de RF-6 (misma limitación que la lista de sesiones).

## Criterios de finalización

- Todos los RF con sus CA comprobados uno a uno en el navegador (app abierta, flujo real de registro de sesiones).
- Pruebas de la lógica con Node (script temporal en `%LOCALAPPDATA%\Temp\opencode`, sin `package.json` ni `npm install`) cubriendo al menos: los bordes 30/31, 60/61 y 120/121; suma de varias sesiones; sesión anterior al rango y sesión en el primer día del rango (incluido); sesión guardada con fecha futura (ignorada); entrada malformada (ignorada sin descartar el resto); semana que cruza mes/año y etiqueta de mes por el lunes; día futuro; texto inicial de la línea de detalle; invariante *celdas pintadas = 91 (13 × 7)* y *la leyenda tiene 6 entradas que coinciden con los estados usados*.
- Consola del navegador sin errores y sin avisos tras el flujo completo.
- Comprobación a 375 px: sin desplazamiento horizontal y mapa legible.
- `AGENTS.md` actualizado con la regla de negocio nueva **antes de escribir la primera línea de código** de la funcionalidad (principio 2: el spec primero, siempre).
- Constitución verificada: solo tres archivos de app en la raíz (más documentación y configuración de herramientas, según el principio 1 ajustado), cero dependencias y el mapa solo lee datos.
- `MEMORY.md` actualizado con el estado y las decisiones tomadas.

## Dudas abiertas

Ninguna. Las 4 dudas iniciales se resolvieron el 25/10/2026 y los 25 hallazgos de la revisión QA, en el apartado siguiente.

## Revisión QA — decisiones (25/10/2026)

1. **Columnas**: siempre 13; se elimina el "como máximo" de CA-1.1.
2. **Mes de una columna que cruza meses**: lo decide el lunes de la semana.
3. **Primera columna y formato de etiqueta**: siempre lleva etiqueta; mes abreviado en español ("oct.").
4. **Fin de la interacción**: la línea conserva el último día mostrado.
5. **Texto neutro**: `"Pulsa un día para ver sus minutos."` (decidido en el spec).
6. **Detalle de celda futura**: `"lun, 24 oct — aún no ha llegado"`.
7. **Futuro vs vacío sin color**: exigido en CA-3.1 + texto accesible.
8. y 15. **Leyenda**: 6 entradas — los cinco estados ("Sin sesión" sin rango) y el futuro ("Aún no ha llegado").
9. **Texto accesible**: obligatorio en vacías y futuras; el mecanismo va para el plan.
10. **NFR medibles**: contraste ≥ 3:1, celdas ≥ 16 px, render ≤ 50 ms.
11. **Teclado**: todas las celdas son paradas de tabulación, en orden cronológico.
12. **Disparadores**: RF-6 es la lista cerrada; CA-1.1 ya no habla de "renderizar".
13. **Celdas**: 91 (13 × 7) en RNF-8 y en el invariante de finalización.
14. **Leyenda estática**: CA-6.1 solo actualiza el mapa.
16. **Tests**: se mantienen las pruebas Node (constitución 4) y se reescribe la frase "No hay tests automáticos" de `AGENTS.md`.
17. **Sesión futura guardada**: no se pinta (CA-2.5), igual que la ignoran las métricas.
18. **Entradas malformadas**: se ignoran una a una, sin errores (CA-2.6).
19. **Historial corto**: columnas izquierdas vacías; siguen siendo 13.
20. **Borde izquierdo**: incluido (CA-1.4).
21. **Recorte de rango**: solo en los tres disparadores (CA-6.2).
22. **Detalle caducado**: cada render devuelve la línea al texto neutro (CA-5.1).
23. **Husos horarios**: fuera de alcance, como la lista (caso límite 17).
24. **Orden del spec**: `AGENTS.md` antes de la primera línea de código (criterio de finalización).
25. **Constitución principio 1**: se ajusta su verificación para eximir documentación y configuración de herramientas.
