require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT || 4000,
    },
    mysql: {
        db1: {
            host: process.env.MYSQL_DB1_HOST,
            user: process.env.MYSQL_DB1_USER,
            password: process.env.MYSQL_DB1_PASSWORD,
            database: process.env.MYSQL_DB1_NAME,
        },
        db2: {
            host: process.env.MYSQL_DB2_HOST,
            user: process.env.MYSQL_DB2_USER,
            password: process.env.MYSQL_DB2_PASSWORD,
            database: process.env.MYSQL_DB2_NAME,
        },
    },
    jwt: {
        secret: process.env.JWT_SECRET || '1yHj$7r@kI3Np2!xVz&uL8wM#QpFgR9Z'
    },
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        requireTLS: process.env.EMAIL_REQUIRE_TLS === 'true',
    },
    discord: {
        token: process.env.DISCORD_TOKEN,
        channelId: process.env.DISCORD_CHANNEL_ID
    }
};
