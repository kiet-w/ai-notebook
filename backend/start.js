const fs = require('fs');
const target = fs.existsSync('./dist/src/main.js')
  ? './dist/src/main.js'
  : './dist/main.js';
require(target);
