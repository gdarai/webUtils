
export const readJsonFile = (file, callback = () => {}) => {

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function(e) {
      try {
        const json = JSON.parse(e.target.result);
        console.log('JSON content:', json);
        callback(json, undefined);
        resolve(json);
      } catch (err) {
        console.error('Error parsing JSON:', err);
        callback(undefined, err);
        reject(error);
      }
    };
  
    reader.onerror = function() {
      console.error('Error reading file:', reader.error);
      callback(undefined, err);
    };
  
    reader.readAsText(file);  
  });
}

export const writeFile = (data, fileName, type = 'application/json') => {
  let blob;
  if(type === 'application/json') {
    const jsonString = JSON.stringify(data, null, 2); // Pretty-print with indentation
    blob = new Blob([jsonString], { type: "application/json" });  
  } else {
    if(type !== 'zip') {
      blob = new Blob([data], { type });
    } else {
      blob = data;
    }
  }
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const checkObjectConsistency = (objA, objB, path) => {
  const typeA = typeof objA;
  const typeB = typeof objB;

  if(typeA !== typeB) {
    return [`type inconsistency in "${path}"`];
  }

  if(Array.isArray(objA)) {
    if(!Array.isArray(objB)) {
      return [`type inconsistency in "${path}"`];
    }

    return objA.flatMap((a, i) => checkObjectConsistency(objA[i], objB[i], path+'.'+i));
  }

  if(objA === null || objB === null || typeA === 'undefined') {
    return [`null type in "${path}"`];
  }

  if(typeA === 'function') {
    return [`function type in "${path}"`];
  }

  if(typeA === 'object') {
    const aKeys = Object.keys(objA);
    const bKeys = Object.keys(objB);

    if (aKeys.length !== bKeys.length) return [`inconsistent keys in "${path}"`];
    return aKeys.flatMap(k => {
      if(!objB.hasOwnProperty(k)) return [`inconsistent keys in "${path}"`];
      return checkObjectConsistency(objA[k], objB[k], path+'.'+k);
    });
  }

  return [];
};