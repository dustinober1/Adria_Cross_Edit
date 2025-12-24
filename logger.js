const winston = require('winston');

const transports = [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
];

// Always add console transport for observability in cloud logs (like Render)
transports.push(new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
        ? winston.format.simple()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
}));

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: transports,
});

module.exports = logger;
