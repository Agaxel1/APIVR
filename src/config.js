require('dotenv').config();

module.exports = {
    app: {
        port: process.env.PORT || 4000,
    },
    mysql: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
    },
    discord: {
        token: 'OTkyNDYxOTY3MTQ5MjUyNzA4.GKC7FI.hDGVi4Na4ni_gbyM5ZjNOhw1CrQvMUPZZ7aPOU',
        channelId: '1267127952496132118'
    }
}