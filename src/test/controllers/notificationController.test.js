import { expect } from 'chai';
import sinon from 'sinon';
import {
    getNotifications,
    markAsRead,
    deleteNotification,
} from '../../controllers/notificationController.js';
import { Notification } from '../../models/notificationModel.js';
import { logger } from '../../middleware/logger.js';
import { StatusCodes } from 'http-status-codes';

describe('Notification Controller', () => {
    let req, res, next, loggerStub;

    beforeEach(() => {
        req = {
            user: { id: 'user123', memberType: 'regular' },
            params: { id: 'notif123' },
            query: {},
        };
        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };
        next = sinon.stub();
        loggerStub = sinon.stub(logger, 'info');
        sinon.stub(logger, 'error');
    });

    afterEach(() => {
        sinon.restore(); // Restore all stubs
    });

    describe('getNotifications', () => {
        it('should handle errors', async () => {
            sinon.stub(Notification, 'find').rejects(new Error('DB error'));

            await getNotifications(req, res, next);

            expect(loggerStub.called).to.be.false; // logger.info() should not be called
            expect(next.calledOnce).to.be.true;
        });
    });

    describe('markAsRead', () => {
        it('should mark a notification as read', async () => {
            const mockNotification = {
                _id: 'notif123',
                userId: 'user123',
                isRead: false,
                save: sinon.stub().resolves(),
            };
            sinon.stub(Notification, 'findById').resolves(mockNotification);

            await markAsRead(req, res, next);

            expect(mockNotification.isRead).to.be.true;
            expect(mockNotification.save.calledOnce).to.be.true;
            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
        });

        it('should return 404 if notification is not found', async () => {
            sinon.stub(Notification, 'findById').resolves(null);

            await markAsRead(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });

        it('should return 401 if user is unauthorized', async () => {
            const mockNotification = { _id: 'notif123', userId: 'anotherUser' };
            sinon.stub(Notification, 'findById').resolves(mockNotification);

            await markAsRead(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
        });
    });

    describe('deleteNotification', () => {
        it('should delete a notification', async () => {
            const mockNotification = {
                _id: 'notif123',
                userId: 'user123',
                deleteOne: sinon.stub().resolves(),
            };
            sinon.stub(Notification, 'findById').resolves(mockNotification);

            await deleteNotification(req, res, next);

            expect(mockNotification.deleteOne.calledOnce).to.be.true;
            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWith({
                    message: 'Notification deleted successfully.',
                })
            ).to.be.true;
        });

        it('should return 404 if notification is not found', async () => {
            sinon.stub(Notification, 'findById').resolves(null);

            await deleteNotification(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });

        it('should return 401 if user is unauthorized', async () => {
            const mockNotification = { _id: 'notif123', userId: 'anotherUser' };
            sinon.stub(Notification, 'findById').resolves(mockNotification);

            await deleteNotification(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
        });
    });
});
