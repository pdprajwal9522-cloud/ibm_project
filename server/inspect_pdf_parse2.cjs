const { createRequire } = require('module');
const r = createRequire(__dirname + '/server.js');
const { PDFParse } = r('pdf-parse');
console.log('typeof PDFParse:', typeof PDFParse);
console.log('proto keys:', Object.getOwnPropertyNames(PDFParse.prototype));
