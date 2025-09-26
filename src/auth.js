const auth = {
  login(token, user) {
    localStorage.setItem('accessToken', token);
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
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) : null;
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  }
};

export { auth };