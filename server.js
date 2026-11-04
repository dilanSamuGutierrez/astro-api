import express from 'express';
import cors from 'cors';
import { pool } from './db.js';
import rutasAuth from './rutas/auth.js';

const app = express();
const puerto = process.env.PORT || 3000;

app.use(cors({ origin: (process.env.ORIGEN_PERMITIDO || '').split(',') }));
app.use(express.json());

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

app.get('/api/salud/bd', async (req, res) => {
  const resultado = await pool.query('SELECT NOW() AS hora');
  res.json({ hora: resultado.rows[0].hora });
});

app.use('/api/auth', rutasAuth);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensaje: 'Error del servidor' });
});

app.listen(puerto, () => {
  console.log(`API escuchando en http://localhost:${puerto}`);
});
