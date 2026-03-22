---
description: "Use when creating or correcting seeded category names, service names, catalog labels, or visible taxonomy content. Keep names natural, consistent, and correctly accented in Spanish neutral LATAM."
applyTo: ["supabase/seed.sql", "src/**/*.tsx", "src/**/*.ts"]
---

# Nombres de Catalogo

- Usa nombres visibles al usuario con ortografia correcta, tildes y puntuacion adecuada.
- Para categorias y servicios en espanol, usa espanol neutro LATAM.
- Mantiene consistencia entre nombre de categoria, subcategoria y servicio relacionado.
- Evita variantes mezcladas para el mismo concepto, por ejemplo singular en un lugar y plural en otro sin razon clara.
- Evita abreviaturas, recortes raros y tecnicismos innecesarios en nombres de catalogo.

## Criterios de Nomenclatura

- Prefiere nombres cortos, claros y escaneables.
- Si el servicio representa una accion, usa una formulacion natural, por ejemplo "Aplicación de estuco" en lugar de una variante mal escrita.
- Si el servicio representa un oficio o especialidad, usa el termino mas reconocible para usuario final.
- Conserva paralelismo entre entradas similares del catalogo.

## Verificacion

- Revisa acentos frecuentes en catalogo: aplicación, instalación, reparación, plomería, jardinería, tecnología, niñera, eléctrico.
- Si corriges un nombre en `supabase/seed.sql`, valida si existe copy derivado en frontend o i18n que deba mantenerse consistente.
- No cambies IDs de catalogo salvo que el usuario lo pida expresamente.
