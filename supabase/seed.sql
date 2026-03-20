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
  ('c2000000-0000-0000-0000-000000000001', 'Servicios del hogar',              'home',        'Limpieza, lavanderia y tareas del hogar'),
  ('c2000000-0000-0000-0000-000000000002', 'Cuidado personal y familiar',      'users',       'Nineras, adulto mayor y salud en casa'),
  ('c2000000-0000-0000-0000-000000000003', 'Mantenimiento del hogar',          'wrench',      'Electricidad, plomeria, aire y gas'),
  ('c2000000-0000-0000-0000-000000000004', 'Construccion y remodelacion',      'hammer',      'Obras, acabados e instalaciones'),
  ('c2000000-0000-0000-0000-000000000005', 'Jardineria y exteriores',          'trees',       'Cesped, poda, fumigacion y diseno de jardines'),
  ('c2000000-0000-0000-0000-000000000006', 'Mudanzas y logistica',             'truck',       'Trasteos, carga y transporte de muebles'),
  ('c2000000-0000-0000-0000-000000000007', 'Servicios tecnicos especializados','settings',    'Electrodomesticos y tecnologia'),
  ('c2000000-0000-0000-0000-000000000008', 'Servicios para mascotas',          'paw-print',   'Paseo, guarderia y peluqueria para mascotas'),
  ('c2000000-0000-0000-0000-000000000009', 'Servicios domesticos personalizados','chef-hat',  'Cocina y preparacion de comidas en casa'),
  ('c2000000-0000-0000-0000-000000000010', 'Otros servicios utiles',           'sparkles',    'Servicios diferenciadores para el hogar')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;

