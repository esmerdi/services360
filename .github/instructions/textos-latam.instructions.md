---
description: "Use when writing or correcting user-facing text, microcopy, labels, placeholders, translations, i18n content, seeded category/service names, validation messages, or UI copy. Prefer Spanish neutral LATAM and keep wording clear, concise, and consistent."
applyTo: ["src/**", "supabase/seed.sql"]
---

# Textos LATAM

- Para textos visibles al usuario en espanol, usa espanol neutro LATAM por defecto.
- Corrige siempre tildes, signos de apertura, puntuacion y terminos inconsistentes.
- Prefiere copy claro, corto y natural para UI: botones, labels, placeholders, estados vacios, validaciones y mensajes de error.
- Mantiene consistencia entre modulos equivalentes: cliente, proveedor, admin, chat, calificaciones, solicitudes y servicios.
- No mezcles variantes regionales sin motivo. Evita localismos demasiado marcados si el producto es general para LATAM.
- Si el texto esta en claves i18n, conserva el significado entre idiomas y evita traducir literalmente cuando suene antinatural.
- Si corriges nombres de categorias o servicios visibles al usuario, respeta el contexto del catalogo y evita reformular mas de lo necesario.

## Preferencias

- Usa "ubicacion" como concepto base solo si el archivo ya esta sin tildes por una limitacion tecnica; en contenido normal escribe "ubicación".
- Prefiere frases directas como "Solicitar servicio", "Calificar proveedor", "Sin calificaciones" y "No disponible" cuando apliquen.
- Evita abreviaturas poco naturales en UI, por ejemplo "prom." si "promedio" o una etiqueta mas clara comunica mejor.
