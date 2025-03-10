import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { generateToken, tokenToVerify } from '../utils/generateToken.js'; // Adjust the path accordingly

describe('Auth Middleware', () => {
    describe('generateToken', () => {
        it('should generate a token and set it as a cookie', () => {
            const res = {
                cookie: sinon.spy(), // Spy on res.cookie method to check if it is called
            };

            const userId = '12345';
            generateToken(res, userId);

            // Check if jwt.sign is called once with the correct parameters
            const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
                expiresIn: '96h',
            });
            expect(res.cookie.calledOnce).to.be.true; // Make sure res.cookie was called
            expect(res.cookie.firstCall.args[0]).to.equal('jwt'); // The name of the cookie should be 'jwt'
            expect(res.cookie.firstCall.args[1]).to.equal(token); // The token should be passed to the cookie
            expect(res.cookie.firstCall.args[2]).to.have.property('expires'); // Cookie should have an expiration
            expect(res.cookie.firstCall.args[2]).to.have.property(
                'httpOnly',
                true
            ); // Cookie should have httpOnly set to true
            expect(res.cookie.firstCall.args[2]).to.have.property('secure'); // Cookie should be secure
            expect(res.cookie.firstCall.args[2]).to.have.property(
                'sameSite',
                'strict'
            ); // Cookie should have sameSite set to 'strict'
        });
    });

    describe('tokenToVerify', () => {
        it('should generate a token with email and expiration of 15 minutes', () => {
            const email = 'test@example.com';
            const token = tokenToVerify(email);

            // Verify that the token is a valid JWT and contains the email in the payload
            const decoded = jwt.decode(token);
            expect(decoded.email).to.equal(email); // Check if the email matches
            expect(decoded.exp).to.be.a('number'); // The expiration time should be present

            // Ensure the expiration time is 15 minutes from now
            const currentTime = Math.floor(Date.now() / 1000);
            expect(decoded.exp - currentTime).to.be.within(900, 910); // Expiration should be within 15 minutes
        });
    });
});
