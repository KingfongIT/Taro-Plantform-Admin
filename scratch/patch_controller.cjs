const fs = require('fs');

const controllerPath = 'd:\\KFGs\\LittleTaroStudio_Projects\\MetaPlatformAPI\\LittleTaroStudio_Backend_API\\Controllers\\CommissionController.cs';
let content = fs.readFileSync(controllerPath, 'utf8');

// First remove the bad Recalculate() calls we added
const badXl = 'xLWorkbook.Recalculate ();\r\n\t\txLWorkbook.SaveAs (memoryStream);';
const goodXl = 'xLWorkbook.SaveAs (memoryStream, new SaveOptions { EvaluateFormulasBeforeSaving = true });';
if (content.includes(badXl)) {
  content = content.replaceAll(badXl, goodXl);
  console.log('Fixed xLWorkbook.SaveAs x' + (content.split(goodXl).length - 1));
} else {
  // Just fix plain SaveAs
  const plainXl = 'xLWorkbook.SaveAs (memoryStream);';
  const evaluateXl = 'xLWorkbook.SaveAs (memoryStream, new SaveOptions { EvaluateFormulasBeforeSaving = true });';
  if (content.includes(plainXl)) {
    content = content.replaceAll(plainXl, evaluateXl);
    console.log('Patched plain xLWorkbook.SaveAs x' + (content.split(evaluateXl).length - 1));
  } else {
    console.log('No xLWorkbook.SaveAs found to patch');
  }
}

// Fix workbook.SaveAs (for ExportMonthlyAllInOne which uses "workbook" variable)
const badWorkbook = 'workbook.Recalculate ();\r\n\t\t\tworkbook.SaveAs (stream);';
const goodWorkbook = 'workbook.SaveAs (stream, new SaveOptions { EvaluateFormulasBeforeSaving = true });';
if (content.includes(badWorkbook)) {
  content = content.replaceAll(badWorkbook, goodWorkbook);
  console.log('Fixed workbook.SaveAs x' + (content.split(goodWorkbook).length - 1));
} else {
  const plainWorkbook = 'workbook.SaveAs (stream);';
  const evaluateWorkbook = 'workbook.SaveAs (stream, new SaveOptions { EvaluateFormulasBeforeSaving = true });';
  if (content.includes(plainWorkbook)) {
    content = content.replaceAll(plainWorkbook, evaluateWorkbook);
    console.log('Patched plain workbook.SaveAs x' + (content.split(evaluateWorkbook).length - 1));
  } else {
    console.log('No workbook.SaveAs found to patch');
  }
}

fs.writeFileSync(controllerPath, content, 'utf8');
console.log('Patched file written successfully.');
