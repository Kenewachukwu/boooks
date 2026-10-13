// node build.mjs  ->  piece.html (the painting embedded as a data URI so the canvas stays readable)
import fs from 'fs';
const img = fs.readFileSync('source.webp').toString('base64');
fs.writeFileSync('piece.html', fs.readFileSync('piece.src.html', 'utf8').replace('__IMG__', 'data:image/webp;base64,' + img));
console.log('piece.html built');
