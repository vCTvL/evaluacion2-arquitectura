document.addEventListener("DOMContentLoaded", async () => {
    // Verificar y obtener información del usuario
    function getUserInfo() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return null;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) {
            console.error('Error al decodificar el token:', e);
            return null;
        }
    }

    // Mostrar información del usuario
    const userInfo = getUserInfo();
    if (userInfo) {
        const userDiv = document.createElement('div');
        userDiv.style.position = 'absolute';
        userDiv.style.top = '20px';
        userDiv.style.right = '20px';
        userDiv.style.padding = '10px';
        userDiv.style.background = '#fff';
        userDiv.style.borderRadius = '5px';
        userDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        userDiv.innerHTML = `<strong>Usuario:</strong> ${userInfo.nombre}`;
        document.body.appendChild(userDiv);
    }

    const container = document.getElementById('dynamic-form-container');
    let especialistas = [];
    let especialidades = [];

    // Obtener especialistas y especialidades del backend
    try {
        const res = await fetch("/api/especialistas");
        const data = await res.json();
        especialistas = data.especialistas || [];
        especialidades = data.especialidades || [];
    } catch (e) {
        especialistas = [];
        especialidades = [];
    }

    // Función para generar opciones de select
    function options(arr) {
        return arr.map(val => `<option value="${val}">${val}</option>`).join('');
    }

    // Formularios dinámicos con selects vacíos (se rellenan luego)
    function getFormAgendar() {
        return `
        <form class="card" style="margin-bottom:20px;">
            <h3>Agendar Hora</h3>
            <label>Especialidad:
                <select id="select-especialidad" required>
                    <option value="">Seleccione</option>
                    ${options(especialidades)}
                </select>
            </label>
            <label>Especialista:
                <select id="select-especialista" required>
                    <option value="">Seleccione</option>
                    ${options(especialistas)}
                </select>        
            </label>
            <label>Fecha: <input type="date" required></label>
            <label>Hora: <input type="time" required></label>
            <button type="submit" class="btn">Agendar</button>
        </form>
        `;
    }
    function getFormCancelar() {
        return `
        <form class="card" style="margin-bottom:20px;">
            <h3>Cancelar Hora</h3>
            <label>ID de la cita: <input type="text" required></label>
            <button type="submit" class="btn">Cancelar</button>
        </form>
        `;
    }
    async function getFormHorarios() {
        try {
            const response = await fetch('/api/mis-citas', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();

            if (!response.ok) {
                return `
                <div class="card" style="margin-bottom:20px;">
                    <h3>Mis Horarios</h3>
                    <p>Error al cargar las citas: ${data.message}</p>
                </div>`;
            }

            if (data.citas.length === 0) {
                return `
                <div class="card" style="margin-bottom:20px;">
                    <h3>Mis Horarios</h3>
                    <p>No tienes citas programadas.</p>
                </div>`;
            }

            const citasHTML = data.citas.map(cita => {
                // Formatear hora (convertir de número a formato HH:MM)
                const horaStr = cita.hora.toString().padStart(4, '0');
                const horaFormateada = `${horaStr.slice(0, 2)}:${horaStr.slice(2)}`;
                
                // Formatear fecha
                const fecha = new Date(cita.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                return `
                    <li>
                        <strong>ID Cita:</strong> ${cita.id}<br>
                        <strong>Fecha:</strong> ${fecha}<br>
                        <strong>Hora:</strong> ${horaFormateada}<br>
                        <strong>Especialista:</strong> ${cita.nombre_especialista}<br>
                        <hr style="margin: 10px 0;">
                    </li>`;
            }).join('');

            return `
            <div class="card" style="margin-bottom:20px;">
                <h3>Mis Horarios</h3>
                <ul style="list-style: none; padding: 0;">
                    ${citasHTML}
                </ul>
            </div>`;
        } catch (error) {
            console.error('Error al obtener horarios:', error);
            return `
            <div class="card" style="margin-bottom:20px;">
                <h3>Mis Horarios</h3>
                <p>Error al cargar las citas. Por favor, intenta más tarde.</p>
            </div>`;
        }
    }

    // Botones de la barra lateral
    const btnAgendar = document.getElementById('nav-agendar');
    const btnCancelar = document.getElementById('nav-cancelar');
    const btnHorarios = document.getElementById('nav-horarios');

    if (btnAgendar) {
        btnAgendar.addEventListener('click', (e) => {
            e.preventDefault();
            container.innerHTML = getFormAgendar();

            // Esperar a que el formulario esté en el DOM
            setTimeout(() => {
                const form = container.querySelector('form');
                if (form) {
                    form.addEventListener('submit', async function(ev) {
                        ev.preventDefault();
                        // Obtener valores del formulario
                        const especialidad = form.querySelector('#select-especialidad').value;
                        const especialista = form.querySelector('#select-especialista').value;
                        const fecha = form.querySelector('input[type="date"]').value;
                        const hora = form.querySelector('input[type="time"]').value;

                        try {
                            // Enviar datos al backend
                            const response = await fetch('/api/citas', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({
                                    especialidad,
                                    especialista,
                                    fecha,
                                    hora
                                })
                            });

                            const data = await response.json();

                            // Crear el modal/pop-up
                            const modal = document.createElement('div');
                            modal.style.position = 'fixed';
                            modal.style.top = '0';
                            modal.style.left = '0';
                            modal.style.width = '100vw';
                            modal.style.height = '100vh';
                            modal.style.background = 'rgba(0,0,0,0.4)';
                            modal.style.display = 'flex';
                            modal.style.alignItems = 'center';
                            modal.style.justifyContent = 'center';
                            modal.style.zIndex = '9999';

                            modal.innerHTML = `
                                <div style="
                                    background: white;
                                    padding: 30px 40px;
                                    border-radius: 10px;
                                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                                    min-width: 300px;
                                    max-width: 90vw;
                                    text-align: center;
                                ">
                                    <h2>${response.ok ? 'Cita Agendada' : 'Error'}</h2>
                                    <p>${data.message}</p>
                                    <p><strong>Especialidad:</strong> ${especialidad}</p>
                                    <p><strong>Especialista:</strong> ${especialista}</p>
                                    <p><strong>Fecha:</strong> ${fecha}</p>
                                    <p><strong>Hora:</strong> ${hora}</p>
                                    <button id="cerrar-modal" class="btn" style="margin-top:20px;">Cerrar</button>
                                </div>
                            `;

                            document.body.appendChild(modal);

                            document.getElementById('cerrar-modal').onclick = () => {
                                document.body.removeChild(modal);
                                if (response.ok) {
                                    // Recargar la página o actualizar la lista de citas
                                    window.location.reload();
                                }
                            };
                        } catch (error) {
                            console.error('Error al agendar cita:', error);
                            alert('Error al agendar la cita');
                        }
                    });
                }
            }, 0);
        });
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', (e) => {
            e.preventDefault();
            container.innerHTML = getFormCancelar();

            // Agregar manejador al formulario de cancelación
            const form = container.querySelector('form');
            if (form) {
                form.addEventListener('submit', async function(ev) {
                    ev.preventDefault();
                    const citaId = this.querySelector('input').value;

                    try {
                        const response = await fetch(`/api/citas/${citaId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                        });

                        const data = await response.json();

                        // Crear modal para mostrar resultado
                        const modal = document.createElement('div');
                        modal.style.position = 'fixed';
                        modal.style.top = '0';
                        modal.style.left = '0';
                        modal.style.width = '100vw';
                        modal.style.height = '100vh';
                        modal.style.background = 'rgba(0,0,0,0.4)';
                        modal.style.display = 'flex';
                        modal.style.alignItems = 'center';
                        modal.style.justifyContent = 'center';
                        modal.style.zIndex = '9999';

                        modal.innerHTML = `
                            <div style="
                                background: white;
                                padding: 30px 40px;
                                border-radius: 10px;
                                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                                min-width: 300px;
                                max-width: 90vw;
                                text-align: center;
                            ">
                                <h2>${response.ok ? 'Éxito' : 'Error'}</h2>
                                <p>${data.message}</p>
                                <button id="cerrar-modal" class="btn" style="margin-top:20px;">Cerrar</button>
                            </div>
                        `;

                        document.body.appendChild(modal);

                        document.getElementById('cerrar-modal').onclick = () => {
                            document.body.removeChild(modal);
                            if (response.ok) {
                                window.location.reload();
                            }
                        };
                    } catch (error) {
                        console.error('Error al cancelar cita:', error);
                        alert('Error al cancelar la cita');
                    }
                });
            }
        });
    }
    if (btnHorarios) {
        btnHorarios.addEventListener('click', async (e) => {
            e.preventDefault();
            container.innerHTML = await getFormHorarios();
        });
    }

    // Agregar manejador para el botón de cerrar sesión
    const btnLogout = document.querySelector('.logout a');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            // Eliminar el token del localStorage
            localStorage.removeItem('token');
            // Redireccionar al login
            window.location.href = '/';
        });
    }

    // Agregar manejador para el botón de información de usuario
    const btnUserInfo = document.getElementById('btn-user-info');
    if (btnUserInfo) {
        btnUserInfo.addEventListener('click', () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // Decodificar el token
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Crear el modal
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '20px';
                modal.style.right = '20px';
                modal.style.padding = '20px';
                modal.style.background = 'white';
                modal.style.borderRadius = '8px';
                modal.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                modal.style.zIndex = '9999';
                modal.style.transition = 'opacity 0.3s ease';

                modal.innerHTML = `
                    <h3 style="margin-bottom:10px;color:#2a5298;">Información de Usuario</h3>
                    <p><strong>ID:</strong> ${payload.userId}</p>
                    <p><strong>Nombre:</strong> ${payload.nombre}</p>
                    <p><strong>Email:</strong> ${payload.email}</p>
                `;

                document.body.appendChild(modal);

                // Eliminar el modal después de 3 segundos
                setTimeout(() => {
                    modal.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(modal);
                    }, 300);
                }, 3000);
            } catch (e) {
                console.error('Error al mostrar información del usuario:', e);
            }
        });
    }
});

document.getElementById('nav-agendar').click();

