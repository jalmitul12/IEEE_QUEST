const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '..', 'data', 'sample.json');
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) return console.error('Error reading the JSON file:', err);
  try {
    const jsonObject = JSON.parse(data);
    console.log('JSON object content:', jsonObject);
    console.log('Formatted JSON object content:', JSON.stringify(jsonObject, null, 2));
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});
