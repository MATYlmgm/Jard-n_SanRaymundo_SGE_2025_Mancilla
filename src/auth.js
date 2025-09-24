// src/auth.js

const auth = {
  login(token, user) {
    localStorage.setItem('accessToken', token);
    // --- CORRECCIÓN CLAVE AQUÍ ---
    // Guardamos el objeto 'user' completo como una cadena de texto JSON.
    // Antes, intentaba guardar [object Object], lo que no funciona.
    localStorage.setItem('user', JSON.stringify(user)); 
  },

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  isLogged() {
    return !!localStorage.getItem('accessToken');
  },

  getUser() {
    // Leemos la cadena de texto y la convertimos de nuevo a un objeto.
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }
};

export { auth };