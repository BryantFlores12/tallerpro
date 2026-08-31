CREATE TABLE folios (
  tipo VARCHAR(20) PRIMARY KEY,
  valor INT NOT NULL DEFAULT 1000
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id CHAR(24) PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','recepcion','mecanico') NOT NULL,
  puesto VARCHAR(120),
  color VARCHAR(9) DEFAULT '#64748b',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id CHAR(24) PRIMARY KEY,
  nombre VARCHAR(160) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(160),
  rfc VARCHAR(13),
  direccion VARCHAR(255),
  notas TEXT,
  creado_por CHAR(24),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cli_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE vehiculos (
  id CHAR(24) PRIMARY KEY,
  cliente_id CHAR(24) NOT NULL,
  marca VARCHAR(60) NOT NULL,
  modelo VARCHAR(60) NOT NULL,
  anio SMALLINT,
  vin VARCHAR(17) UNIQUE,
  placa VARCHAR(12),
  kilometraje INT DEFAULT 0,
  color VARCHAR(40),
  CONSTRAINT fk_veh_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  INDEX idx_veh_cliente (cliente_id)
) ENGINE=InnoDB;

CREATE TABLE ordenes (
  id CHAR(24) PRIMARY KEY,
  folio VARCHAR(12) NOT NULL UNIQUE,
  cliente_id CHAR(24) NOT NULL,
  vehiculo_id CHAR(24) NOT NULL,
  asesor_id CHAR(24),
  tecnico_id CHAR(24),
  estado ENUM('Activa','En espera','Entregado','Cerrada') DEFAULT 'Activa',
  motivo TEXT,
  km INT,
  gasolina TINYINT DEFAULT 0,
  zonas JSON,
  valores JSON,
  obs TEXT,
  firma_data MEDIUMTEXT,
  modo ENUM('firma','enlace') DEFAULT 'firma',
  link VARCHAR(255),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ord_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ord_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_ord_asesor FOREIGN KEY (asesor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_ord_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ord_cliente (cliente_id),
  INDEX idx_ord_estado (estado)
) ENGINE=InnoDB;

CREATE TABLE bitacora (
  id CHAR(24) PRIMARY KEY,
  vehiculo_id CHAR(24) NOT NULL,
  orden_id CHAR(24),
  tecnico_id CHAR(24),
  tipo VARCHAR(60),
  estado ENUM('En proceso','Completado') DEFAULT 'En proceso',
  sintoma TEXT,
  mediciones JSON,
  fusibles JSON,
  descartadas JSON,
  notas TEXT,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bit_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT fk_bit_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE SET NULL,
  CONSTRAINT fk_bit_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_bit_vehiculo (vehiculo_id)
) ENGINE=InnoDB;

CREATE TABLE bitacora_fotos (
  id CHAR(24) PRIMARY KEY,
  bitacora_id CHAR(24) NOT NULL,
  url LONGTEXT NOT NULL,
  CONSTRAINT fk_foto_bitacora FOREIGN KEY (bitacora_id) REFERENCES bitacora(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE inventario (
  id CHAR(24) PRIMARY KEY,
  sku VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(160) NOT NULL,
  categoria VARCHAR(60),
  marca VARCHAR(60),
  stock INT NOT NULL DEFAULT 0,
  stock_min INT NOT NULL DEFAULT 0,
  costo DECIMAL(12,2) DEFAULT 0,
  precio DECIMAL(12,2) DEFAULT 0,
  lote VARCHAR(40),
  ubicacion VARCHAR(20),
  CONSTRAINT chk_stock CHECK (stock >= 0)
) ENGINE=InnoDB;

CREATE TABLE trazabilidad (
  id CHAR(24) PRIMARY KEY,
  parte_id CHAR(24) NOT NULL,
  lote VARCHAR(40),
  vehiculo_id CHAR(24) NOT NULL,
  orden_id CHAR(24),
  fecha DATE NOT NULL,
  garantia VARCHAR(40) DEFAULT 'Vigente',
  CONSTRAINT fk_trz_parte FOREIGN KEY (parte_id) REFERENCES inventario(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trz_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_trz_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE movimientos_inventario (
  id CHAR(24) PRIMARY KEY,
  parte_id CHAR(24) NOT NULL,
  tipo ENUM('entrada','salida') NOT NULL,
  cantidad INT NOT NULL,
  motivo VARCHAR(60),
  vehiculo_id CHAR(24),
  orden_id CHAR(24),
  usuario_id CHAR(24),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mov_parte FOREIGN KEY (parte_id) REFERENCES inventario(id) ON DELETE CASCADE,
  CONSTRAINT fk_mov_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE cotizaciones (
  id CHAR(24) PRIMARY KEY,
  folio VARCHAR(12) NOT NULL UNIQUE,
  cliente_id CHAR(24) NOT NULL,
  vehiculo_id CHAR(24) NOT NULL,
  estado ENUM('Borrador','Enviada','Aprobada','Rechazada','Pagada') DEFAULT 'Borrador',
  notas TEXT,
  approval_token VARCHAR(64) NULL UNIQUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cot_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_cot_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE cotizacion_items (
  id CHAR(24) PRIMARY KEY,
  cotizacion_id CHAR(24) NOT NULL,
  tipo ENUM('pieza','mano') NOT NULL,
  descripcion VARCHAR(255),
  cantidad INT DEFAULT 1,
  horas DECIMAL(6,2) DEFAULT 0,
  costo DECIMAL(12,2) DEFAULT 0,
  margen DECIMAL(5,2) DEFAULT 0,
  tarifa DECIMAL(12,2) DEFAULT 0,
  CONSTRAINT fk_item_cot FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE pagos (
  id CHAR(24) PRIMARY KEY,
  cotizacion_id CHAR(24) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  metodo VARCHAR(30),
  fecha DATE NOT NULL,
  usuario_id CHAR(24),
  CONSTRAINT fk_pago_cot FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
  CONSTRAINT fk_pago_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE tareas (
  id CHAR(24) PRIMARY KEY,
  orden_id CHAR(24),
  vehiculo_id CHAR(24) NOT NULL,
  tecnico_id CHAR(24),
  estado ENUM('diag','espera','repara','listo') DEFAULT 'diag',
  prioridad ENUM('Alta','Media','Baja') DEFAULT 'Media',
  eta DATE,
  refaccion_estado VARCHAR(40) DEFAULT 'Sin solicitud',
  avance TINYINT DEFAULT 0,
  CONSTRAINT fk_tarea_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE CASCADE,
  CONSTRAINT fk_tarea_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE,
  CONSTRAINT fk_tarea_tecnico FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE auditoria (
  id CHAR(24) PRIMARY KEY,
  usuario_id CHAR(24),
  modulo VARCHAR(40),
  accion VARCHAR(40),
  registro_id CHAR(24),
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT INTO folios (tipo, valor) VALUES ('orden', 1044), ('cotizacion', 2202);
