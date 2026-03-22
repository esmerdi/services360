---
description: "Use when adding, editing, or reviewing translation keys, I18nContext content, localized UI copy, or ES/EN text parity. Ensure both languages stay aligned, complete, and natural."
applyTo: ["src/context/I18nContext.tsx", "src/**/*.tsx", "src/**/*.ts"]
---

# Paridad i18n

- Cuando agregues una clave nueva en traducciones, crea su equivalente en ingles y espanol en la misma intervencion.
- No dejes claves presentes en un idioma y ausentes en el otro.
- Mantiene la misma estructura jerarquica entre `en` y `es`.
- Si renombras una clave, actualiza ambos idiomas y sus usos relacionados.
- Revisa que el texto en ingles y espanol conserve la misma intencion, no solo una traduccion literal.

## Estilo

- En espanol, usa espanol neutro LATAM.
- En ingles, usa copy claro y natural para producto digital.
- En ambos idiomas, prioriza textos cortos para UI cuando sea posible.
- Evita etiquetas ambiguas o demasiado tecnicas si el usuario final no las necesita.

## Verificacion

- Antes de cerrar un cambio, revisa que labels, placeholders, mensajes de error, estados vacios y CTAs tengan paridad ES/EN.
- Si un texto depende de contexto, por ejemplo cliente, proveedor, admin o chat, valida que ambos idiomas respeten ese contexto.
- Si no puedes completar la paridad porque falta alcance funcional, deja constancia explicita de la clave pendiente.
