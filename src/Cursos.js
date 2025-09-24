import React from "react";
import { Routes, Route } from "react-router-dom";
import GestionCursos from "./GestionCursos";

export default function Cursos() {
  return (
    <Routes>
      <Route index element={<GestionCursos />} />
      {/* Aquí podrías añadir rutas para editar cursos en el futuro */}
    </Routes>
  );
}