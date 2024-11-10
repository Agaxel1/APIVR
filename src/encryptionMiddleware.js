// encryptionMiddleware.js
const crypto = require('crypto');
const SECRET_KEY = 'claveVR??=A';
const IV = Buffer.from('1234567890123456'); // IV fijo de 16 bytes; puedes cambiarlo a otro valor seguro

function encrypt(text) {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), IV);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), IV);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encryptResponse(req, res, next) {
        const originalSend = res.send;
        res.send = function (body) {
            if (typeof body === 'object') {
                body = JSON.stringify(body);
            }
            const encryptedBody = encrypt(body);
            originalSend.call(this, encryptedBody);
        };
        next();
    },
    decryptRequest(req, res, next) {
        if (req.body && req.body.encryptedData) {
            try {
                const decryptedData = decrypt(req.body.encryptedData);
                req.body = JSON.parse(decryptedData);
            } catch (error) {
                console.error("Error al descifrar los datos de la solicitud:", error);
                return res.status(400).json({ error: "Datos de solicitud no válidos" });
            }
        }
        next();
    }
};