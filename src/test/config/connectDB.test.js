import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { logger } from '../../middleware/logger.js';
import connectDB from '../../config/db.js';

describe('Database Connection (connectDB)', () => {
    let mongooseConnectStub, loggerInfoStub, loggerErrorStub, processExitStub;

    beforeEach(() => {
        mongooseConnectStub = sinon.stub(mongoose, 'connect');
        loggerInfoStub = sinon.stub(logger, 'info');
        loggerErrorStub = sinon.stub(logger, 'error');
        processExitStub = sinon.stub(process, 'exit');
    });

    afterEach(() => {
        sinon.restore(); // Restore all stubs
    });

    it('should log success message when connected to MongoDB', async () => {
        // Simulate successful connection
        mongooseConnectStub.resolves({ connection: { host: 'mocked-host' } });

        await connectDB();

        expect(mongooseConnectStub.calledOnce).to.be.true;
        expect(loggerInfoStub.calledWithMatch(/DB Connected: mocked-host/)).to
            .be.true;
    });

    it('should log error and exit process on connection failure', async () => {
        // Simulate connection failure
        const errorMessage = 'Mocked MongoDB connection error';
        mongooseConnectStub.rejects(new Error(errorMessage));

        await connectDB();

        expect(mongooseConnectStub.calledOnce).to.be.true;
        expect(
            loggerErrorStub.calledWithMatch(
                /Error connecting to MongoDB: Mocked MongoDB connection error/
            )
        ).to.be.true;
        expect(processExitStub.calledWith(1)).to.be.true;
    });
});
