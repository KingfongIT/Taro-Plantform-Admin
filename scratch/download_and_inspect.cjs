const fs = require('fs');
const https = require('https');
const axios = require('axios');
const JSZip = require('jszip');

const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function run() {
  const url = 'https://localhost:44324/api/Commission/export-monthly-all-in-one?yearMonth=2026-04';
  console.log('Fetching Excel from:', url);
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      httpsAgent: agent
    });

    const buffer = res.data;
    console.log('Successfully fetched Excel file. Size:', buffer.byteLength);

    const zip = await JSZip.loadAsync(buffer);
    console.log('\n--- Zip Entries ---');
    zip.forEach((relativePath, file) => {
      console.log(relativePath);
    });

    console.log('\n--- Original _rels/.rels ---');
    const rootRels = await zip.file('_rels/.rels').async('text');
    console.log(rootRels);

    console.log('\n--- Original xl/_rels/workbook.xml.rels ---');
    const xlRelsFile = zip.file('xl/_rels/workbook.xml.rels');
    if (xlRelsFile) {
      const xlRels = await xlRelsFile.async('text');
      console.log(xlRels);
    } else {
      console.log('xl/_rels/workbook.xml.rels not found!');
    }

    // Now test our cleanExcelRelationships logic
    console.log('\n--- Testing cleanExcelRelationships logic ---');
    let modified = false;
    const relsFiles = [];
    zip.forEach((relativePath, file) => {
      if (relativePath.endsWith('.rels')) {
        relsFiles.push(file);
      }
    });

    for (const file of relsFiles) {
      const content = await file.async('text');
      const parts = file.name.split('/');
      const relsIndex = parts.indexOf('_rels');
      if (relsIndex === -1) continue;
      
      const prefixParts = parts.slice(0, relsIndex);
      
      const newContent = content.replace(/Target="\/([^"]+)"/g, (match, targetPath) => {
        const targetParts = targetPath.split('/');
        let commonCount = 0;
        while (
          commonCount < prefixParts.length &&
          commonCount < targetParts.length &&
          prefixParts[commonCount] === targetParts[commonCount]
        ) {
          commonCount++;
        }
        const upCount = prefixParts.length - commonCount;
        const downParts = targetParts.slice(commonCount);
        let relPath = '';
        for (let i = 0; i < upCount; i++) {
          relPath += '../';
        }
        relPath += downParts.join('/');
        console.log(`[${file.name}] Replaced "/${targetPath}" -> "${relPath}"`);
        return `Target="${relPath}"`;
      });

      if (content !== newContent) {
        zip.file(file.name, newContent);
        modified = true;
      }
    }

    if (modified) {
      const cleanedBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      fs.writeFileSync('d:\\KFGs\\LittleTaroStudio_Projects\\Taro-Plantform-Admin\\scratch\\cleaned_Excel.xlsx', Buffer.from(cleanedBuffer));
      console.log('Saved cleaned Excel to cleaned_Excel.xlsx');
    } else {
      console.log('No modifications made to relationships.');
    }

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response data:', new TextDecoder().decode(err.response.data));
    }
  }
}

run();
