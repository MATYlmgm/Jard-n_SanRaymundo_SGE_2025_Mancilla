// en backend/services/whatsappService.js
const twilio = require('twilio');

// Inicializamos el cliente de Twilio con tus credenciales del .env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendMessage = async (to, message) => {
  try {
    // El número de destino debe tener el prefijo "whatsapp:" y el signo "+"
    const recipient = `whatsapp:+${to}`;
    
    // El número "from" es el que guardamos en el .env
    const from = process.env.TWILIO_WHATSAPP_NUMBER;

    await client.messages.create({
      body: message,
      from: from,
      to: recipient
    });

    console.log(`Mensaje de Twilio enviado a ${recipient}`);
    return { success: true };

  } catch (error) {
    console.error("Error al enviar mensaje con Twilio:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendMessage };