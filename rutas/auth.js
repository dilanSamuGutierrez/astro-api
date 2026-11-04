import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { verificarToken } from '../middlewares/verificarToken.js';

const router = Router();

router.post('/registro', async (req, res) => {
  const { nombre, correo, clave } = req.body ?? {};

  if (!nombre || !correo || !clave) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }
  if (nombre.trim().length > 15) {
    return res.status(400).json({ mensaje: 'El nombre tiene máximo 15 caracteres' });
  }
  if (!correoValido.test(correo)) {
    return res.status(400).json({ mensaje: 'El correo no es válido' });
  }
  if (clave.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const correoLimpio = correo.trim().toLowerCase();
  const existe = await pool.query('SELECT id FROM usuarios WHERE correo = $1', [correoLimpio]);

  if (existe.rowCount > 0) {
    return res.status(409).json({ mensaje: 'Ese correo ya está registrado' });
  }

  const claveHash = await bcrypt.hash(clave, 10);
  const resultado = await pool.query(
    'INSERT INTO usuarios (nombre, correo, clave_hash) VALUES ($1, $2, $3) RETURNING id, nombre, correo',
    [nombre.trim(), correoLimpio, claveHash]
  );

  res.status(201).json({ usuario: resultado.rows[0] });
});

router.post('/login', async (req, res) => {
  const { nombre, clave } = req.body ?? {};

  if (
    typeof nombre !== 'string' ||
    !nombre.trim() ||
    typeof clave !== 'string' ||
    !clave
  ) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  const resultado = await pool.query(
    `SELECT id, nombre, correo, clave_hash
     FROM usuarios
     WHERE LOWER(nombre) = LOWER($1)`,
    [nombre.trim()]
  );

  const usuario = resultado.rows[0];
  const claveCorrecta =
    usuario && (await bcrypt.compare(clave, usuario.clave_hash));

  if (!claveCorrecta) {
    return res.status(401).json({
      mensaje: 'Nombre de usuario o contraseña incorrectos',
    });
  }

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre },
    process.env.JWT_SECRETO,
    { expiresIn: '2h' }
  );

  return res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
  });
});

router.get('/perfil', verificarToken, async (req, res) => {
  const resultado = await pool.query(
    'SELECT id, nombre, correo, creado_en FROM usuarios WHERE id = $1',
    [req.usuario.id]
  );
  res.json({ usuario: resultado.rows[0] });
});

export default router;
