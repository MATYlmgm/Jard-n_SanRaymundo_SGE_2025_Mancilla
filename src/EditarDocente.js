import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from 'axios';
import "./css/EditarDocente.css";

export default function EditarDocente() {
    const { cui } = useParams();
    const [form, setForm] = useState({
        cui_docente: cui,
        nombre_completo: "",
        email: "",
        telefono: "",
        estado_id: "1",
        username: "",
        password: "",
    });
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDocente = async () => {
            const token = localStorage.getItem('accessToken');
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/teachers/${cui}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setForm({ ...res.data, password: "", estado_id: String(res.data.estado_id) });
            } catch (error) {
                alert('Error al cargar los datos del docente.');
                console.error("Error fetching teacher data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDocente();
    }, [cui]);
    
    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/api/teachers/${cui}`, form, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            alert('¡Docente actualizado con éxito!');
            navigate('/docentes');
        } catch (error) {
            alert('Error al actualizar el docente: ' + (error.response?.data?.msg || "Error inesperado."));
        }
    };

    if (loading) return <div>Cargando datos del docente...</div>;

    return (
        <div className="tedit-container">
            <div className="tedit-card">
                <header className="tedit-header"><h1>Editar Docente</h1></header>
                <form className="tedit-form" onSubmit={onSubmit}>
                    <label className="tedit-label">CUI (no editable)</label>
                    <input className="tedit-input" value={form.cui_docente} disabled />

                    <label className="tedit-label" htmlFor="nombre_completo">Nombre Completo</label>
                    <input id="nombre_completo" name="nombre_completo" className="tedit-input" value={form.nombre_completo} onChange={onChange} required />

                    {/*Campo de Nombre de Usuario */}
                    <label className="tedit-label" htmlFor="username">Nombre de Usuario</label>
                    <input id="username" name="username" className="tedit-input" value={form.username || ''} onChange={onChange} required />

                    {/*campo de Contraseña con el "ojito" */}
                    <label className="tedit-label" htmlFor="password">Nueva Contraseña (dejar en blanco para no cambiar)</label>
                    <div className="tedit-password-wrapper">
                        <input 
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            className="tedit-input"
                            value={form.password}
                            onChange={onChange}
                            placeholder="Ingrese nueva contraseña si desea cambiarla"
                        />
                        <span 
                            className="tedit-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '🔒'}
                        </span>
                    </div>

                    <label className="tedit-label" htmlFor="email">Correo</label>
                    <input id="email" name="email" type="email" className="tedit-input" value={form.email || ''} onChange={onChange} />

                    <label className="tedit-label" htmlFor="telefono">Teléfono</label>
                    <input id="telefono" name="telefono" className="tedit-input" value={form.telefono || ''} onChange={onChange} />

                    <fieldset className="tedit-fieldset">
                        <legend className="tedit-legend">Estado del Docente</legend>
                        <div className="tedit-radio-row">
                            <label className="tedit-radio">
                                <input type="radio" name="estado_id" value="1" checked={form.estado_id === "1"} onChange={onChange} />
                                <span>Activo</span>
                            </label>
                            <label className="tedit-radio">
                                <input type="radio" name="estado_id" value="2" checked={form.estado_id === "2"} onChange={onChange} />
                                <span>Inactivo</span>
                            </label>
                        </div>
                    </fieldset>
                    
                    <div className="tedit-actions">
                        <button className="tedit-save" type="submit">Guardar Cambios</button>
                    </div>
                </form>
                <footer className="tedit-footer">
                    <Link to="/docentes" className="tedit-back">Cancelar y Volver</Link>
                </footer>
            </div>
        </div>
    );
}