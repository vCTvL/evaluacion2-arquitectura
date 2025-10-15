import express from 'express';
import { fileURLToPath } from 'url';
import path from "path";
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

        res.send({ status: "ok", message: "Usuario loggeado", redirect: "/index" });
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

app.listen(PORT, () => {
    console.log(`Server corriendo en http://localhost:${PORT}`);
});