import React from "react";
import { Routes, Route } from "react-router-dom";
import GestionCursos from "./GestionCursos";

export default function Cursos() {
  return (
    <Routes>
      <Route index element={<GestionCursos />} />
      {}
    </Routes>
  );
}