const jwt = require('jsonwebtoken');

authenticateToken = (req, res, next) => {
    const tokenWithBearer = req.header('Authorization');
    const token = tokenWithBearer.split(' ')[1];

    if (!token) {
        return res.status(401).send('Access denied. Token is missing.');
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;