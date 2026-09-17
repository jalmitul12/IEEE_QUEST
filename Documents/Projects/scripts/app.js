const fs = require('fs');
const path = require('path');

const jsonObject = {
  application: 'Aegis — Pre-Disaster Detector & Emergency Management System',
  purpose: 'Pre-disaster risk detection and emergency coordination',
  technologies: ['Node.js', 'Express.js', 'JSON', 'JavaScript'],
  generatedAt: new Date().toISOString()
};

const filePath = path.join(__dirname, '..', 'data', 'output.json');
fs.writeFile(filePath, JSON.stringify(jsonObject, null, 2), 'utf8', (err) => {
  if (err) return console.error('Error writing to file:', err);
  console.log('JSON object has been stored in', filePath);
});
