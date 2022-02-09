const fs = require('fs/promises');
const request = require('supertest');
const app = require("../app");

describe('Server exists', () => {
    it('server.js exists', async () => {
        const f = await fs.stat("server.js");
    });
    
    it('app.js exists', async () => {
        const f = await fs.stat("app.js");
    });
});
