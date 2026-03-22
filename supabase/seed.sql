-- =============================================
-- Services 360 - Seed Data
-- Run AFTER all migrations
-- =============================================

-- =============================================
-- PLANS
-- =============================================
INSERT INTO public.plans (name, price, features) VALUES
  ('FREE', 0.00, '{
    "max_requests_per_month": 10,
    "visibility": "standard",
    "support": "community",
    "analytics": false,
    "featured_listing": false
  }'),
  ('PRO', 29.99, '{
    "max_requests_per_month": -1,
    "visibility": "priority",
    "support": "24/7 priority",
    "analytics": true,
    "featured_listing": true,
    "badge": "PRO"
  }')
ON CONFLICT DO NOTHING;

-- =============================================
-- ROOT CATEGORIES
-- =============================================
INSERT INTO public.categories (id, name, icon, description) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'Servicios del hogar',               'home',        'Limpieza, lavandería y tareas del hogar'),
  ('c2000000-0000-0000-0000-000000000002', 'Cuidado personal y familiar',       'users',       'Niñeras, adulto mayor y salud en casa'),
  ('c2000000-0000-0000-0000-000000000003', 'Mantenimiento del hogar',           'wrench',      'Electricidad, plomería, aire y gas'),
  ('c2000000-0000-0000-0000-000000000004', 'Construcción y remodelación',       'hammer',      'Obras, acabados e instalaciones'),
  ('c2000000-0000-0000-0000-000000000005', 'Jardinería y exteriores',           'trees',       'Césped, poda, fumigación y diseño de jardines'),
  ('c2000000-0000-0000-0000-000000000006', 'Mudanzas y logística',              'truck',       'Trasteos, carga y transporte de muebles'),
  ('c2000000-0000-0000-0000-000000000007', 'Servicios técnicos especializados', 'settings',    'Electrodomésticos y tecnología'),
  ('c2000000-0000-0000-0000-000000000008', 'Servicios para mascotas',           'paw-print',   'Paseo, guardería y peluquería para mascotas'),
  ('c2000000-0000-0000-0000-000000000009', 'Servicios domésticos personalizados','chef-hat',   'Cocina y preparación de comidas en casa'),
  ('c2000000-0000-0000-0000-000000000010', 'Otros servicios útiles',            'sparkles',    'Servicios diferenciadores para el hogar')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;

-- =============================================
-- SUB-CATEGORIES
-- =============================================
INSERT INTO public.categories (id, name, parent_id, icon) VALUES
  ('c2100000-0000-0000-0000-000000000001', 'Limpieza y aseo',          'c2000000-0000-0000-0000-000000000001', 'sparkles'),
  ('c2100000-0000-0000-0000-000000000002', 'Lavandería y planchado',   'c2000000-0000-0000-0000-000000000001', 'shirt'),
  ('c2100000-0000-0000-0000-000000000003', 'Niñeras',                  'c2000000-0000-0000-0000-000000000002', 'baby'),
  ('c2100000-0000-0000-0000-000000000004', 'Cuidado adulto mayor',     'c2000000-0000-0000-0000-000000000002', 'heart-handshake'),
  ('c2100000-0000-0000-0000-000000000005', 'Salud en casa',            'c2000000-0000-0000-0000-000000000002', 'stethoscope'),
  ('c2100000-0000-0000-0000-000000000006', 'Electricidad',             'c2000000-0000-0000-0000-000000000003', 'zap'),
  ('c2100000-0000-0000-0000-000000000007', 'Plomería',                 'c2000000-0000-0000-0000-000000000003', 'wrench'),
  ('c2100000-0000-0000-0000-000000000008', 'Aire acondicionado',       'c2000000-0000-0000-0000-000000000003', 'fan'),
  ('c2100000-0000-0000-0000-000000000009', 'Gas',                      'c2000000-0000-0000-0000-000000000003', 'flame'),
  ('c2100000-0000-0000-0000-000000000010', 'Obras',                    'c2000000-0000-0000-0000-000000000004', 'brick-wall'),
  ('c2100000-0000-0000-0000-000000000011', 'Acabados',                 'c2000000-0000-0000-0000-000000000004', 'paintbrush'),
  ('c2100000-0000-0000-0000-000000000012', 'Instalaciones',            'c2000000-0000-0000-0000-000000000004', 'ruler'),
  ('c2100000-0000-0000-0000-000000000013', 'Servicios de jardinería',  'c2000000-0000-0000-0000-000000000005', 'leaf'),
  ('c2100000-0000-0000-0000-000000000014', 'Servicios de mudanza',     'c2000000-0000-0000-0000-000000000006', 'truck'),
  ('c2100000-0000-0000-0000-000000000015', 'Electrodomésticos',        'c2000000-0000-0000-0000-000000000007', 'tv'),
  ('c2100000-0000-0000-0000-000000000016', 'Tecnología',               'c2000000-0000-0000-0000-000000000007', 'laptop'),
  ('c2100000-0000-0000-0000-000000000017', 'Cuidado de mascotas',      'c2000000-0000-0000-0000-000000000008', 'paw-print'),
  ('c2100000-0000-0000-0000-000000000018', 'Servicios de cocina',      'c2000000-0000-0000-0000-000000000009', 'chef-hat'),
  ('c2100000-0000-0000-0000-000000000019', 'Servicios del hogar útiles','c2000000-0000-0000-0000-000000000010', 'sparkles')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    icon = EXCLUDED.icon;

