const jwt = require('jsonwebtoken');
const http = require('http');

const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'detalcenter-az-local-dev-secret';
const token = jwt.sign({ id: 1, role: 'ADMIN', sellerId: null }, secret, { expiresIn: '7d' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/catalog',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${token}`,
  },
};

const req = http.request(options, (res) => {
  console.log('STATUS', res.statusCode);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('BODY', body);
  });
});

req.on('error', (err) => {
  console.error(err);
});

req.end();
