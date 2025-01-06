const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^(\+56\s?9\d{8})$|^(9\d{8})$/.test(phone);

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE || false, 
    auth: {
        user: process.env.MAIL_USER || 'contacto.ryoshisushi@gmail.com',
        pass: process.env.MAIL_PASS || process.env.GOOGLE_APP_PASSWORD,
    },
});

const sendMail = async (req, res) => {
    const { email, name, description,phone } = req.body;
    if (!email || !name) {
        return res.status(400).json({
            message: 'Faltan datos',
            error: true,
        });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({
            message: 'Correo inválido o no proporcionado',
            error: true,
        });
    }
    
    if (!isValidPhone(phone)) {
        return res.status(400).json({
            message: 'Número de teléfono inválido o no proporcionado',
            error: true,
        });
    }
        try {
            const confirmationResult = sendMailWithTemplate('confirmation', email, name, description, phone);
            const adminResult = sendMailWithTemplate('admin', email, name, description, phone);

        if (!confirmationResult || !adminResult) {
            throw new Error('Error al enviar alguno de los correos');
        }

        return res.status(200).json({
            message: 'Correo enviado',
            error: false,
        });
    } catch (error) {
        console.error('Error en sendMail:', error);
        return res.status(500).json({
            message: `Error al enviar el correo: ${error.message}`,
            error: true,
        });
    }
};

const mailSend = async ({ to, subject, templatePath, variables, attachments = [] }) => {
    try {
        const htmlContent = await fs.promises.readFile(templatePath, 'utf-8');
        const replacedHtml = replaceVariables(htmlContent, variables);
        const from = process.env.MAIL_USER || 'contacto.ryoshisushi@gmail.com';

        const mailOptions = {
            from: `Ryoshi Sushi <${from}>`,
            to,
            subject,
            html: replacedHtml,
            attachments,
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`Error al enviar el correo a ${to}:`, error);
        return false;
    }
};

const sendMailWithTemplate = async (type, email, name, description, phone) => {
    let to, subject, templatePath;
    
    if (type === 'confirmation') {
        to = email;
        subject = 'Contacto | Ryoshi Sushi';
        templatePath = path.join(__dirname, '../mail/contact-confirm.html');
    } else if (type === 'admin') {
        to = process.env.MAIL_USER || 'contacto.ryoshisushi@gmail.com';
        subject = 'Nueva Solicitud de Contacto';
        templatePath = path.join(__dirname, '../mail/contact-response-provider.html');
    } else {
        throw new Error('Tipo de correo no válido');
    }

    const attachments = [
        {
            filename: 'logo-ryoshi.png',
            path: path.join(__dirname, '../public/logo-ryoshi.png'),
            cid: 'logo-ryoshi',
        },
    ];

    return await mailSend({
        to,
        subject,
        templatePath,
        variables: { name, email, description, phone },
        attachments,
    });
};

const replaceVariables = (htmlContent, variables) => {
    const {name, email, description,phone} = variables;
    return htmlContent
        .replace('{{name}}', name)
        .replace('{{mail}}', email)
        .replace('{{description}}', description || 'No hay descripción proporcionada')
        .replace('{{phone}}', phone || 'No hay teléfono proporcionado');
};

module.exports = { sendMail };
