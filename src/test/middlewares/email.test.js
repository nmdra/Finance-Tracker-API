import { expect } from 'chai';
import sinon from 'sinon';
import nodemailer from 'nodemailer';
import { sendEmail } from '../../middleware/email.js';

describe('sendEmail', () => {
    let sendMailStub;
    let createTransportStub;

    before(() => {
        // Stub nodemailer.createTransport
        createTransportStub = sinon
            .stub(nodemailer, 'createTransport')
            .returns({
                sendMail: sinon.stub().resolves(),
            });

        sendMailStub = createTransportStub().sendMail;
    });

    after(() => {
        sinon.restore(); // Restore all stubs
    });

    it('should send an email successfully', async () => {
        const emailBody = {
            from: 'test@example.com',
            to: 'user@example.com',
            subject: 'Test Email',
            text: 'Hello, this is a test email!',
        };

        const response = await sendEmail(emailBody);

        expect(sendMailStub.calledOnce).to.be.true;
        expect(sendMailStub.calledWith(emailBody)).to.be.true;
        expect(response.success).to.be.true;
        expect(response.message).to.equal(
            'Email sent successfully via Mailtrap'
        );
    });

    it('should return an error when email sending fails', async () => {
        sendMailStub.rejects(new Error('SMTP Connection Failed'));

        const response = await sendEmail({
            from: 'test@example.com',
            to: 'user@example.com',
            subject: 'Failure Test',
            text: 'This should fail',
        });

        expect(response.success).to.be.false;
        expect(response.message).to.include(
            'Error sending email: SMTP Connection Failed'
        );
    });
});