-- =============================================
-- SUB-SUB-CATEGORIES (3rd level)
-- =============================================
INSERT INTO public.categories (id, name, parent_id, icon) VALUES
  ('c2200000-0000-0000-0000-000000000001', 'Aseo general',               'c2100000-0000-0000-0000-000000000001', 'sparkles'),
  ('c2200000-0000-0000-0000-000000000002', 'Aseo profundo',              'c2100000-0000-0000-0000-000000000001', 'sparkles'),
  ('c2200000-0000-0000-0000-000000000003', 'Desinfección',               'c2100000-0000-0000-0000-000000000001', 'shield-check'),
  ('c2200000-0000-0000-0000-000000000004', 'Limpieza post obra',         'c2100000-0000-0000-0000-000000000001', 'hard-hat'),
  ('c2200000-0000-0000-0000-000000000005', 'Limpieza por horas',         'c2100000-0000-0000-0000-000000000001', 'clock'),
  ('c2200000-0000-0000-0000-000000000006', 'Lavado de ropa',             'c2100000-0000-0000-0000-000000000002', 'shirt'),
  ('c2200000-0000-0000-0000-000000000007', 'Planchado',                  'c2100000-0000-0000-0000-000000000002', 'shirt'),
  ('c2200000-0000-0000-0000-000000000008', 'Lavado en seco',             'c2100000-0000-0000-0000-000000000002', 'droplets'),
  ('c2200000-0000-0000-0000-000000000009', 'Organización de clóset',     'c2100000-0000-0000-0000-000000000002', 'archive'),
  ('c2200000-0000-0000-0000-000000000010', 'Cuidado por horas',          'c2100000-0000-0000-0000-000000000003', 'clock'),
  ('c2200000-0000-0000-0000-000000000011', 'Cuidado de tiempo completo', 'c2100000-0000-0000-0000-000000000003', 'calendar-days'),
  ('c2200000-0000-0000-0000-000000000012', 'Apoyo escolar',              'c2100000-0000-0000-0000-000000000003', 'book-open'),
  ('c2200000-0000-0000-0000-000000000013', 'Acompañamiento',             'c2100000-0000-0000-0000-000000000004', 'hand-heart'),
  ('c2200000-0000-0000-0000-000000000014', 'Enfermería básica',          'c2100000-0000-0000-0000-000000000004', 'stethoscope'),
  ('c2200000-0000-0000-0000-000000000015', 'Cuidados nocturnos',         'c2100000-0000-0000-0000-000000000004', 'moon-star'),
  ('c2200000-0000-0000-0000-000000000016', 'Enfermería',                 'c2100000-0000-0000-0000-000000000005', 'heart-pulse'),
  ('c2200000-0000-0000-0000-000000000017', 'Terapias físicas y respiratorias','c2100000-0000-0000-0000-000000000005', 'activity'),
  ('c2200000-0000-0000-0000-000000000018', 'Instalaciones eléctricas',   'c2100000-0000-0000-0000-000000000006', 'zap'),
  ('c2200000-0000-0000-0000-000000000019', 'Reparaciones eléctricas',    'c2100000-0000-0000-0000-000000000006', 'wrench'),
  ('c2200000-0000-0000-0000-000000000020', 'Cortocircuitos',             'c2100000-0000-0000-0000-000000000006', 'alert-triangle'),
  ('c2200000-0000-0000-0000-000000000021', 'Fugas',                      'c2100000-0000-0000-0000-000000000007', 'droplet'),
  ('c2200000-0000-0000-0000-000000000022', 'Instalación de grifería',    'c2100000-0000-0000-0000-000000000007', 'wrench'),
  ('c2200000-0000-0000-0000-000000000023', 'Destapes',                   'c2100000-0000-0000-0000-000000000007', 'pipe'),
  ('c2200000-0000-0000-0000-000000000024', 'Instalación',                'c2100000-0000-0000-0000-000000000008', 'fan'),
  ('c2200000-0000-0000-0000-000000000025', 'Mantenimiento',              'c2100000-0000-0000-0000-000000000008', 'settings'),
  ('c2200000-0000-0000-0000-000000000026', 'Reparación',                 'c2100000-0000-0000-0000-000000000008', 'wrench'),
  ('c2200000-0000-0000-0000-000000000027', 'Instalación',                'c2100000-0000-0000-0000-000000000009', 'flame'),
  ('c2200000-0000-0000-0000-000000000028', 'Revisión',                   'c2100000-0000-0000-0000-000000000009', 'search-check'),
  ('c2200000-0000-0000-0000-000000000029', 'Albañilería',                'c2100000-0000-0000-0000-000000000010', 'hammer'),
  ('c2200000-0000-0000-0000-000000000030', 'Remodelación',               'c2100000-0000-0000-0000-000000000010', 'construction'),
  ('c2200000-0000-0000-0000-000000000031', 'Ampliaciones',               'c2100000-0000-0000-0000-000000000010', 'ruler'),
  ('c2200000-0000-0000-0000-000000000032', 'Pintura',                    'c2100000-0000-0000-0000-000000000011', 'paintbrush'),
  ('c2200000-0000-0000-0000-000000000033', 'Estuco',                     'c2100000-0000-0000-0000-000000000011', 'paint-roller'),
  ('c2200000-0000-0000-0000-000000000034', 'Drywall',                    'c2100000-0000-0000-0000-000000000011', 'panel-left'),
  ('c2200000-0000-0000-0000-000000000035', 'Ventanas',                   'c2100000-0000-0000-0000-000000000012', 'panel-top-open'),
  ('c2200000-0000-0000-0000-000000000036', 'Puertas',                    'c2100000-0000-0000-0000-000000000012', 'door-open'),
  ('c2200000-0000-0000-0000-000000000037', 'Pisos de cerámica y porcelanato', 'c2100000-0000-0000-0000-000000000012', 'grid-3x3'),
  ('c2200000-0000-0000-0000-000000000038', 'Corte de césped',            'c2100000-0000-0000-0000-000000000013', 'scissors'),
  ('c2200000-0000-0000-0000-000000000039', 'Diseño de jardines',         'c2100000-0000-0000-0000-000000000013', 'leaf'),
  ('c2200000-0000-0000-0000-000000000040', 'Poda de árboles',            'c2100000-0000-0000-0000-000000000013', 'trees'),
  ('c2200000-0000-0000-0000-000000000041', 'Fumigación',                 'c2100000-0000-0000-0000-000000000013', 'bug'),
  ('c2200000-0000-0000-0000-000000000042', 'Trasteos',                   'c2100000-0000-0000-0000-000000000014', 'truck'),
  ('c2200000-0000-0000-0000-000000000043', 'Carga y descarga',           'c2100000-0000-0000-0000-000000000014', 'package-plus'),
  ('c2200000-0000-0000-0000-000000000044', 'Transporte de muebles',      'c2100000-0000-0000-0000-000000000014', 'sofa'),
  ('c2200000-0000-0000-0000-000000000045', 'Reparación de nevera',       'c2100000-0000-0000-0000-000000000015', 'refrigerator'),
  ('c2200000-0000-0000-0000-000000000046', 'Reparación de lavadora',     'c2100000-0000-0000-0000-000000000015', 'washer'),
  ('c2200000-0000-0000-0000-000000000047', 'Reparación de televisores',  'c2100000-0000-0000-0000-000000000015', 'tv'),
  ('c2200000-0000-0000-0000-000000000048', 'Soporte técnico para PC',    'c2100000-0000-0000-0000-000000000016', 'laptop'),
  ('c2200000-0000-0000-0000-000000000049', 'Instalación de redes',       'c2100000-0000-0000-0000-000000000016', 'router'),
  ('c2200000-0000-0000-0000-000000000050', 'Cámaras de seguridad',       'c2100000-0000-0000-0000-000000000016', 'camera'),
  ('c2200000-0000-0000-0000-000000000051', 'Paseo de perros',            'c2100000-0000-0000-0000-000000000017', 'dog'),
  ('c2200000-0000-0000-0000-000000000052', 'Guardería de mascotas',      'c2100000-0000-0000-0000-000000000017', 'home'),
  ('c2200000-0000-0000-0000-000000000053', 'Baño y peluquería',          'c2100000-0000-0000-0000-000000000017', 'scissors'),
  ('c2200000-0000-0000-0000-000000000054', 'Cocineros',                  'c2100000-0000-0000-0000-000000000018', 'utensils-crossed'),
  ('c2200000-0000-0000-0000-000000000055', 'Chef a domicilio',           'c2100000-0000-0000-0000-000000000018', 'chef-hat'),
  ('c2200000-0000-0000-0000-000000000056', 'Preparación de comidas',     'c2100000-0000-0000-0000-000000000018', 'sandwich'),
  ('c2200000-0000-0000-0000-000000000057', 'Armado de muebles',          'c2100000-0000-0000-0000-000000000019', 'package-check'),
  ('c2200000-0000-0000-0000-000000000058', 'Instalación de TV',          'c2100000-0000-0000-0000-000000000019', 'tv'),
  ('c2200000-0000-0000-0000-000000000059', 'Decoración',                 'c2100000-0000-0000-0000-000000000019', 'sparkles'),
  ('c2200000-0000-0000-0000-000000000060', 'Organización del hogar',     'c2100000-0000-0000-0000-000000000019', 'folder-tree')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    parent_id = EXCLUDED.parent_id,
    icon = EXCLUDED.icon;

