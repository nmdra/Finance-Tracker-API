import nodemailer from 'nodemailer';

export const sendEmail = async (body) => {
    try {
        // Looking to send emails in production? Check out our Email API/SMTP product!
        var transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_AUTH_USER,
                pass: process.env.EMAIL_AUTH_PASS,
            },
        });

        await transporter.sendMail(body);

        return {
            success: true,
            message: 'Email sent successfully via Mailtrap',
        };
    } catch (err) {
        return {
            success: false,
            message: `Error sending email: ${err.message}`,
        };
    }
};
