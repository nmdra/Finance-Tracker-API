import { expect } from 'chai';
import sinon from 'sinon';
import * as adminController from '../../controllers/adminController.js';
import { StatusCodes } from 'http-status-codes';
import User from '../../models/userModel.js';
import { Transaction } from '../../models/transactionModel.js';
import { Goal } from '../../models/goalModel.js';
import { Config } from '../../models/configModel.js';

describe('Admin Controller Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { _id: 'admin123', memberType: 'admin' },
        };

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };

        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore(); // Restores original behavior after each test
    });

    describe('deleteUser', () => {
        it('should delete user successfully', async () => {
            req.params.id = 'user123';
            const userMock = {
                _id: 'user123',
                deleteOne: sinon.stub().resolves(),
            };
            sinon.stub(User, 'findById').resolves(userMock);

            await adminController.deleteUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWith({ message: 'User deleted successfully.' })
            ).to.be.true;
        });

        it('should return error if user not found', async () => {
            req.params.id = 'user123';
            sinon.stub(User, 'findById').resolves(null);

            await adminController.deleteUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(res.json.calledWith({ message: 'User not found.' })).to.be
                .true;
        });
    });

    describe('deleteTransaction', () => {
        it('should delete transaction successfully', async () => {
            req.params.id = 'txn123';
            const transactionMock = {
                _id: 'txn123',
                deleteOne: sinon.stub().resolves(),
            };
            sinon.stub(Transaction, 'findById').resolves(transactionMock);

            await adminController.deleteTransaction(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWith({
                    message: 'Transaction deleted successfully.',
                })
            ).to.be.true;
        });

        it('should return error if transaction not found', async () => {
            req.params.id = 'txn123';
            sinon.stub(Transaction, 'findById').resolves(null);

            await adminController.deleteTransaction(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(res.json.calledWith({ message: 'Transaction not found.' }))
                .to.be.true;
        });
    });

    describe('getAllGoals', () => {
        it('should return all financial goals', async () => {
            const goalsMock = [{ _id: 'goal123', targetAmount: 5000 }];
            sinon.stub(Goal, 'find').resolves(goalsMock);

            await adminController.getAllGoals(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(res.json.calledWith(goalsMock)).to.be.true;
        });
    });

    describe('deleteGoal', () => {
        it('should delete financial goal successfully', async () => {
            req.params.id = 'goal123';
            const goalMock = {
                _id: 'goal123',
                deleteOne: sinon.stub().resolves(),
            };
            sinon.stub(Goal, 'findById').resolves(goalMock);

            await adminController.deleteGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWith({ message: 'Goal deleted successfully.' })
            ).to.be.true;
        });

        it('should return error if goal not found', async () => {
            req.params.id = 'goal123';
            sinon.stub(Goal, 'findById').resolves(null);

            await adminController.deleteGoal(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(res.json.calledWith({ message: 'Goal not found.' })).to.be
                .true;
        });
    });

    describe('getSettings', () => {
        it('should return system settings', async () => {
            const settingsMock = { defaultCurrency: 'USD', budgetLimit: 1000 };
            sinon.stub(Config, 'findOne').resolves(settingsMock);

            await adminController.getSettings(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(res.json.calledWith(settingsMock)).to.be.true;
        });

        it('should return error if no settings found', async () => {
            sinon.stub(Config, 'findOne').resolves(null);

            await adminController.getSettings(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(res.json.calledWith({ message: 'No settings found' })).to.be
                .true;
        });
    });
});