-- =============================================
-- SERVICES  
-- =============================================
INSERT INTO public.services (id, name, category_id, description) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'Aseo general',                    'c2200000-0000-0000-0000-000000000001', 'Limpieza general de espacios del hogar'),
  ('b3000000-0000-0000-0000-000000000002', 'Aseo profundo',                   'c2200000-0000-0000-0000-000000000002', 'Limpieza profunda por zonas y superficies'),
  ('b3000000-0000-0000-0000-000000000003', 'Desinfección de espacios',        'c2200000-0000-0000-0000-000000000003', 'Desinfección de hogar y áreas críticas'),
  ('b3000000-0000-0000-0000-000000000004', 'Limpieza post obra',              'c2200000-0000-0000-0000-000000000004', 'Retiro de polvo y residuos de construcción'),
  ('b3000000-0000-0000-0000-000000000005', 'Limpieza por horas',              'c2200000-0000-0000-0000-000000000005', 'Servicio flexible de aseo por tiempo'),
  ('b3000000-0000-0000-0000-000000000006', 'Lavado de ropa',                  'c2200000-0000-0000-0000-000000000006', 'Lavado y cuidado de prendas del hogar'),
  ('b3000000-0000-0000-0000-000000000007', 'Planchado de ropa',               'c2200000-0000-0000-0000-000000000007', 'Planchado y doblado de prendas'),
  ('b3000000-0000-0000-0000-000000000008', 'Lavado en seco',                  'c2200000-0000-0000-0000-000000000008', 'Tratamiento de prendas delicadas'),
  ('b3000000-0000-0000-0000-000000000009', 'Organización de clóset',          'c2200000-0000-0000-0000-000000000009', 'Organización, clasificación y optimización de clóset'),
  ('b3000000-0000-0000-0000-000000000010', 'Niñera por horas',                'c2200000-0000-0000-0000-000000000010', 'Cuidado de niños por jornadas parciales'),
  ('b3000000-0000-0000-0000-000000000011', 'Niñera de tiempo completo',       'c2200000-0000-0000-0000-000000000011', 'Cuidado integral de niños en jornada completa'),
  ('b3000000-0000-0000-0000-000000000012', 'Niñera con apoyo escolar',        'c2200000-0000-0000-0000-000000000012', 'Acompañamiento de tareas y estudio'),
  ('b3000000-0000-0000-0000-000000000013', 'Acompañamiento adulto mayor',     'c2200000-0000-0000-0000-000000000013', 'Compañía y asistencia para adulto mayor'),
  ('b3000000-0000-0000-0000-000000000014', 'Enfermería básica adulto mayor',  'c2200000-0000-0000-0000-000000000014', 'Cuidados básicos en casa para adulto mayor'),
  ('b3000000-0000-0000-0000-000000000015', 'Cuidados nocturnos',              'c2200000-0000-0000-0000-000000000015', 'Acompañamiento y cuidado durante la noche'),
  ('b3000000-0000-0000-0000-000000000016', 'Enfermería en casa',              'c2200000-0000-0000-0000-000000000016', 'Atención de enfermería domiciliaria'),
  ('b3000000-0000-0000-0000-000000000017', 'Terapias en casa',                'c2200000-0000-0000-0000-000000000017', 'Terapias físicas y respiratorias en domicilio'),
  ('b3000000-0000-0000-0000-000000000018', 'Instalaciones eléctricas',        'c2200000-0000-0000-0000-000000000018', 'Instalación y adecuación de redes eléctricas'),
  ('b3000000-0000-0000-0000-000000000019', 'Reparaciones eléctricas',         'c2200000-0000-0000-0000-000000000019', 'Diagnóstico y reparación de fallas eléctricas'),
  ('b3000000-0000-0000-0000-000000000020', 'Atención de cortocircuitos',      'c2200000-0000-0000-0000-000000000020', 'Solución urgente de cortocircuitos'),
  ('b3000000-0000-0000-0000-000000000021', 'Reparación de fugas',             'c2200000-0000-0000-0000-000000000021', 'Detección y reparación de fugas de agua'),
  ('b3000000-0000-0000-0000-000000000022', 'Instalación de grifería',         'c2200000-0000-0000-0000-000000000022', 'Montaje y cambio de grifos y accesorios'),
  ('b3000000-0000-0000-0000-000000000023', 'Destapes de tubería',             'c2200000-0000-0000-0000-000000000023', 'Destape de lavaplatos, sanitarios y desagües'),
  ('b3000000-0000-0000-0000-000000000024', 'Instalación de aire acondicionado','c2200000-0000-0000-0000-000000000024', 'Instalación de equipos de aire acondicionado'),
  ('b3000000-0000-0000-0000-000000000025', 'Mantenimiento de aire acondicionado','c2200000-0000-0000-0000-000000000025', 'Limpieza y mantenimiento preventivo de equipos'),
  ('b3000000-0000-0000-0000-000000000026', 'Reparación de aire acondicionado','c2200000-0000-0000-0000-000000000026', 'Corrección de fallas en sistemas de aire acondicionado'),
  ('b3000000-0000-0000-0000-000000000027', 'Instalación de gas',              'c2200000-0000-0000-0000-000000000027', 'Instalación de líneas y puntos de gas'),
  ('b3000000-0000-0000-0000-000000000028', 'Revisión de gas',                 'c2200000-0000-0000-0000-000000000028', 'Revisión de seguridad y funcionamiento de gas'),
  ('b3000000-0000-0000-0000-000000000029', 'Albañilería',                     'c2200000-0000-0000-0000-000000000029', 'Obras de albañilería para vivienda'),
  ('b3000000-0000-0000-0000-000000000030', 'Remodelación de espacios',        'c2200000-0000-0000-0000-000000000030', 'Remodelación de ambientes residenciales'),
  ('b3000000-0000-0000-0000-000000000031', 'Ampliaciones',                    'c2200000-0000-0000-0000-000000000031', 'Ampliación de áreas y estructuras'),
  ('b3000000-0000-0000-0000-000000000032', 'Pintura de interiores y exteriores','c2200000-0000-0000-0000-000000000032', 'Pintura decorativa y protectora'),
  ('b3000000-0000-0000-0000-000000000033', 'Aplicación de estuco',            'c2200000-0000-0000-0000-000000000033', 'Acabados en estuco para muros y techos'),
  ('b3000000-0000-0000-0000-000000000034', 'Instalación y reparación de drywall','c2200000-0000-0000-0000-000000000034', 'Estructuras y divisiones en drywall'),
  ('b3000000-0000-0000-0000-000000000035', 'Instalación de ventanas',         'c2200000-0000-0000-0000-000000000035', 'Montaje y ajuste de ventanas'),
  ('b3000000-0000-0000-0000-000000000036', 'Instalación de puertas',          'c2200000-0000-0000-0000-000000000036', 'Montaje y ajuste de puertas'),
  ('b3000000-0000-0000-0000-000000000037', 'Instalación de pisos',            'c2200000-0000-0000-0000-000000000037', 'Instalación de pisos de cerámica y porcelanato'),
  ('b3000000-0000-0000-0000-000000000038', 'Corte de césped',                 'c2200000-0000-0000-0000-000000000038', 'Corte y mantenimiento de césped'),
  ('b3000000-0000-0000-0000-000000000039', 'Diseño de jardines',              'c2200000-0000-0000-0000-000000000039', 'Diseño y mejora de zonas verdes'),
  ('b3000000-0000-0000-0000-000000000040', 'Poda de árboles',                 'c2200000-0000-0000-0000-000000000040', 'Poda segura y control de crecimiento'),
  ('b3000000-0000-0000-0000-000000000041', 'Fumigación',                      'c2200000-0000-0000-0000-000000000041', 'Control de plagas en interiores y exteriores'),
  ('b3000000-0000-0000-0000-000000000042', 'Trasteos',                        'c2200000-0000-0000-0000-000000000042', 'Servicio de mudanza local y regional'),
  ('b3000000-0000-0000-0000-000000000043', 'Carga y descarga',                'c2200000-0000-0000-0000-000000000043', 'Apoyo logístico de carga y descarga'),
  ('b3000000-0000-0000-0000-000000000044', 'Transporte de muebles',           'c2200000-0000-0000-0000-000000000044', 'Transporte especializado de muebles'),
  ('b3000000-0000-0000-0000-000000000045', 'Reparación de nevera',            'c2200000-0000-0000-0000-000000000045', 'Diagnóstico y reparación de neveras'),
  ('b3000000-0000-0000-0000-000000000046', 'Reparación de lavadora',          'c2200000-0000-0000-0000-000000000046', 'Diagnóstico y reparación de lavadoras'),
  ('b3000000-0000-0000-0000-000000000047', 'Reparación de televisores',       'c2200000-0000-0000-0000-000000000047', 'Mantenimiento y reparación de TV'),
  ('b3000000-0000-0000-0000-000000000048', 'Soporte técnico para PC',         'c2200000-0000-0000-0000-000000000048', 'Soporte técnico para computadores y portátiles'),
  ('b3000000-0000-0000-0000-000000000049', 'Instalación de redes',            'c2200000-0000-0000-0000-000000000049', 'Instalación y configuración de red'),
  ('b3000000-0000-0000-0000-000000000050', 'Instalación de cámaras de seguridad','c2200000-0000-0000-0000-000000000050', 'Montaje y configuración de cámaras'),
  ('b3000000-0000-0000-0000-000000000051', 'Paseo de perros',                 'c2200000-0000-0000-0000-000000000051', 'Paseo y actividad para perros'),
  ('b3000000-0000-0000-0000-000000000052', 'Guardería para mascotas',         'c2200000-0000-0000-0000-000000000052', 'Cuidado diurno o por jornadas para mascotas'),
  ('b3000000-0000-0000-0000-000000000053', 'Baño y peluquería para mascotas', 'c2200000-0000-0000-0000-000000000053', 'Baño, cepillado y corte para mascotas'),
  ('b3000000-0000-0000-0000-000000000054', 'Servicio de cocinero',            'c2200000-0000-0000-0000-000000000054', 'Preparación de menús en el hogar'),
  ('b3000000-0000-0000-0000-000000000055', 'Chef a domicilio',                'c2200000-0000-0000-0000-000000000055', 'Experiencia gastronómica en casa'),
  ('b3000000-0000-0000-0000-000000000056', 'Preparación de comidas',          'c2200000-0000-0000-0000-000000000056', 'Preparación semanal de comidas'),
  ('b3000000-0000-0000-0000-000000000057', 'Armado de muebles tipo IKEA',     'c2200000-0000-0000-0000-000000000057', 'Armado de muebles modulares y prefabricados'),
  ('b3000000-0000-0000-0000-000000000058', 'Instalación de TV',               'c2200000-0000-0000-0000-000000000058', 'Instalación de televisor en pared y soporte'),
  ('b3000000-0000-0000-0000-000000000059', 'Decoración de espacios',          'c2200000-0000-0000-0000-000000000059', 'Decoración y puesta a punto del hogar'),
  ('b3000000-0000-0000-0000-000000000060', 'Organización del hogar',          'c2200000-0000-0000-0000-000000000060', 'Organización funcional de ambientes')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    description = EXCLUDED.description;

