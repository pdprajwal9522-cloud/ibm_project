const { createRequire } = require('module');
const r = createRequire(__dirname + '/server.js');
const pdfParse = r('pdf-parse');
console.log('typeof pdfParse:', typeof pdfParse);
console.log('keys:', Object.keys(pdfParse));
