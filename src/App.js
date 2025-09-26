import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importa todos tus componentes
import Login from "./Login";
import PanelRoles from "./PanelRoles";
import ProtectedRoute from "./ProtectedRoute";
import CoordinatorDashboard from "./CoordinatorDashboard";
import SecretaryDashboard from "./SecretaryDashboard";
import TeacherDashboard from "./TeacherDashboard";
import Alumnos from "./Alumnos";
import Docentes from "./Docentes";
import Cursos from "./Cursos";
import AsignarCursos from "./AsignarCursos";
import ParentRegister from "./ParentRegister";
import SecretaryPayments from "./SecretaryPayments";
import SeleccionarDocente from "./SeleccionarDocente";
import ParentDashboard from './ParentDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- RUTAS PÚBLICAS --- */}
        {/* 1. La ruta raíz te lleva directamente al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* 2. La ruta de login es pública y no está protegida */}
        <Route path="/login" element={<Login />} />

        {/* --- RUTAS PROTEGIDAS (Requieren inicio de sesión) --- */}
        
        {/* El panel que decide a qué dashboard redirigir */}
        <Route path="/panel" element={<ProtectedRoute><PanelRoles/></ProtectedRoute>} />
        
        {/* Dashboards Principales por Rol */}
        <Route path="/coordinator/dashboard" element={<ProtectedRoute><CoordinatorDashboard/></ProtectedRoute>} />
        <Route path="/secretary/dashboard" element={<ProtectedRoute><SecretaryDashboard /></ProtectedRoute>} />
        <Route path="/teacher" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        
        {/* Módulos de Gestión (accesibles por multiples roles) */}
        <Route path="/alumnos/*" element={<ProtectedRoute><Alumnos/></ProtectedRoute>} />
        <Route path="/docentes/*" element={<ProtectedRoute><Docentes/></ProtectedRoute>} />
        <Route path="/gestionar-cursos/*" element={<ProtectedRoute><Cursos/></ProtectedRoute>} />
        <Route path="/asignar-cursos" element={<ProtectedRoute><AsignarCursos/></ProtectedRoute>} />
        <Route path="/parent-register" element={<ProtectedRoute><ParentRegister/></ProtectedRoute>} />
        <Route path="/gestionar-encargados" element={<ProtectedRoute allowedRoles={[1, 2]}><ParentDashboard /></ProtectedRoute>} />

        {/* Vistas Específicas */}
        <Route path="/panel/secretaria" element={<ProtectedRoute><SecretaryPayments/></ProtectedRoute>} />
        <Route path="/seleccionar-docente" element={<ProtectedRoute><SeleccionarDocente/></ProtectedRoute>} />
        <Route path="/ver-docente/:cui" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
        
        {/* Ruta que redirige al login si no se encuentra la página */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

