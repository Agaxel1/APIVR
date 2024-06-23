exports.success = function (req, res, mensaje = '', status= 300) {
    res.status(status).send({
        error: false,
        status: status,
        body: mensaje
    });
}

exports.error = function (req, res, mensaje= 'Error interno', status= 500) {
    res.status(status).send({
        error: true,
        status: status,
        body: mensaje
    });
}