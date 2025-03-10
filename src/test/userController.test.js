import { expect } from 'chai';
import sinon from 'sinon';
import User from '../models/userModel.js';
import * as userController from '../controllers/userController.js';
import { generateToken } from '../utils/generateToken.js';
import { StatusCodes } from 'http-status-codes';

describe('User Controller Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            user: { _id: 'user123', memberType: 'user' },
        };

        res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
            cookie: sinon.stub(),
        };

        next = sinon.stub();
    });

    afterEach(() => {
        sinon.restore(); // Restores original behavior after each test
    });

    describe('registerUser', () => {
        it('should return an error if the user already exists', async () => {
            req.body = { email: 'test@example.com' };
            sinon.stub(User, 'findOne').resolves({ _id: 'user123' });

            await userController.registerUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.BAD_REQUEST)).to.be.true;
            expect(next.called).to.be.true;
            expect(next.args[0][0].message).to.equal('User already exists');
        });

        it('should create a new user', async () => {
            req.body = {
                firstname: 'John',
                lastname: 'Doe',
                email: 'test@example.com',
                password: 'password123',
            };

            sinon.stub(User, 'findOne').resolves(null);
            sinon
                .stub(User, 'create')
                .resolves({
                    _id: 'user123',
                    name: 'John Doe',
                    email: 'test@example.com',
                });

            await userController.registerUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.CREATED)).to.be.true;
            expect(res.json.calledWithMatch({ message: 'User created' })).to.be
                .true;
        });
    });

    describe('logoutUser', () => {
        it('should clear JWT cookie and send response', async () => {
            await userController.logoutUser(req, res);

            expect(res.cookie.calledWith('jwt', '', sinon.match.object)).to.be
                .true;
            expect(res.status.calledWith(StatusCodes.NO_CONTENT)).to.be.true;
        });
    });

    describe('updateUser', () => {
        it('should update user details', async () => {
            req.body = { firstname: 'NewName' };
            const userMock = {
                _id: 'user123',
                firstname: 'OldName',
                save: sinon
                    .stub()
                    .resolves({ _id: 'user123', firstname: 'NewName' }),
            };

            sinon.stub(User, 'findById').resolves(userMock);

            await userController.updateUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWithMatch({
                    message: 'User updated successfully',
                })
            ).to.be.true;
        });

        it('should return error if user not found', async () => {
            sinon.stub(User, 'findById').resolves(null);

            await userController.updateUser(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(next.called).to.be.true;
        });
    });

    describe('deleteUserAccount', () => {
        it('should delete user account', async () => {
            const userMock = { _id: 'user123' };
            sinon.stub(User, 'findById').resolves(userMock);
            sinon.stub(User, 'findByIdAndDelete').resolves();

            await userController.deleteUserAccount(req, res, next);

            expect(res.status.calledWith(StatusCodes.OK)).to.be.true;
            expect(
                res.json.calledWithMatch({
                    message: 'User account deleted successfully',
                })
            ).to.be.true;
        });

        it('should return error if user not found', async () => {
            sinon.stub(User, 'findById').resolves(null);

            await userController.deleteUserAccount(req, res, next);

            expect(res.status.calledWith(StatusCodes.NOT_FOUND)).to.be.true;
            expect(next.called).to.be.true;
        });
    });

    describe('getUserById', () => {
        it('should return unauthorized if not admin', async () => {
            req.user.memberType = 'user';
            req.params.id = 'user123';

            await userController.getUserById(req, res, next);

            expect(res.status.calledWith(StatusCodes.UNAUTHORIZED)).to.be.true;
            expect(res.json.calledWith('Unauthorized')).to.be.true;
        });
    });
});
