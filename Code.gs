function doGet() {
  return HtmlService.createHtmlOutputFromFile("index")
    .setTitle("Weekly Plan Input")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function appendToCurrentWeekSheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();
  
  // Get Monday of the current week
  var monday = new Date(today);
  var dayOfWeek = today.getDay();
  var daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(today.getDate() + daysToMonday);

  // Get Friday of the same week
  var friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // Format sheet name (e.g., "Feb-03-07, 2025")
  var monthAbbr = monday.toLocaleString('en-US', { month: 'short' });
  var dateRange = `${monthAbbr}-${String(monday.getDate()).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}, ${monday.getFullYear()}`;
  var sheetName = dateRange;

  var sheet = ss.getSheetByName(sheetName);
  var lastSheet = getLastWeekSheet(ss); // Find last week's sheet

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);

    // Set row 1 title
    sheet.getRange(1, 1).setValue(`Weekly Plan (${dateRange}) - ERP Development`);
    sheet.getRange(1, 1, 1, 9).merge();
    sheet.getRange(1, 1, 1, 9).setFontWeight("bold").setFontSize(16).setBackground("#68288C").setFontColor("white");

    // Set row 2 headers
    var headers = ["Sr. No", "Task ID", "Task Description", "Product", "Client", "Task Type", "Responsible Person", "Status", "Remarks"];
    sheet.getRange(2, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(2, 1, 1, headers.length).setFontWeight("bold").setBackground("#674EA7").setFontColor("white").setFontSize(11);

    sheet.getRange(1, 1, 1000, headers.length).setHorizontalAlignment("center").setBorder(true, true, true, true, true, true);

    if (lastSheet) {
      copyDropdownsFromLastWeek(lastSheet, sheet); // Copy dropdowns from last week's sheet
    }
  } else {
    if (lastSheet) {
      ensureDropdownsExist(sheet, lastSheet);
    }
  }

  if (!Array.isArray(data)) {
    return { status: "error", message: "Invalid data format!" };
  }

  var lastRow = sheet.getLastRow();
  var nextRow = lastRow >= 2 ? lastRow + 1 : 3;

  data.unshift(nextRow - 2);

  sheet.getRange(nextRow, 1, 1, data.length).setValues([data]);

  return { status: "success", message: `Data inserted into ${sheetName}` };
}

/**
 * Finds the last week's sheet by checking existing sheets.
 */
function getLastWeekSheet(ss) {
  var sheets = ss.getSheets();
  var weekPattern = /^[A-Za-z]{3}-\d{2}-\d{2}, \d{4}$/; 
  var lastSheet = null;
  
  sheets.forEach(sheet => {
    if (weekPattern.test(sheet.getName())) {
      lastSheet = sheet;
    }
  });

  return lastSheet;
}

/**
 * Copies dropdowns from last week's sheet from row 3 to row 1000.
 */
function copyDropdownsFromLastWeek(lastSheet, newSheet) {
  var lastCol = lastSheet.getLastColumn();
  var lastRow = lastSheet.getLastRow();
  var totalRows = 998; // Apply from row 3 to 1000

  if (lastRow >= 3) {
    // Get existing validations from last week's sheet
    var validations = lastSheet.getRange(3, 1, lastRow - 2, lastCol).getDataValidations();
    
    // Expand the validations array to cover the entire target range
    var extendedValidations = new Array(totalRows).fill().map((_, i) => validations[i % validations.length] || new Array(lastCol).fill(null));

    // Apply the extended validations to the new sheet (from row 3 to 1000)
    newSheet.getRange(3, 1, totalRows, lastCol).setDataValidations(extendedValidations);
  }
}


/**
 * Ensures dropdowns exist in current week's sheet; if missing, copy from last week.
 */
function ensureDropdownsExist(sheet, lastSheet) {
  var columnsToCheck = [4, 6, 7, 8]; // Columns: Product (D), Task Type (F), Responsible Person (G), Status (H)

  if (sheet.getLastRow() < 3) {
    Logger.log("Skipping dropdown check: Not enough rows in the current week's sheet.");
    return;
  }

  columnsToCheck.forEach(col => {
    var range = sheet.getRange(3, col, 998, 1); 

    var validations = range.getDataValidations();
    var isDropdownMissing = validations.every(row => row[0] === null);

    if (isDropdownMissing && lastSheet.getLastRow() >= 3) {
      var lastValidRange = lastSheet.getRange(3, col, lastSheet.getLastRow() - 2, 1);

      var lastValidations = lastValidRange.getDataValidations();
      range.setDataValidations(lastValidations);

      var lastBackgroundColors = lastValidRange.getBackgrounds();
      range.setBackgrounds(lastBackgroundColors);

      var lastFontColors = lastValidRange.getFontColors();
      range.setFontColors(lastFontColors);
    }
  });
}
