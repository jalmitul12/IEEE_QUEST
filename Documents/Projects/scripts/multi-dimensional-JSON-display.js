const multiDimArray = [
  ['Flood', 78, 'High'],
  ['Cyclone', 64, 'Moderate'],
  ['Earthquake', 38, 'Low'],
  ['Wildfire', 85, 'Severe']
];
console.log('Multi-dimensional JSON Array:');
console.log(multiDimArray);
console.log('\nAccessing individual elements:');
console.log('Risk score at [0][1]:', multiDimArray[0][1]);
console.log('Severity at [2][2]:', multiDimArray[2][2]);
console.log('Disaster at [3][0]:', multiDimArray[3][0]);
