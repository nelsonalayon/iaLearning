// Diario de Estudio
// Toda la lógica en un solo archivo, sin dependencias.

const STORAGE_KEY = "diario-estudio:sesiones";

const form = document.getElementById("sessionForm");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const formError = document.getElementById("formError");
const sessionList = document.getElementById("sessionList");
const emptyState = document.getElementById("emptyState");
const heatmapContainer = document.getElementById("heatmap");
const heatmapDetail = document.getElementById("heatmapDetail");
const streakNumber = document.getElementById("streakNumber");
const bestStreakNumber = document.getElementById("bestStreakNumber");
const weekRange = document.getElementById("weekRange");
const weekMinutes = document.getElementById("weekMinutes");
const weekHours = document.getElementById("weekHours");
const monthRange = document.getElementById("monthRange");
const monthDays = document.getElementById("monthDays");

// ---------- Fechas (siempre hora local, nunca UTC) ----------
// === PURE INICIO ===

// Convierte un Date en "AAAA-MM-DD" usando la fecha local.
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convierte "AAAA-MM-DD" en un Date a medianoche local.
// Importante: no usar new Date("AAAA-MM-DD"), eso se interpreta como UTC
// y enubernetes el día puede moverse por el desfase horario.
function parseDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function todayKey() {
  return toDateKey(new Date());
}

