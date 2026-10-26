---
name: local-dates
description: Úsala siempre que trabajes con fechas, días, semanas o rachas.
disable-model-invocation: true
---

# Fechas locales

## Reglas

- Las fechas se guardan como texto `AAAA-MM-DD`.
- Siempre usa la zona horaria local del usuario.
- Para obtener el día actual usa `getFullYear()`, `getMonth() + 1` y `getDate()`.
- Para convertir `AAAA-MM-DD` en fecha usa `new Date(año, mes - 1, día)`.
- Nunca uses `new Date("AAAA-MM-DD")`.
- Nunca uses `toISOString()` para obtener el día actual.
- Para sumar o restar días usa `setDate(getDate() ± n)`.
- Nunca calcules días mediante milisegundos (`86400000`).
- Reutiliza las utilidades de fechas existentes antes de crear nuevas.

## Checklist

- [ ] ¿Hay algún `toISOString()`?
- [ ] ¿Hay algún `new Date("AAAA-MM-DD")`?
- [ ] ¿Hay cálculos con `86400000`?
- [ ] ¿Se usan fechas locales en lugar de UTC?
- [ ] ¿Se probaron cambios de mes y año?
- [ ] ¿Se comprobó el comportamiento cerca de medianoche?

## Regla de oro

```text
Persistencia: YYYY-MM-DD
Lógica: fecha local
UTC: solo para integraciones externas
```
