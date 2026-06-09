const fs = require('fs');
const file = 'd:/KFGs/LittleTaroStudio_Projects/MetaPlatformAPI/LittleTaroStudio_Backend_API/Controllers/CommissionController.cs';
let content = fs.readFileSync(file, 'utf8');

// We need to insert SaveChangesAsync AFTER the closing brace of the if(!AnyAsync) block,
// and BEFORE the payeesSql string assignment.
// The marker to find: the closing brace of the for loop and the if block before payeesSql

const searchFor = 'await tokenService.AddTokenLedgerAsync (parsedDate.Year, parsedDate.Month, i.AccountGuid, "Commission", i.Amount, now.AddYears (1), i.Id);';
const idx = content.indexOf(searchFor);
if (idx === -1) {
  console.log('Cannot find AddTokenLedgerAsync call');
  process.exit(1);
}

// Find the end of the if block after this (two closing braces: one for foreach, one for if)
// Then find payeesSql
const payeesSqlMarker = 'string payeesSql';
const payeesIdx = content.indexOf(payeesSqlMarker, idx);
if (payeesIdx === -1) {
  console.log('Cannot find payeesSql marker');
  process.exit(1);
}

// Check if SaveChanges is already there
if (content.substring(idx, payeesIdx).includes('SaveChangesAsync')) {
  console.log('SaveChangesAsync already present, no change needed');
  process.exit(0);
}

// Insert before payeesSql
const insertText = '\t\t\t\t// 確保 TokenLedger 與 TokenBalance 已寫入 DB，使後續 Dapper 查詢 payees 能讀到最新餘額\r\n\t\t\t\tawait _dbContext.SaveChangesAsync ();\r\n\t\t\t\t';
content = content.substring(0, payeesIdx) + insertText + content.substring(payeesIdx);

fs.writeFileSync(file, content, 'utf8');
console.log('SUCCESS: Inserted SaveChangesAsync at line before payeesSql');