// "lunes, 24 oct 2026": corto para caber en una fila de la lista.
function formatDate(key) {
  return parseDateKey(key).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// === PURE FIN ===

// ---------- Guardado ----------

function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

// ---------- Racha ----------
// === PURE INICIO ===

// Un día cuenta si tiene al menos una sesión.
// La racha son los días consecutivos con sesión que terminan hoy.
// Si hoy todavía no hay sesión pero ayer sí, la racha sigue viva.
function calculateStreak(sessions) {
  const daysWithSession = new Set(sessions.map((session) => session.date));

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const hasToday = daysWithSession.has(toDateKey(cursor));

  if (!hasToday) {
    // Hoy todavía puede salvarla: miro ayer.
    const yesterday = new Date(cursor);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!daysWithSession.has(toDateKey(yesterday))) {
      return 0;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;

  while (daysWithSession.has(toDateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// La mejor racha: el tramo de días consecutivos más largo que has alcanzado.
// No se guarda, se recalcula siempre: rellenar un hueco del pasado puede
// alargar un tramo y un pico guardado se quedaría viejo.
// Los días futuros no cuentan: todavía no se han vivido.
function calculateBestStreak(sessions) {
  const today = todayKey();

  const days = [...new Set(sessions.map((session) => session.date))]
    .filter((day) => day <= today)
    .sort();

  let best = 0;
  let current = 0;
  let previousDay = null;

  for (const day of days) {
    if (previousDay !== null && isNextDay(previousDay, day)) {
      current++;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
    previousDay = day;
  }

  return best;
}

// ¿Es "nextKey" el día siguiente a "prevKey"?
// Aritmética local con setDate, nunca UTC ni sumar 24 h en milisegundos:
// un día con cambio de hora no dura 24 h exactas.
function isNextDay(prevKey, nextKey) {
  const day = parseDateKey(nextKey);
  day.setDate(day.getDate() - 1);
  return toDateKey(day) === prevKey;
}

// === PURE FIN ===

// ---------- Semana ----------
// === PURE INICIO ===

// El lunes de la semana en curso (hora local).
// getDay() devuelve 0 para el domingo — no 1 —, de ahí el (+ 6) % 7.
// Acepta la fecha como parámetro (mapa de calor y tests); por defecto, hoy.
function weekStartKey(hoyKey = todayKey()) {
  const day = parseDateKey(hoyKey);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return toDateKey(day);
}

// El domingo de la semana en curso.
function weekEndKey() {
  const start = parseDateKey(weekStartKey());
  start.setDate(start.getDate() + 6);
  return toDateKey(start);
}

// Suma los minutos de las sesiones que caen en la semana actual (lunes–domingo).
// Comparación textual "AAAA-MM-DD": lexicográfico = cronológico con ceros
// a la izquierda, así que no hace falta parsear ni convertir.
function calculateWeekMinutes(sessions) {
  const start = weekStartKey();
  const today = todayKey();
  return sessions.reduce((total, session) => {
    if (session.date >= start && session.date <= today) {
      return total + (Number(session.minutes) || 0);
    }
    return total;
  }, 0);
}

// "45 min", "1 h", "5 h 20 min".
function formatMinutes(total) {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

// "lun, 19 oct – dom, 25 oct"
function formatWeekRange() {
  const start = parseDateKey(weekStartKey());
  const end = parseDateKey(weekEndKey());
  const opts = { weekday: "short", day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-ES", opts)} – ${end.toLocaleDateString("es-ES", opts)}`;
}

// === PURE FIN ===

// ---------- Mes ----------
// === PURE INICIO ===

// El día 1 del mes en curso (hora local).
// setDate(1) solo cambia el día; mes y año se quedan como están.
function monthStartKey() {
  const day = parseDateKey(todayKey());
  day.setDate(1);
  return toDateKey(day);
}

// El último día del mes en curso.
// new Date(año, mes + 1, 0) es el día 0 del mes siguiente, es decir,
// el último de este. Constructor numérico = hora local, nunca UTC.
function monthEndKey() {
  const day = parseDateKey(todayKey());
  return toDateKey(new Date(day.getFullYear(), day.getMonth() + 1, 0));
}

// Nº de días distintos con al menos una sesión en el mes en curso.
// Un día con varias sesiones cuenta UNA vez (Set): esto es un recuento de
// días, no una suma — a diferencia de la semana, que suma todos los minutos.
function calculateMonthDays(sessions) {
  const start = monthStartKey();
  const today = todayKey();
  const days = new Set();

  for (const session of sessions) {
    if (session.date >= start && session.date <= today) {
      days.add(session.date);
    }
  }

  return days.size;
}

// "1 oct – 31 oct"
function formatMonthRange() {
  const start = parseDateKey(monthStartKey());
  const end = parseDateKey(monthEndKey());
  const opts = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("es-ES", opts)} – ${end.toLocaleDateString("es-ES", opts)}`;
}

// === PURE FIN ===

// ---------- Mapa de calor: lógica pura (sin DOM) ----------
// Recibe SIEMPRE la fecha de hoy como parámetro: nada de new Date() aquí
// (los tests de Node dependerían del reloj de la máquina).
// === PURE INICIO ===

// Tamaño del mapa: 12 semanas completas + la semana en curso = 13 columnas.
const HEATMAP_WEEKS = 13;
const HEATMAP_DAYS = 7;

// "AAAA-MM-DD" solo si el formato es correcto y la fecha existe.
// El constructor de Date "corrige" fechas como 2026-02-31 → 2026-03-03,
// por eso la ida y vuelta tiene que devolver la misma clave.
function esFechaValida(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  return toDateKey(parseDateKey(key)) === key;
}

// Desplaza una clave de fecha en días con aritmética de calendario local.
// Nunca sumar 86400000 ms: en los cambios de hora un día no dura 24 h.
function addDaysKey(key, delta) {
  const day = parseDateKey(key);
  day.setDate(day.getDate() + delta);
  return toDateKey(day);
}

// Primer día mostrado: el lunes de la semana en curso menos 12 semanas.
// Ese día SÍ está dentro del rango (borde izquierdo incluido).
function heatmapStartKey(hoyKey) {
  return addDaysKey(weekStartKey(hoyKey), -((HEATMAP_WEEKS - 1) * 7));
}

// 0 = sin sesión; 1..4 según los umbrales fijos del spec (definitivos:
// cambiarlos obliga a actualizar el spec primero).
function heatmapLevel(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return 0;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 120) return 3;
  return 4;
}

// Minutos por día solo dentro del rango del mapa. Ignora una a una las
// entradas malformadas (fecha o minutos inválidos), las futuras y las
// anteriores al rango, sin descartar el resto y sin lanzar errores.
function dayTotals(sessions, hoyKey) {
  const start = heatmapStartKey(hoyKey);
  const totals = {};
  for (const session of sessions) {
    if (!session || !esFechaValida(session.date)) continue;
    if (typeof session.minutes !== "number" || !Number.isFinite(session.minutes)) continue;
    if (session.minutes < 0) continue;
    if (session.date > hoyKey) continue;
    if (session.date < start) continue;
    totals[session.date] = (totals[session.date] || 0) + session.minutes;
  }
  return totals;
}

// Mes corto en español para la etiqueta de una columna.
function formatMonthShort(key) {
  return parseDateKey(key).toLocaleDateString("es-ES", { month: "short" });
}

// 13 columnas con la etiqueta de mes de su lunes: aparece solo cuando el mes
// cambia respecto a la columna anterior; la primera siempre lleva.
function heatmapColumns(hoyKey) {
  const start = heatmapStartKey(hoyKey);
  const columns = [];
  let previousMonth = null;
  for (let index = 0; index < HEATMAP_WEEKS; index++) {
    const monday = addDaysKey(start, index * 7);
    const month = parseDateKey(monday).getMonth();
    let label = "";
    if (index === 0 || month !== previousMonth) label = formatMonthShort(monday);
    columns.push({ monday, label });
    previousMonth = month;
  }
  return columns;
}

// Estado de una celda: "futuro" si la fecha aún no llegó; si no, su nivel.
function cellState(dayKey, hoyKey, totals) {
  if (dayKey > hoyKey) return "futuro";
  return heatmapLevel(totals[dayKey] || 0);
}

// "lun, 24 oct" — mismo estilo que los rangos de las métricas.
function formatDayShort(key) {
  return parseDateKey(key).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Los dos textos de una celda: la línea de detalle y el texto accesible.
// "lun, 24 oct — 45 min" | "lun, 24 oct — sin sesión" | "lun, 24 oct — aún no ha llegado"
function heatmapTexts(dayKey, hoyKey, totals) {
  const short = formatDayShort(dayKey);
  const long = formatDate(dayKey);
  if (dayKey > hoyKey) {
    return {
      line: `${short} — aún no ha llegado`,
      accessible: `${long} — aún no ha llegado`,
    };
  }
  const minutes = totals[dayKey] || 0;
  if (minutes <= 0) {
    return { line: `${short} — sin sesión`, accessible: `${long} — sin sesión` };
  }
  return {
    line: `${short} — ${formatMinutes(minutes)}`,
    accessible: `${long} — ${formatMinutes(minutes)}`,
  };
}

// La cuadrícula completa: 13 columnas × 7 días (91 celdas), siempre.
function heatmapGrid(hoyKey, sessions) {
  const totals = dayTotals(sessions, hoyKey);
  const columns = heatmapColumns(hoyKey);
  return columns.map((column) => {
    const days = [];
    for (let day = 0; day < HEATMAP_DAYS; day++) {
      const dayKey = addDaysKey(column.monday, day);
      const texts = heatmapTexts(dayKey, hoyKey, totals);
      days.push({
        dayKey,
        state: cellState(dayKey, hoyKey, totals),
        line: texts.line,
        accessible: texts.accessible,
      });
    }
    return { monday: column.monday, label: column.label, days };
  });
}
// === PURE FIN ===

// ---------- Pintado ----------

function renderStreak(sessions) {
  streakNumber.textContent = String(calculateStreak(sessions));
  bestStreakNumber.textContent = String(calculateBestStreak(sessions));

  const total = calculateWeekMinutes(sessions);
  weekRange.textContent = formatWeekRange();
  weekMinutes.textContent = String(total);
  const hoursLine = total >= 60 ? formatMinutes(total) : "";
  weekHours.textContent = hoursLine;
  weekHours.hidden = !hoursLine;

  monthRange.textContent = formatMonthRange();
  monthDays.textContent = String(calculateMonthDays(sessions));
}

function renderSessions(sessions) {
  const sorted = [...sessions].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  sessionList.textContent = "";
  emptyState.hidden = sorted.length > 0;

  for (const session of sorted) {
    const item = document.createElement("li");
    item.className = "session";

    const info = document.createElement("div");
    info.className = "session__info";

    const topic = document.createElement("span");
    topic.className = "session__topic";
    topic.textContent = session.topic;

    const date = document.createElement("span");
    date.className = "session__date";
    date.textContent = formatDate(session.date);

    info.append(topic, date);

    const minutes = document.createElement("span");
    minutes.className = "session__minutes";
    minutes.textContent = `${session.minutes} min`;

    item.append(info, minutes);
    sessionList.append(item);
  }
}

// ---------- Mapa de calor: pintado (DOM) ----------

// Repinta las 91 celdas desde la fachada pura heatmapGrid().
// Sin rama de "vacío": si no hay sesiones se pinta el mapa en blanco (RF-7).
function renderHeatmap(sessions) {
  const hoy = todayKey();                       // única lectura de reloj (CA-6.2)
  const columns = heatmapGrid(hoy, sessions);

  heatmapContainer.textContent = "";            // repintado completo

  for (const column of columns) {
    const columnEl = document.createElement("div");
    columnEl.className = "heat__column";

    for (const day of column.days) {
      const cell = document.createElement("button");
      cell.type = "button";
      // La misma clase modificadora que usan las muestras de la leyenda.
      const modifier = day.state === "futuro" ? "future" : `level-${day.state}`;
      cell.className = `heat__cell heat__cell--${modifier}`;
      cell.setAttribute("aria-label", day.accessible);  // CA-5.2: lee sin color
      cell.dataset.linea = day.line;                    // texto ya calculado
      columnEl.append(cell);
    }

    const label = document.createElement("span");       // CA-1.5: "" si no cambia
    label.className = "heat__month";
    label.textContent = column.label;
    columnEl.append(label);

    heatmapContainer.append(columnEl);
  }

  // CA-5.1: cada render devuelve la línea al texto neutro.
  heatmapDetail.textContent = "Pulsa un día para ver sus minutos.";
}

// Delegación: 2 listeners para las 91 celdas. pointerover cubre ratón y
// toque; focusin, el teclado. Si el objetivo no es celda, no se hace nada
// y la línea conserva el último día mostrado (CA-5.1).
function showHeatDetail(event) {
  const cell = event.target.closest(".heat__cell");
  if (cell) {
    heatmapDetail.textContent = cell.dataset.linea;
  }
}

heatmapContainer.addEventListener("pointerover", showHeatDetail);
heatmapContainer.addEventListener("focusin", showHeatDetail);

function render() {
  const sessions = loadSessions();
  renderStreak(sessions);
  renderSessions(sessions);
  renderHeatmap(sessions);
}

// ---------- Formulario ----------

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function hideError() {
  formError.textContent = "";
  formError.hidden = true;
}

function validate(date, topic, minutes) {
  if (!date) {
    return "Elige una fecha.";
  }
  if (date > todayKey()) {
    return "No puedes registrar sesiones con fecha futura.";
  }
  if (!topic) {
    return "Escribe el tema de la sesión.";
  }
  if (!minutes || minutes <= 0) {
    return "Los minutos deben ser un número mayor que 0.";
  }
  return "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const topic = topicInput.value.trim();
  const minutes = Math.round(Number(minutesInput.value));

  const error = validate(date, topic, minutes);

  if (error) {
    showError(error);
    return;
  }

  const sessions = loadSessions();

  sessions.push({
    date: date,
    topic: topic,
    minutes: minutes,
    createdAt: Date.now(),
  });

  try {
    saveSessions(sessions);
  } catch (storageError) {
    showError("No se ha podido guardar la sesión en este navegador.");
    return;
  }

  hideError();
  topicInput.value = "";
  minutesInput.value = "";
  topicInput.focus();

  render();
});

form.addEventListener("input", hideError);

// ---------- Arranque ----------

// La fecha por defecto es hoy y no se puede elegir el futuro.
// El máximo se recalcula al enfocar el campo por si la pestaña
// se queda abierta y cambia el día.
function refreshMaxDate() {
  dateInput.max = todayKey();
}

dateInput.value = todayKey();
refreshMaxDate();
dateInput.addEventListener("focus", refreshMaxDate);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refreshMaxDate();
    render();
  }
});

render();
