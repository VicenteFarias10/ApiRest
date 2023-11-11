const jwt = require('jsonwebtoken');
const { expressjwt: jwtt } = require("express-jwt");
const secretKey = process.env.JWT_SECRET || 'secreto';

jwtt({
  secret: secretKey,
  audience: "http://myapi/protected",
  issuer: "http://issuer",
  algorithms: ["HS256"],
});

const jwtMiddleware = jwtt({
  secret: secretKey,
  algorithms: ['HS256'],
}).unless({ path: ['/login', '/', '/users','/user-data'] });

module.exports = jwtMiddleware;
