const app = require('./app');
const { client } = require('./discordClient');  // Import the client to ensure it gets initialized

app.listen(app.get('port'), () => {
    console.log("Server on port", app.get('port'));
});
