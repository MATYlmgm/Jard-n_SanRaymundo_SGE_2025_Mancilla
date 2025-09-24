import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./auth";
import './css/SecretaryDashboard.css'; // Crearemos este CSS a continuación

export default function SecretaryDashboard() {
    const navigate = useNavigate();

    // Opciones específicas para el rol de Secretaría
    const menuOptions = [
        { key: 'reg_alumno', title: 'Gestionar Alumnos', desc: 'Inscribir y modificar datos de estudiantes.', icon: '📚', path: '/alumnos' },
        { key: 'gest_padre', title: 'Gestionar Encargados', desc: 'Añadir y administrar padres o encargados.', icon: '👨‍👩‍👧', path: '/gestionar-encargados' },
        { key: 'ver_pagos', title: 'Panel de Pagos', desc: 'Verificar y gestionar la solvencia de los alumnos.', icon: '📋', path: '/panel/secretaria' },
    ];
    
    const handleNavigation = (path) => {
        navigate(path);
    };

    const logout = () => {
        if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
            auth.logout();
            navigate("/login", { replace: true });
        }
    };

    return (
        <div className="sdb-page pagina-centrada">
            <div className="sdb-page">
                <div className="sdb-container">
                    <header className="sdb-header">
                        <h1>Panel de Secretaría</h1>
                        <p>Gestión de alumnos y control financiero</p>
                    </header>

                    <main className="sdb-grid">
                        {menuOptions.map(opt => (
                            <div key={opt.key} className="sdb-card" onClick={() => handleNavigation(opt.path)}>
                                <div className="sdb-icon">{opt.icon}</div>
                                <h3 className="sdb-title">{opt.title}</h3>
                                <p className="sdb-desc">{opt.desc}</p>
                            </div>
                        ))}
                    </main>

                    <section className="sdb-actions">
                        <button className="sdb-btn-logout" onClick={logout}>🚪 Cerrar Sesión</button>
                    </section>
                </div>
            </div>
        </div>
    );
}