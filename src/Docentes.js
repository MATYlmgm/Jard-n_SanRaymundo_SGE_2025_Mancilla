import React from "react";
import { Routes, Route } from "react-router-dom";
import DocentesDashboard from "./DocentesDashboard";
import RegistroDocente from "./RegistroDocente";
import EditarDocente from "./EditarDocente"; 

export default function Docentes() {
  return (
    <Routes>
      <Route index element={<DocentesDashboard />} />
      <Route path="registro" element={<RegistroDocente />} />
      <Route path="editar/:cui" element={<EditarDocente />} /> {}
    </Routes>
  );
}