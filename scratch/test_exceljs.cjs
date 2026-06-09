const ExcelJS = require('exceljs');

async function test() {
  const workbook = new ExcelJS.Workbook();
  try {
    console.log('Loading cleaned_Excel.xlsx...');
    await workbook.xlsx.readFile('d:\\KFGs\\LittleTaroStudio_Projects\\Taro-Plantform-Admin\\scratch\\cleaned_Excel.xlsx');
    console.log('Workbook loaded successfully!');
    console.log('Number of sheets:', workbook.worksheets.length);
    workbook.worksheets.forEach(ws => {
      console.log('Sheet name:', ws.name);
    });
  } catch (err) {
    console.error('exceljs parser error:', err);
  }
}

test();
