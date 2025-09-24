import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from './auth';

// Asumimos que los IDs de rol en tu base de datos son:
// 1: Secretaria
// 2: Coordinador
// 3: Docente
// Si son diferentes, solo debes cambiar los números en este componente.

export default function PanelRoles() {
  const navigate = useNavigate();
  const role = auth.getRole();

  useEffect(() => {
    switch (role) {
      case 1: // Rol de Secretaría
        navigate('/secretary/dashboard', { replace: true });
        break;
      case 2: // Rol de Coordinador
        navigate('/coordinator/dashboard', { replace: true });
        break;
      case 3: // Rol de Docente
        navigate('/teacher', { replace: true });
        break;
      default:
        // Si no se reconoce el rol, lo enviamos al login
        auth.logout();
        navigate('/login', { replace: true });
        break;
    }
  }, [navigate, role]);

  // Este componente no muestra nada, solo redirige.
  return null; 
}