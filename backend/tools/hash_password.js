const bcrypt = require('bcrypt');

const saltRounds = 10; // Rondas de sal estándar
const plainPassword = 'password123';

bcrypt.hash(plainPassword, saltRounds, function(err, hash) {
    if (err) {
        console.error('Error al hashear la contraseña:', err);
        return;
    }
    console.log('Contraseña Plana:', plainPassword);
    console.log('Contraseña Hasheada:', hash);
    console.log('\nCopia la contraseña hasheada y pégala en la columna "password" de tu usuario en pgAdmin.');
});