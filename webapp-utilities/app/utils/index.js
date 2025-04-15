
export const readJsonFile = (file, callback) => {
  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      console.log('JSON content:', json);
      callback(json, undefined);
      // You can now work with the `json` object
    } catch (err) {
      console.error('Error parsing JSON:', err);
      callback(undefined, err);
    }
  };

  reader.onerror = function() {
    console.error('Error reading file:', reader.error);
    callback(undefined, err);
  };

  reader.readAsText(file);
}

export const writeJsonFile = (jsonData, fileName) => {
  const jsonString = JSON.stringify(jsonData, null, 2); // Pretty-print with indentation
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
};