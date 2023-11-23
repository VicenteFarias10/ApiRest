const nodemailer = require('nodemailer');
const User = require('./models/User');

// Obtener el transporter para un rol específico
const getTransporter = async (role) => {
  try {
    const user = await User.findOne({ role });

    if (!user) {
      throw new Error(`Usuario con rol ${role} no encontrado para obtener credenciales de correo electrónico`);
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'vicentefariasr1@gmail.com',
          pass: 'rslbjkgghicsfxfg' // La contraseña de aplicación generada
        }
      });
      

    return transporter;
  } catch (error) {
    console.error('Error al obtener transporter:', error.message);
    throw error;
  }
};

// Función para enviar correos de solicitud
const enviarCorreoSolicitud = async (transporter, viaje, pasajero, conductor) => {
  try {
    // Lógica para construir el contenido del correo electrónico
    const correoOptions = {
      from: 'vicentefariasr1@gmail.com', // Reemplaza con tu dirección de correo electrónico
      to: pasajero.email, // Reemplaza con el correo del pasajero
      subject: 'Solicitud de Viaje Confirmada',
      text: `Hola ${pasajero.username},\n\nTu solicitud de viaje ha sido confirmada. Detalles del viaje:\nOrigen: ${viaje.origen}\n\nOrigen: ${viaje.origen}\nDestino: ${viaje.destino}\nPrecio: ${viaje.precio}\n\nGracias por usar nuestro servicio.`,
    };

    // Enviar el correo electrónico al pasajero
    await transporter.sendMail(correoOptions);

    // Repite el proceso para enviar un correo al conductor si es necesario
    // Puedes personalizar el contenido del correo según tus necesidades
    if (conductor) {
      const correoConductorOptions = {
        from: 'vicentefariasr1@gmail.com',
        to: conductor.email,
        subject: 'Nueva Solicitud de Viaje',
        text: `Hola ${conductor.username},\n\nHas recibido una nueva solicitud de viaje. Detalles del viaje:\nOrigen: ${viaje.origen}\nDestino: ${viaje.destino}\nPrecio: ${viaje.precio}\n\nRevisa tu cuenta para más detalles.`,
      };

      // Enviar el correo electrónico al conductor
      await transporter.sendMail(correoConductorOptions);
    }
  } catch (error) {
    console.error('Error al enviar el correo electrónico:', error.message);
    throw error;
  }
};

module.exports = { getTransporter, enviarCorreoSolicitud };