-- =============================================
-- LOCAL ADMIN BOOTSTRAP (auth + public profile)
-- Ensures admin exists after `supabase db reset`
-- =============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  v_admin_id uuid;
  v_admin_email text := 'admin@services360.com';
  v_admin_password text := 'Admin123456';
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email LIMIT 1;
  IF v_admin_id IS NULL THEN
    v_admin_id := 'a0000000-0000-0000-0000-000000000001';
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_admin_id,
    'authenticated',
    'authenticated',
    v_admin_email,
    extensions.crypt(v_admin_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","full_name":"Administrador"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
        raw_app_meta_data = EXCLUDED.raw_app_meta_data,
        raw_user_meta_data = EXCLUDED.raw_user_meta_data,
        updated_at = now();

  INSERT INTO auth.identities (
    id,
    user_id,
    provider,
    provider_id,
    identity_data,
    created_at,
    updated_at,
    last_sign_in_at
  )
  VALUES (
    extensions.uuid_generate_v4(),
    v_admin_id,
    'email',
    v_admin_email,
    jsonb_build_object('sub', v_admin_id::text, 'email', v_admin_email),
    now(),
    now(),
    now()
  )
  ON CONFLICT (provider, provider_id) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        identity_data = EXCLUDED.identity_data,
        updated_at = now();

  INSERT INTO public.users (id, email, role, full_name)
  VALUES (v_admin_id, v_admin_email, 'admin', 'Administrador')
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = 'admin',
        full_name = COALESCE(public.users.full_name, EXCLUDED.full_name);
END
$$;
