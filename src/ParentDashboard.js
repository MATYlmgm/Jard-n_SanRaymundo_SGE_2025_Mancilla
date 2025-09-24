import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from './auth';
import './css/ParentDashboard.css';

const ParentDashboard = () => {
    const [parents, setParents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCui, setEditingCui] = useState(null);
    const navigate = useNavigate();
    
    const role = auth.getRole();
    const backPath = role === 1 ? '/secretary/dashboard' : '/coordinator/dashboard';

    const initialFormState = {
        cui_padre: '',
        nombre_completo: '',
        direccion: '',
        telefono: ''
    };
    const [form, setForm] = useState(initialFormState);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/parents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParents(res.data);
        } catch (error) {
            console.error("Error al cargar los padres", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);
    
    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');
        const method = editingCui ? 'put' : 'post';
        const url = `${process.env.REACT_APP_API_URL}/api/parents${editingCui ? `/${editingCui}` : ''}`;
        
        try {
            await axios[method](url, form, { headers: { Authorization: `Bearer ${token}` } });
            alert(`Encargado ${editingCui ? 'actualizado' : 'registrado'} con éxito.`);
            handleCancelEdit();
            fetchData();
        } catch (error) {
            alert("Error al guardar el encargado.");
        }
    };

    const handleEditClick = (parent) => {
        setEditingCui(parent.cui_padre);
        setForm(parent);
        window.scrollTo(0, 0);
    };
    
    const handleCancelEdit = () => {
        setEditingCui(null);
        setForm(initialFormState);
    };

    const handleToggleStatus = async (parent) => {
        const isActivating = parent.estado_id !== 1;
        const action = isActivating ? 'activate' : 'deactivate';
        if (!window.confirm(`¿Estás seguro de que quieres ${isActivating ? 'reactivar' : 'desactivar'} a ${parent.nombre_completo}?`)) return;
        
        const token = localStorage.getItem('accessToken');
        const url = `${process.env.REACT_APP_API_URL}/api/parents/${action}/${parent.cui_padre}`;
        
        try {
            await axios.put(url, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (error) {
            alert(`Error al ${action} al encargado.`);
        }
    };

    if (loading) return <div>Cargando...</div>;

    return (
        <div className="pd-page">
            <div className="pd-container">
                <header className="pd-header">
                    <h1>Gestionar Encargados</h1>
                    <p>Registra, modifica y administra a los padres de familia.</p>
                </header>
                <button className="pd-btn-volver" onClick={() => navigate(backPath)}>
                    ⬅ Volver al Panel
                </button>
                <div className="pd-grid">
                    <div className="pd-card">
                        <h2>{editingCui ? 'Editando Encargado' : 'Registrar Nuevo Encargado'}</h2>
                        <form onSubmit={handleSubmit}>
                            <input name="cui_padre" value={form.cui_padre} onChange={handleChange} placeholder="CUI del Encargado" required disabled={editingCui} />
                            <input name="nombre_completo" value={form.nombre_completo} onChange={handleChange} placeholder="Nombre Completo" required />
                            <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" />
                            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono (con código de país, ej: 502...)" />
                            <div className="pd-form-actions">
                                {editingCui && <button type="button" onClick={handleCancelEdit}>Cancelar Edición</button>}
                                <button type="submit">{editingCui ? 'Guardar Cambios' : 'Registrar Encargado'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="pd-card pd-card--list">
                        <h2>Encargados Registrados</h2>
                        <div className="pd-list">
                            {parents.map(parent => (
                                <div key={parent.cui_padre} className="pd-list-item">
                                    <div>
                                        <strong>{parent.nombre_completo}</strong>
                                        <small>CUI: {parent.cui_padre} | Tel: {parent.telefono || 'N/A'}</small>
                                    </div>
                                    <div className="pd-item-actions">
                                        <div className={`pd-badge ${parent.estado_id === 1 ? 'active' : 'inactive'}`}>
                                            {parent.estado_id === 1 ? 'Activo' : 'Inactivo'}
                                        </div>
                                        <button onClick={() => handleEditClick(parent)}>✏️</button>
                                        <button onClick={() => handleToggleStatus(parent)}>
                                            {parent.estado_id === 1 ? '🗑️' : '⬆️'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;