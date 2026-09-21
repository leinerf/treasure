import nodemailer from 'nodemailer';
import { GMAIL_ADDRESS, APP_PASSWORD } from '../config.js';
console.log({
    service: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: GMAIL_ADDRESS,
        pass: APP_PASSWORD,
    }
})
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_ADDRESS,
        pass: APP_PASSWORD,
    },
});

export default transporter;