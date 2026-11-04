import nodemailer from 'nodemailer';
import { config } from '../config.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.gmail_address,
        pass: config.gmail_app_password,
    },
});

export default transporter;