-- =============================================
-- SUB-CATEGORIES
-- =============================================
INSERT INTO public.categories (id, name, parent_id, icon) VALUES
  ('c2100000-0000-0000-0000-000000000001', 'Limpieza y aseo',          'c2000000-0000-0000-0000-000000000001', 'sparkles'),
  ('c2100000-0000-0000-0000-000000000002', 'Lavanderia y planchado',   'c2000000-0000-0000-0000-000000000001', 'shirt'),
  ('c2100000-0000-0000-0000-000000000003', 'Nineras',                  'c2000000-0000-0000-0000-000000000002', 'baby'),
  ('c2100000-0000-0000-0000-000000000004', 'Cuidado adulto mayor',     'c2000000-0000-0000-0000-000000000002', 'heart-handshake'),
  ('c2100000-0000-0000-0000-000000000005', 'Salud en casa',            'c2000000-0000-0000-0000-000000000002', 'stethoscope'),
  ('c2100000-0000-0000-0000-000000000006', 'Electricidad',             'c2000000-0000-0000-0000-000000000003', 'zap'),
  ('c2100000-0000-0000-0000-000000000007', 'Plomeria',                 'c2000000-0000-0000-0000-000000000003', 'wrench'),
  ('c2100000-0000-0000-0000-000000000008', 'Aire acondicionado',       'c2000000-0000-0000-0000-000000000003', 'fan'),
  ('c2100000-0000-0000-0000-000000000009', 'Gas',                      'c2000000-0000-0000-0000-000000000003', 'flame'),
  ('c2100000-0000-0000-0000-000000000010', 'Obras',                    'c2000000-0000-0000-0000-000000000004', 'brick-wall'),
  ('c2100000-0000-0000-0000-000000000011', 'Acabados',                 'c2000000-0000-0000-0000-000000000004', 'paintbrush'),
  ('c2100000-0000-0000-0000-000000000012', 'Instalaciones',            'c2000000-0000-0000-0000-000000000004', 'ruler'),
  ('c2100000-0000-0000-0000-000000000013', 'Servicios de jardineria',  'c2000000-0000-0000-0000-000000000005', 'leaf'),
  ('c2100000-0000-0000-0000-000000000014', 'Servicios de mudanza',     'c2000000-0000-0000-0000-000000000006', 'truck'),
  ('c2100000-0000-0000-0000-000000000015', 'Electrodomesticos',        'c2000000-0000-0000-0000-000000000007', 'tv'),
  ('c2100000-0000-0000-0000-000000000016', 'Tecnologia',               'c2000000-0000-0000-0000-000000000007', 'laptop'),
  ('c2100000-0000-0000-0000-000000000017', 'Cuidado de mascotas',      'c2000000-0000-0000-0000-000000000008', 'paw-print'),
  ('c2100000-0000-0000-0000-000000000018', 'Servicios de cocina',      'c2000000-0000-0000-0000-000000000009', 'chef-hat'),
  ('c2100000-0000-0000-0000-000000000019', 'Servicios del hogar utiles','c2000000-0000-0000-0000-000000000010', 'sparkles')
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
  ('c2200000-0000-0000-0000-000000000003', 'Desinfeccion',               'c2100000-0000-0000-0000-000000000001', 'shield-check'),
  ('c2200000-0000-0000-0000-000000000004', 'Limpieza post obra',         'c2100000-0000-0000-0000-000000000001', 'hard-hat'),
  ('c2200000-0000-0000-0000-000000000005', 'Limpieza por horas',         'c2100000-0000-0000-0000-000000000001', 'clock'),
  ('c2200000-0000-0000-0000-000000000006', 'Lavado de ropa',             'c2100000-0000-0000-0000-000000000002', 'shirt'),
  ('c2200000-0000-0000-0000-000000000007', 'Planchado',                  'c2100000-0000-0000-0000-000000000002', 'shirt'),
  ('c2200000-0000-0000-0000-000000000008', 'Lavado en seco',             'c2100000-0000-0000-0000-000000000002', 'droplets'),
  ('c2200000-0000-0000-0000-000000000009', 'Organizacion de closet',     'c2100000-0000-0000-0000-000000000002', 'archive'),
  ('c2200000-0000-0000-0000-000000000010', 'Cuidado por horas',          'c2100000-0000-0000-0000-000000000003', 'clock'),
  ('c2200000-0000-0000-0000-000000000011', 'Cuidado tiempo completo',    'c2100000-0000-0000-0000-000000000003', 'calendar-days'),
  ('c2200000-0000-0000-0000-000000000012', 'Apoyo escolar',              'c2100000-0000-0000-0000-000000000003', 'book-open'),
  ('c2200000-0000-0000-0000-000000000013', 'Acompanamiento',             'c2100000-0000-0000-0000-000000000004', 'hand-heart'),
  ('c2200000-0000-0000-0000-000000000014', 'Enfermeria basica',          'c2100000-0000-0000-0000-000000000004', 'stethoscope'),
  ('c2200000-0000-0000-0000-000000000015', 'Cuidados nocturnos',         'c2100000-0000-0000-0000-000000000004', 'moon-star'),
  ('c2200000-0000-0000-0000-000000000016', 'Enfermeria',                 'c2100000-0000-0000-0000-000000000005', 'heart-pulse'),
  ('c2200000-0000-0000-0000-000000000017', 'Terapias fisica respiratoria','c2100000-0000-0000-0000-000000000005', 'activity'),
  ('c2200000-0000-0000-0000-000000000018', 'Instalaciones electricas',   'c2100000-0000-0000-0000-000000000006', 'zap'),
  ('c2200000-0000-0000-0000-000000000019', 'Reparaciones electricas',    'c2100000-0000-0000-0000-000000000006', 'wrench'),
  ('c2200000-0000-0000-0000-000000000020', 'Cortocircuitos',             'c2100000-0000-0000-0000-000000000006', 'alert-triangle'),
  ('c2200000-0000-0000-0000-000000000021', 'Fugas',                      'c2100000-0000-0000-0000-000000000007', 'droplet'),
  ('c2200000-0000-0000-0000-000000000022', 'Instalacion de griferia',    'c2100000-0000-0000-0000-000000000007', 'wrench'),
  ('c2200000-0000-0000-0000-000000000023', 'Destapes',                   'c2100000-0000-0000-0000-000000000007', 'pipe'),
  ('c2200000-0000-0000-0000-000000000024', 'Instalacion',                'c2100000-0000-0000-0000-000000000008', 'fan'),
  ('c2200000-0000-0000-0000-000000000025', 'Mantenimiento',              'c2100000-0000-0000-0000-000000000008', 'settings'),
  ('c2200000-0000-0000-0000-000000000026', 'Reparacion',                 'c2100000-0000-0000-0000-000000000008', 'wrench'),
  ('c2200000-0000-0000-0000-000000000027', 'Instalacion',                'c2100000-0000-0000-0000-000000000009', 'flame'),
  ('c2200000-0000-0000-0000-000000000028', 'Revision',                   'c2100000-0000-0000-0000-000000000009', 'search-check'),
  ('c2200000-0000-0000-0000-000000000029', 'Albanileria',                'c2100000-0000-0000-0000-000000000010', 'hammer'),
  ('c2200000-0000-0000-0000-000000000030', 'Remodelacion',               'c2100000-0000-0000-0000-000000000010', 'construction'),
  ('c2200000-0000-0000-0000-000000000031', 'Ampliaciones',               'c2100000-0000-0000-0000-000000000010', 'ruler'),
  ('c2200000-0000-0000-0000-000000000032', 'Pintura',                    'c2100000-0000-0000-0000-000000000011', 'paintbrush'),
  ('c2200000-0000-0000-0000-000000000033', 'Estuco',                     'c2100000-0000-0000-0000-000000000011', 'paint-roller'),
  ('c2200000-0000-0000-0000-000000000034', 'Drywall',                    'c2100000-0000-0000-0000-000000000011', 'panel-left'),
  ('c2200000-0000-0000-0000-000000000035', 'Ventanas',                   'c2100000-0000-0000-0000-000000000012', 'panel-top-open'),
  ('c2200000-0000-0000-0000-000000000036', 'Puertas',                    'c2100000-0000-0000-0000-000000000012', 'door-open'),
  ('c2200000-0000-0000-0000-000000000037', 'Pisos ceramica porcelanato', 'c2100000-0000-0000-0000-000000000012', 'grid-3x3'),
  ('c2200000-0000-0000-0000-000000000038', 'Corte de cesped',            'c2100000-0000-0000-0000-000000000013', 'scissors'),
  ('c2200000-0000-0000-0000-000000000039', 'Diseno de jardines',         'c2100000-0000-0000-0000-000000000013', 'leaf'),
  ('c2200000-0000-0000-0000-000000000040', 'Poda de arboles',            'c2100000-0000-0000-0000-000000000013', 'trees'),
  ('c2200000-0000-0000-0000-000000000041', 'Fumigacion',                 'c2100000-0000-0000-0000-000000000013', 'bug'),
  ('c2200000-0000-0000-0000-000000000042', 'Trasteos',                   'c2100000-0000-0000-0000-000000000014', 'truck'),
  ('c2200000-0000-0000-0000-000000000043', 'Carga y descarga',           'c2100000-0000-0000-0000-000000000014', 'package-plus'),
  ('c2200000-0000-0000-0000-000000000044', 'Transporte de muebles',      'c2100000-0000-0000-0000-000000000014', 'sofa'),
  ('c2200000-0000-0000-0000-000000000045', 'Reparacion de nevera',       'c2100000-0000-0000-0000-000000000015', 'refrigerator'),
  ('c2200000-0000-0000-0000-000000000046', 'Reparacion de lavadora',     'c2100000-0000-0000-0000-000000000015', 'washer'),
  ('c2200000-0000-0000-0000-000000000047', 'Reparacion de televisores',  'c2100000-0000-0000-0000-000000000015', 'tv'),
  ('c2200000-0000-0000-0000-000000000048', 'Soporte tecnico PC',         'c2100000-0000-0000-0000-000000000016', 'laptop'),
  ('c2200000-0000-0000-0000-000000000049', 'Instalacion de redes',       'c2100000-0000-0000-0000-000000000016', 'router'),
  ('c2200000-0000-0000-0000-000000000050', 'Camaras de seguridad',       'c2100000-0000-0000-0000-000000000016', 'camera'),
  ('c2200000-0000-0000-0000-000000000051', 'Paseo de perros',            'c2100000-0000-0000-0000-000000000017', 'dog'),
  ('c2200000-0000-0000-0000-000000000052', 'Guarderia de mascotas',      'c2100000-0000-0000-0000-000000000017', 'home'),
  ('c2200000-0000-0000-0000-000000000053', 'Bano y peluqueria',          'c2100000-0000-0000-0000-000000000017', 'scissors'),
  ('c2200000-0000-0000-0000-000000000054', 'Cocineros',                  'c2100000-0000-0000-0000-000000000018', 'utensils-crossed'),
  ('c2200000-0000-0000-0000-000000000055', 'Chef a domicilio',           'c2100000-0000-0000-0000-000000000018', 'chef-hat'),
  ('c2200000-0000-0000-0000-000000000056', 'Preparacion de comidas',     'c2100000-0000-0000-0000-000000000018', 'sandwich'),
  ('c2200000-0000-0000-0000-000000000057', 'Armado de muebles',          'c2100000-0000-0000-0000-000000000019', 'package-check'),
  ('c2200000-0000-0000-0000-000000000058', 'Instalacion TV',             'c2100000-0000-0000-0000-000000000019', 'tv'),
  ('c2200000-0000-0000-0000-000000000059', 'Decoracion',                 'c2100000-0000-0000-0000-000000000019', 'sparkles'),
  ('c2200000-0000-0000-0000-000000000060', 'Organizacion del hogar',     'c2100000-0000-0000-0000-000000000019', 'folder-tree')
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
  ('b3000000-0000-0000-0000-000000000003', 'Desinfeccion de espacios',        'c2200000-0000-0000-0000-000000000003', 'Desinfeccion de hogar y areas criticas'),
  ('b3000000-0000-0000-0000-000000000004', 'Limpieza post obra',              'c2200000-0000-0000-0000-000000000004', 'Retiro de polvo y residuos de construccion'),
  ('b3000000-0000-0000-0000-000000000005', 'Limpieza por horas',              'c2200000-0000-0000-0000-000000000005', 'Servicio flexible de aseo por tiempo'),
  ('b3000000-0000-0000-0000-000000000006', 'Lavado de ropa',                  'c2200000-0000-0000-0000-000000000006', 'Lavado y cuidado de prendas del hogar'),
  ('b3000000-0000-0000-0000-000000000007', 'Planchado de ropa',               'c2200000-0000-0000-0000-000000000007', 'Planchado y doblado de prendas'),
  ('b3000000-0000-0000-0000-000000000008', 'Lavado en seco',                  'c2200000-0000-0000-0000-000000000008', 'Tratamiento de prendas delicadas'),
  ('b3000000-0000-0000-0000-000000000009', 'Organizacion de closet',          'c2200000-0000-0000-0000-000000000009', 'Organizacion, clasificacion y optimizacion de closet'),
  ('b3000000-0000-0000-0000-000000000010', 'Ninera por horas',                'c2200000-0000-0000-0000-000000000010', 'Cuidado de ninos por jornadas parciales'),
  ('b3000000-0000-0000-0000-000000000011', 'Ninera tiempo completo',          'c2200000-0000-0000-0000-000000000011', 'Cuidado integral de ninos jornada completa'),
  ('b3000000-0000-0000-0000-000000000012', 'Ninera con apoyo escolar',        'c2200000-0000-0000-0000-000000000012', 'Acompanamiento de tareas y estudio'),
  ('b3000000-0000-0000-0000-000000000013', 'Acompanamiento adulto mayor',     'c2200000-0000-0000-0000-000000000013', 'Compania y asistencia para adulto mayor'),
  ('b3000000-0000-0000-0000-000000000014', 'Enfermeria basica adulto mayor',  'c2200000-0000-0000-0000-000000000014', 'Cuidados basicos en casa para adulto mayor'),
  ('b3000000-0000-0000-0000-000000000015', 'Cuidados nocturnos',              'c2200000-0000-0000-0000-000000000015', 'Acompanamiento y cuidado durante la noche'),
  ('b3000000-0000-0000-0000-000000000016', 'Enfermeria en casa',              'c2200000-0000-0000-0000-000000000016', 'Atencion de enfermeria domiciliaria'),
  ('b3000000-0000-0000-0000-000000000017', 'Terapias en casa',                'c2200000-0000-0000-0000-000000000017', 'Terapias fisica y respiratoria en domicilio'),
  ('b3000000-0000-0000-0000-000000000018', 'Instalaciones electricas',        'c2200000-0000-0000-0000-000000000018', 'Instalacion y adecuacion de redes electricas'),
  ('b3000000-0000-0000-0000-000000000019', 'Reparaciones electricas',         'c2200000-0000-0000-0000-000000000019', 'Diagnostico y reparacion de fallas electricas'),
  ('b3000000-0000-0000-0000-000000000020', 'Atencion de cortocircuitos',      'c2200000-0000-0000-0000-000000000020', 'Solucion urgente de cortocircuitos'),
  ('b3000000-0000-0000-0000-000000000021', 'Reparacion de fugas',             'c2200000-0000-0000-0000-000000000021', 'Deteccion y reparacion de fugas de agua'),
  ('b3000000-0000-0000-0000-000000000022', 'Instalacion de griferia',         'c2200000-0000-0000-0000-000000000022', 'Montaje y cambio de grifos y accesorios'),
  ('b3000000-0000-0000-0000-000000000023', 'Destapes de tuberia',             'c2200000-0000-0000-0000-000000000023', 'Destape de lavaplatos, sanitarios y desagues'),
  ('b3000000-0000-0000-0000-000000000024', 'Instalacion de aire acondicionado','c2200000-0000-0000-0000-000000000024', 'Instalacion de equipos de aire acondicionado'),
  ('b3000000-0000-0000-0000-000000000025', 'Mantenimiento de aire acondicionado','c2200000-0000-0000-0000-000000000025', 'Limpieza y mantenimiento preventivo de equipos'),
  ('b3000000-0000-0000-0000-000000000026', 'Reparacion de aire acondicionado','c2200000-0000-0000-0000-000000000026', 'Correccion de fallas en sistemas de aire acondicionado'),
  ('b3000000-0000-0000-0000-000000000027', 'Instalacion de gas',              'c2200000-0000-0000-0000-000000000027', 'Instalacion de lineas y puntos de gas'),
  ('b3000000-0000-0000-0000-000000000028', 'Revision de gas',                 'c2200000-0000-0000-0000-000000000028', 'Revision de seguridad y funcionamiento de gas'),
  ('b3000000-0000-0000-0000-000000000029', 'Albanileria',                     'c2200000-0000-0000-0000-000000000029', 'Obras de albanileria para vivienda'),
  ('b3000000-0000-0000-0000-000000000030', 'Remodelacion de espacios',        'c2200000-0000-0000-0000-000000000030', 'Remodelacion de ambientes residenciales'),
  ('b3000000-0000-0000-0000-000000000031', 'Ampliaciones',                    'c2200000-0000-0000-0000-000000000031', 'Ampliacion de areas y estructuras'),
  ('b3000000-0000-0000-0000-000000000032', 'Pintura de interiores y exteriores','c2200000-0000-0000-0000-000000000032', 'Pintura decorativa y protectora'),
  ('b3000000-0000-0000-0000-000000000033', 'Aplicacion de estuco',            'c2200000-0000-0000-0000-000000000033', 'Acabados en estuco para muros y techos'),
  ('b3000000-0000-0000-0000-000000000034', 'Instalacion y reparacion de drywall','c2200000-0000-0000-0000-000000000034', 'Estructuras y divisiones en drywall'),
  ('b3000000-0000-0000-0000-000000000035', 'Instalacion de ventanas',         'c2200000-0000-0000-0000-000000000035', 'Montaje y ajuste de ventanas'),
  ('b3000000-0000-0000-0000-000000000036', 'Instalacion de puertas',          'c2200000-0000-0000-0000-000000000036', 'Montaje y ajuste de puertas'),
  ('b3000000-0000-0000-0000-000000000037', 'Instalacion de pisos',            'c2200000-0000-0000-0000-000000000037', 'Instalacion de pisos ceramica y porcelanato'),
  ('b3000000-0000-0000-0000-000000000038', 'Corte de cesped',                 'c2200000-0000-0000-0000-000000000038', 'Corte y mantenimiento de cesped'),
  ('b3000000-0000-0000-0000-000000000039', 'Diseno de jardines',              'c2200000-0000-0000-0000-000000000039', 'Diseno y mejora de zonas verdes'),
  ('b3000000-0000-0000-0000-000000000040', 'Poda de arboles',                 'c2200000-0000-0000-0000-000000000040', 'Poda segura y control de crecimiento'),
  ('b3000000-0000-0000-0000-000000000041', 'Fumigacion',                      'c2200000-0000-0000-0000-000000000041', 'Control de plagas en interiores y exteriores'),
  ('b3000000-0000-0000-0000-000000000042', 'Trasteos',                        'c2200000-0000-0000-0000-000000000042', 'Servicio de mudanza local y regional'),
  ('b3000000-0000-0000-0000-000000000043', 'Carga y descarga',                'c2200000-0000-0000-0000-000000000043', 'Apoyo logistico de carga y descarga'),
  ('b3000000-0000-0000-0000-000000000044', 'Transporte de muebles',           'c2200000-0000-0000-0000-000000000044', 'Transporte especializado de muebles'),
  ('b3000000-0000-0000-0000-000000000045', 'Reparacion de nevera',            'c2200000-0000-0000-0000-000000000045', 'Diagnostico y reparacion de neveras'),
  ('b3000000-0000-0000-0000-000000000046', 'Reparacion de lavadora',          'c2200000-0000-0000-0000-000000000046', 'Diagnostico y reparacion de lavadoras'),
  ('b3000000-0000-0000-0000-000000000047', 'Reparacion de televisores',       'c2200000-0000-0000-0000-000000000047', 'Mantenimiento y reparacion de TV'),
  ('b3000000-0000-0000-0000-000000000048', 'Soporte tecnico PC',              'c2200000-0000-0000-0000-000000000048', 'Soporte tecnico para computadores y portatiles'),
  ('b3000000-0000-0000-0000-000000000049', 'Instalacion de redes',            'c2200000-0000-0000-0000-000000000049', 'Instalacion y configuracion de red'),
  ('b3000000-0000-0000-0000-000000000050', 'Instalacion de camaras de seguridad','c2200000-0000-0000-0000-000000000050', 'Montaje y configuracion de camaras'),
  ('b3000000-0000-0000-0000-000000000051', 'Paseo de perros',                 'c2200000-0000-0000-0000-000000000051', 'Paseo y actividad para perros'),
  ('b3000000-0000-0000-0000-000000000052', 'Guarderia para mascotas',         'c2200000-0000-0000-0000-000000000052', 'Cuidado diurno o por jornadas para mascotas'),
  ('b3000000-0000-0000-0000-000000000053', 'Bano y peluqueria para mascotas', 'c2200000-0000-0000-0000-000000000053', 'Bano, cepillado y corte para mascotas'),
  ('b3000000-0000-0000-0000-000000000054', 'Servicio de cocinero',            'c2200000-0000-0000-0000-000000000054', 'Preparacion de menus en el hogar'),
  ('b3000000-0000-0000-0000-000000000055', 'Chef a domicilio',                'c2200000-0000-0000-0000-000000000055', 'Experiencia gastronomica en casa'),
  ('b3000000-0000-0000-0000-000000000056', 'Preparacion de comidas',          'c2200000-0000-0000-0000-000000000056', 'Preparacion semanal de comidas'),
  ('b3000000-0000-0000-0000-000000000057', 'Armado de muebles tipo IKEA',     'c2200000-0000-0000-0000-000000000057', 'Armado de muebles modulares y prefabricados'),
  ('b3000000-0000-0000-0000-000000000058', 'Instalacion de TV',               'c2200000-0000-0000-0000-000000000058', 'Instalacion de televisor en pared y soporte'),
  ('b3000000-0000-0000-0000-000000000059', 'Decoracion de espacios',          'c2200000-0000-0000-0000-000000000059', 'Decoracion y puesta a punto del hogar'),
  ('b3000000-0000-0000-0000-000000000060', 'Organizacion del hogar',          'c2200000-0000-0000-0000-000000000060', 'Organizacion funcional de ambientes')
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
