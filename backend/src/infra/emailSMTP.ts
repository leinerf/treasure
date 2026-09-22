import nodemailer from 'nodemailer';
import { GMAIL_ADDRESS, APP_PASSWORD } from '../config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: GMAIL_ADDRESS,
        pass: APP_PASSWORD,
    },
});

export default transporter;