import jwt from 'jsonwebtoken';

export function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : null;

  if (!token) {
    return res.status(401).json({ mensaje: 'No hay token' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRETO);
    next();
  } catch {
    res.status(401).json({ mensaje: 'Token inválido o vencido' });
  }
}
