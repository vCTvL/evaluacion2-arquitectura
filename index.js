import express from 'express';
import { fileURLToPath } from 'url';
import path from "path";
import jwt from 'jsonwebtoken'; // Necesitarás instalar: npm install jsonwebtoken
import pool from './public/db.js'; // Importa el pool correctamente

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.static(__dirname + "/public"));

// Ruta principal: sirve login.html desde /pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "login.html"));
});

// Handler de login corregido
app.post('/login', async (req, res) => {
    const { user, pass } = req.body;

    if (!user || !pass) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }

    try {
        // Buscar por nombre y validar contraseña
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE nombre = ?', [user]);

        if (rows.length === 0) {
            return res.status(400).send({ status: "Error", message: "Usuario incorrecto" });
        }

        // Validar contraseña
        if (rows[0].pass !== pass) {
            return res.status(400).send({ status: "Error", message: "Contraseña incorrecta" });
        }

        // Generar JWT
        const token = jwt.sign(
            { 
                userId: rows[0].id,
                nombre: rows[0].nombre,
                email: rows[0].email
            },
            'tu_clave_secreta_jwt', // Deberías mover esto a variables de entorno
            { expiresIn: '24h' }
        );

        res.send({ 
            status: "ok", 
            message: "Usuario loggeado", 
            redirect: "/index",
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "Error", message: "Error en el servidor" });
    }
});

// Cambia las rutas para servir los HTML desde /pages
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "register.html"));
});

// POST para procesar el registro de usuario
app.post('/api/register', async (req, res) => {
    const { user, password, email } = req.body;

    // Log para depuración
    console.log("Datos recibidos en /register:", { user, password, email });

    if (!user || !password || !email) {
        return res.status(400).send({ status: "Error", message: "Los campos están incompletos" });
    }

    try {
        // Verificar si el usuario ya existe (usar nombre y email)
        const [existingUsers] = await pool.query('SELECT * FROM usuarios WHERE nombre = ? OR email = ?', [user, email]);
        
        if (existingUsers.length > 0) {
            return res.status(400).send({ status: "Error", message: "Este usuario o email ya existe" });
        }

        // Insertar nuevo usuario
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email, pass) VALUES (?, ?, ?)',
            [user, email, password]
        );
        console.log("Resultado de inserción:", result);

        return res.status(201).send({ 
            status: "ok", 
            message: `Usuario ${user} agregado correctamente`, 
            redirect: "/" 
        });
    } catch (error) {
        console.error("Error al insertar usuario:", error);
        res.status(500).send({ status: "Error", message: "Error en el servidor" });
    }
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, "pages", "index.html"));
});

// Endpoint para obtener especialistas y especialidades
app.get('/api/especialistas', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT nombre, area FROM especialistas');
        const especialistas = rows.map(r => r.nombre);
        const especialidades = [...new Set(rows.map(r => r.area))];
        res.json({ especialistas, especialidades });
    } catch (error) {
        res.status(500).json({ especialistas: [], especialidades: [] });
    }
});

// Nuevo endpoint para guardar citas
app.post('/api/citas', async (req, res) => {
    const { especialista, especialidad, fecha, hora } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: "Error", message: "No autorizado" });
    }

    try {
        // Decodificar el token para obtener la info del usuario
        const decoded = jwt.verify(token, 'tu_clave_secreta_jwt');
        
        // Obtener el ID del especialista
        const [especialistaData] = await pool.query(
            'SELECT id FROM especialistas WHERE nombre = ?', 
            [especialista]
        );

        if (especialistaData.length === 0) {
            return res.status(400).json({ status: "Error", message: "Especialista no encontrado" });
        }

        // Insertar la cita
        const [result] = await pool.query(
            'INSERT INTO citas (id_especialista, id_usuario, nombre_usuario, nombre_especialista, fecha, hora) VALUES (?, ?, ?, ?, ?, ?)',
            [
                especialistaData[0].id,
                decoded.userId,
                decoded.nombre,
                especialista,
                fecha,
                hora.replace(':', '') // Convertir hora a formato numérico sin ":"
            ]
        );

        res.json({ 
            status: "ok", 
            message: "Cita agendada exitosamente",
            citaId: result.insertId
        });

    } catch (error) {
        console.error('Error al agendar cita:', error);
        res.status(500).json({ status: "Error", message: "Error al agendar la cita" });
    }
});

// Endpoint para eliminar citas
app.delete('/api/citas/:id', async (req, res) => {
    const citaId = req.params.id;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: "Error", message: "No autorizado" });
    }

    try {
        const decoded = jwt.verify(token, 'tu_clave_secreta_jwt');
        
        // Verificar que la cita pertenezca al usuario
        const [cita] = await pool.query('SELECT * FROM citas WHERE id = ? AND id_usuario = ?', [citaId, decoded.userId]);
        
        if (cita.length === 0) {
            return res.status(404).json({ status: "Error", message: "Cita no encontrada o no autorizado" });
        }

        // Eliminar la cita
        await pool.query('DELETE FROM citas WHERE id = ?', [citaId]);
        
        res.json({ status: "ok", message: "Cita cancelada exitosamente" });
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({ status: "Error", message: "Error al cancelar la cita" });
    }
});

// Endpoint para obtener citas del usuario
app.get('/api/mis-citas', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: "Error", message: "No autorizado" });
    }

    try {
        const decoded = jwt.verify(token, 'tu_clave_secreta_jwt');
        
        const [citas] = await pool.query(
            'SELECT * FROM citas WHERE id_usuario = ? ORDER BY fecha, hora',
            [decoded.userId]
        );
        
        res.json({ status: "ok", citas });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ status: "Error", message: "Error al obtener las citas" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});