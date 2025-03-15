import { expect } from 'chai';
import sinon from 'sinon';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../middleware/logger.js';
import {
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress,
    addSavingsToGoal,
} from '../../controllers/goalController.js';
import { Goal } from '../../models/goalModel.js';

describe('Goal Controller', () => {
    let req, res, next, loggerStub;

    beforeEach(() => {
        req = {
            user: { id: 'user123' },
            params: { id: 'goal123' },
            body: {},
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
        sinon.restore();
    });

    describe('addGoal', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { title: '', targetAmount: '', currency: '' };

            await addGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
        });
    });

    describe('updateGoal', () => {
        it('should return 404 if goal is not found', async () => {
            sinon.stub(Goal, 'findById').resolves(null);

            await updateGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });

        it('should return 401 if user is unauthorized', async () => {
            const goal = { userId: 'anotherUser' };
            sinon.stub(Goal, 'findById').resolves(goal);

            await updateGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
        });
    });

    describe('deleteGoal', () => {
        it('should delete a goal', async () => {
            const goal = {
                _id: 'goal123',
                userId: 'user123',
                deleteOne: sinon.stub().resolves(),
            };
            sinon.stub(Goal, 'findById').resolves(goal);

            await deleteGoal(req, res, next);

            expect(goal.deleteOne.calledOnce).to.be.true;
            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
        });

        it('should return 404 if goal is not found', async () => {
            sinon.stub(Goal, 'findById').resolves(null);

            await deleteGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });

        it('should return 401 if user is unauthorized', async () => {
            const goal = { userId: 'anotherUser' };
            sinon.stub(Goal, 'findById').resolves(goal);

            await deleteGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
        });
    });

    describe('getGoalProgress', () => {
        it('should return goal progress', async () => {
            const goal = {
                savedAmount: 5000,
                targetAmount: 10000,
                userId: 'user123',
            };
            sinon.stub(Goal, 'findById').resolves(goal);

            await getGoalProgress(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(res.json.calledWith({ progressPercentage: '50.00' })).to.be
                .true;
        });

        it('should return 404 if goal is not found', async () => {
            sinon.stub(Goal, 'findById').resolves(null);

            await getGoalProgress(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });
    });

    describe('addSavingsToGoal', () => {
        it('should return 404 if goal is not found', async () => {
            sinon.stub(Goal, 'findById').resolves(null);

            await addSavingsToGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
        });

        it('should return 401 if user is unauthorized', async () => {
            const goal = { userId: 'anotherUser' };
            sinon.stub(Goal, 'findById').resolves(goal);

            await addSavingsToGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
        });
    });
});
