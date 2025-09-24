import React from "react";
import { Routes, Route } from "react-router-dom";
import AlumnosDashboard from "./AlumnosDashboard";
import StudentRegister from "./StudentRegister";
import EditarAlumno from "./EditarAlumno";

export default function Alumnos() {
  return (
    <Routes>
      <Route index element={<AlumnosDashboard />} />
      <Route path="registro" element={<StudentRegister />} />
      <Route path="editar/:cui" element={<EditarAlumno />} />
    </Routes>
  );
}