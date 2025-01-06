const express = require('express');
const logger = require('morgan');
const cors = require('cors');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 4000;
        this.Server = require('http').createServer(this.app);
        this.paths = {
            access: '/api/mail',
        };
        this.middlewares();
        
        this.routes();

    }

    

    

    routes() {
        const apiRoutes = require('../routes/apiRoutes.js');
        this.app.use(this.paths.access, apiRoutes);
    }

    middlewares() {
        this.app.use(logger('dev'));
        this.app.use(cors());
        this.app.use(express.json());
    }

    listen() {
        this.Server.listen(this.port, () => {
            console.log('Servidor corriendo en puerto', this.port);
        });
    }
}

module.exports = Server;
