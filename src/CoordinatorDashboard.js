import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./auth"; 

// Estilos integrados para el diseño del panel
const CoordinatorDashboardStyles = () => (
    <style>{`
      .cdb-page { min-height: 100vh; background: #f1f5f9; padding: 24px; font-family: sans-serif; }
      .cdb-container { max-width: 1200px; margin: 0 auto; }
      .cdb-header {
        background: linear-gradient(135deg, #014BA0 0%, #155e75 100%);
        color: white; padding: 28px; border-radius: 24px; text-align: center;
        margin-bottom: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.1);
      }
      .cdb-header h1 { margin: 0; font-size: 24px; letter-spacing: .5px; }
      .cdb-header p { margin: 4px 0 0; opacity: 0.9; }
      .cdb-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
      .cdb-card {
        background: white; border-radius: 16px; padding: 24px;
        text-align: center; cursor: pointer; transition: all 0.2s ease;
        border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,.05);
      }
      .cdb-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,.1); }
      .cdb-icon { font-size: 36px; margin-bottom: 12px; }
      .cdb-title { font-weight: 700; font-size: 16px; color: #1e293b; margin: 0 0 4px; }
      .cdb-desc { font-size: 14px; color: #64748b; margin: 0; }
      .cdb-actions { display: flex; justify-content: center; margin-top: 32px; }
      .cdb-btn-logout {
        background: #FF3936; color: white; border: none; padding: 12px 24px;
        border-radius: 12px; font-weight: 700; cursor: pointer;
      }
    `}</style>
);

export default function CoordinatorDashboard() {
    const navigate = useNavigate();

    // Opciones del menú con las rutas a los componentes que SÍ existen
    const menuOptions = [
        { key: 'reg_docente', title: 'Gestionar Docentes', desc: 'Registrar y modificar personal docente.', icon: '👩‍🏫', path: '/docentes' },
        { key: 'reg_alumno', title: 'Gestionar Alumnos', desc: 'Inscribir nuevos estudiantes y asignarles padres.', icon: '📚', path: '/alumnos' },
        { key: 'gest_padre', title: 'Gestionar Encargados', desc: 'Añadir y administrar padres o encargados.', icon: '👨‍👩‍👧', path: '/gestionar-encargados' },
        { key: 'gest_cursos', title: 'Gestionar Cursos', desc: 'Crear y eliminar las materias del pénsum.', icon: '📜', path: '/gestionar-cursos' },
        { key: 'asignar_cursos', title: 'Asignar Cursos/Secciones', desc: 'Asignar materias y grados a los docentes.', icon: '✏️', path: '/asignar-cursos' },
        { key: 'ver_docentes', title: 'Panel de Docentes', desc: 'Ver el control de tareas de los maestros.', icon: '👨‍🏫', path: '/seleccionar-docente' },
        { key: 'ver_secretaria', title: 'Panel de Secretaría', desc: 'Supervisar el estado de pagos.', icon: '📋', path: '/panel/secretaria' },
    ];
    
    const handleNavigation = (path) => {
        if (path === '#') {
            alert('¡Funcionalidad en construcción!');
        } else {
            navigate(path);
        }
    };

    const logout = () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            auth.logout();
            navigate("/login", { replace: true });
        }
    };

    return (
        <>
            <CoordinatorDashboardStyles />
            <div className="cdb-page">
                <div className="cdb-container">
                    <header className="cdb-header">
                        <h1>Panel de Coordinación</h1>
                        <p>Gestión y supervisión del sistema académico</p>
                    </header>

                    <main className="cdb-grid">
                        {menuOptions.map(opt => (
                            <div key={opt.key} className="cdb-card" onClick={() => handleNavigation(opt.path)}>
                                <div className="cdb-icon">{opt.icon}</div>
                                <h3 className="cdb-title">{opt.title}</h3>
                                <p className="cdb-desc">{opt.desc}</p>
                            </div>
                        ))}
                    </main>

                     <section className="cdb-actions">
                        <button className="cdb-btn-logout" onClick={logout}>🚪 Cerrar Sesión</button>
                    </section>
                </div>
            </div>
        </>
    );
}