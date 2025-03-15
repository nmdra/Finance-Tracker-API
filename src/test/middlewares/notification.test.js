import { expect } from 'chai';
import sinon from 'sinon';
import { createNotification } from '../../middleware/notification.js';
import { Notification } from '../../models/notificationModel.js';
import { logger } from '../../middleware/logger.js';

describe('createNotification', () => {
    let saveStub;
    let loggerInfoStub;
    let loggerErrorStub;

    before(() => {
        // Stub the Notification model's save method
        saveStub = sinon.stub(Notification.prototype, 'save').resolves();

        // Stub the logger methods
        loggerInfoStub = sinon.stub(logger, 'info');
        loggerErrorStub = sinon.stub(logger, 'error');
    });

    after(() => {
        sinon.restore(); // Restore all stubs
    });

    it('should create a notification successfully', async () => {
        const userId = 'user123';
        const type = 'INFO';
        const message = 'New budget update available';

        await createNotification(userId, type, message);

        expect(saveStub.calledOnce).to.be.true;
        expect(
            loggerInfoStub.calledOnceWith(
                `Notification created for user ${userId}: ${message}`
            )
        ).to.be.true;
    });

    it('should log an error if notification creation fails', async () => {
        saveStub.rejects(new Error('Database error'));

        await createNotification('user123', 'ALERT', 'Something went wrong');

        expect(loggerErrorStub.calledOnce).to.be.true;
        expect(loggerErrorStub.args[0][0]).to.include(
            'Failed to create notification: Database error'
        );
    });
});
