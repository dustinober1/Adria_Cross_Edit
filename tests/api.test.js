const request = require('supertest');
const app = require('../server');

describe('API Endpoints', () => {
    describe('GET /health', () => {
        it('should return 200 OK', async () => {
            const res = await request(app).get('/health');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('status', 'OK');
        });
    });

    describe('POST /api/login', () => {
        it('should return 400 if fields are missing', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: 'admin' });
            expect(res.statusCode).toEqual(400);
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(app)
                .post('/api/login')
                .send({ username: 'admin', password: 'wrongpassword' });
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('Newsletter API', () => {
        it('should return 400 for invalid email', async () => {
            const res = await request(app)
                .post('/api/newsletter')
                .send({ email: 'invalid-email' });
            expect(res.statusCode).toEqual(400);
        });
    });
});
