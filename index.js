import express from 'express';
import { fileURLToPath } from 'url';
import path from "path";
import jwt from 'jsonwebtoken'; // Necesitarás instalar: npm install jsonwebtoken
import nodemailer from 'nodemailer'; // nuevo: npm install nodemailer
import pool from './public/db.js'; // Importa el pool correctamente
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_aqui';

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
            JWT_SECRET,
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

// Configurar transportador SMTP (usar variables de entorno)
// REEMPLAZADO: ahora se crea dinámicamente con getTransporter()
async function getTransporter() {
	// Valores desde .env
	const host = process.env.SMTP_HOST || '';
	const port = parseInt(process.env.SMTP_PORT, 10) || 587;
	const secure = process.env.SMTP_SECURE === 'true' || false;
	const user = process.env.SMTP_USER || '';
	const pass = process.env.SMTP_PASS || '';

	// Si no hay host configurado o es un placeholder, usar Ethereal (solo para desarrollo/pruebas)
	if (!host || host.includes('example.com') || host.includes('tu-proveedor')) {
		console.warn('SMTP no configurado o placeholder detectado. Creando cuenta Ethereal de prueba...');
		const testAccount = await nodemailer.createTestAccount();
		const transport = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: { user: testAccount.user, pass: testAccount.pass }
		});
		console.log('Usando Ethereal SMTP (pruebas). Usuario Ethereal:', testAccount.user);
		return transport;
	}

	// Si se definió host pero faltan credenciales, hacemos fallback y avisamos
	if (host && (!user || !pass)) {
		console.warn('SMTP host definido pero faltan SMTP_USER/SMTP_PASS. Usando Ethereal de prueba en su lugar.');
		const testAccount = await nodemailer.createTestAccount();
		const transport = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: { user: testAccount.user, pass: testAccount.pass }
		});
		console.log('Usando Ethereal SMTP (pruebas). Usuario Ethereal:', testAccount.user);
		return transport;
	}

	// Transportador real (usando variables de entorno)
	const transport = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user, pass }
	});

	console.log(`Usando SMTP real: host=${host} port=${port} secure=${secure}`);
	return transport;
}

// Nuevo endpoint para guardar citas
app.post('/api/citas', async (req, res) => {
    const { especialista, especialidad, fecha, hora } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: "Error", message: "No autorizado" });
    }

    try {
        // Decodificar el token para obtener la info del usuario
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Obtener el ID del especialista
        const [especialistaData] = await pool.query(
            'SELECT id FROM especialistas WHERE nombre = ?', 
            [especialista]
        );

        if (especialistaData.length === 0) {
            return res.status(400).json({ status: "Error", message: "Especialista no encontrado" });
        }

        // Preparar formatos
        const horaStored = typeof hora === 'string' ? hora.replace(':', '') : hora;
        // Insertar la cita
        const [result] = await pool.query(
            'INSERT INTO citas (id_especialista, id_usuario, nombre_usuario, nombre_especialista, fecha, hora) VALUES (?, ?, ?, ?, ?, ?)',
            [
                especialistaData[0].id,
                decoded.userId,
                decoded.nombre,
                especialista,
                fecha,
                horaStored
            ]
        );

        // Enviar email de confirmación (no bloqueante para la respuesta)
        (async () => {
            try {
                const transporter = await getTransporter();

                const horaDisplay = (typeof hora === 'string' && hora.includes(':')) 
                    ? hora 
                    : horaStored.toString().padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2');
                const fechaDisplay = new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
                const mailOptions = {
                    from: process.env.SMTP_FROM || '"Clínica Salud Integral" <no-reply@clinica.com>',
                    to: decoded.email,
                    subject: 'Confirmación de cita - Clínica Salud Integral',
                    html: `
                        <p>Hola ${decoded.nombre},</p>
                        <p>Tu cita ha sido agendada con <strong>${especialista}</strong> (${especialidad || '—'})</p>
                        <p><strong>Fecha:</strong> ${fechaDisplay}<br><strong>Hora:</strong> ${horaDisplay}</p>
                        <p><strong>ID de cita:</strong> ${result.insertId}</p>
                        <p>Gracias por confiar en nosotros.</p>
                    `
                };

                const info = await transporter.sendMail(mailOptions);
                console.log('Email de confirmación enviado a', decoded.email, 'messageId:', info.messageId);

                // Si usamos Ethereal, mostramos la URL de preview en consola
                const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
                if (preview) {
                    console.log('Preview URL (Ethereal):', preview);
                }
            } catch (mailErr) {
                console.error('Error enviando email de confirmación:', mailErr);
            }
        })();

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
        const decoded = jwt.verify(token, JWT_SECRET);
        
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
        const decoded = jwt.verify(token, JWT_SECRET);
        
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

// Nuevo endpoint: horarios disponibles de un especialista
app.get('/api/horarios-especialista', async (req, res) => {
	// Query param: ?especialista=Nombre%20Completo
	const especialista = req.query.especialista;
	if (!especialista) {
		return res.status(400).json({ status: "Error", message: "Falta parámetro 'especialista'" });
	}

	try {
		// Obtener id del especialista
		const [specRows] = await pool.query('SELECT id FROM especialistas WHERE nombre = ?', [especialista]);
		if (specRows.length === 0) {
			return res.status(404).json({ status: "Error", message: "Especialista no encontrado" });
		}
		const specId = specRows[0].id;

		// Generar slots aleatorios para próximos 7 días
		const posiblesHoras = ['09:00','10:00','11:30','14:00','15:00','16:30'];
		const slots = [];
		const today = new Date();
		for (let d = 0; d < 7; d++) {
			const date = new Date(today);
			date.setDate(today.getDate() + d);
			const fechaStr = date.toISOString().slice(0,10); // YYYY-MM-DD

			// elegir aleatoriamente entre 1 y 3 horas para ese día
			const n = Math.floor(Math.random() * 3) + 1;
			// mezclar y tomar n primeros
			const shuffled = posiblesHoras.slice().sort(() => Math.random() - 0.5).slice(0, n);
			shuffled.forEach(h => {
				slots.push({ fecha: fechaStr, hora: h });
			});
		}

		// Obtener citas ya reservadas para ese especialista en el rango generado
		const startDate = slots.length ? slots[0].fecha : today.toISOString().slice(0,10);
		const endDate = slots.length ? slots[slots.length - 1].fecha : startDate;
		const [takenRows] = await pool.query(
			'SELECT fecha, hora FROM citas WHERE id_especialista = ? AND fecha BETWEEN ? AND ?',
			[specId, startDate, endDate]
		);

		// Construir conjunto de horarios ocupados "YYYY-MM-DD|HHMM"
		const takenSet = new Set(takenRows.map(r => {
			const horaNum = String(r.hora).padStart(4, '0'); // r.hora es int almacenado sin ':'
			return `${r.fecha}|${horaNum}`;
		}));

		// Filtrar slots ocupados
		const available = slots.filter(s => {
			const key = `${s.fecha}|${s.hora.replace(':','')}`;
			return !takenSet.has(key);
		});

		// Ordenar por fecha y hora
		available.sort((a,b) => {
			if (a.fecha === b.fecha) return a.hora.localeCompare(b.hora);
			return a.fecha.localeCompare(b.fecha);
		});

		return res.json({ status: "ok", slots: available });
	} catch (err) {
		console.error('Error al obtener horarios del especialista:', err);
		return res.status(500).json({ status: "Error", message: "Error al obtener horarios" });
	}
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});