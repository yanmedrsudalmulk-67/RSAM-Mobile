const http = require('http');

const data = JSON.stringify({
  nama_pasien: 'Test User',
  nik: '1234567890123456',
  tanggal_lahir: '1990-01-01',
  no_bpjs: '',
  alamat: 'Test Address',
  no_hp: '081234567890',
  email: 'test2@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
