function sendWeeklyEmailWithAttachment() {
  var today = new Date();
  var dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday

  // Get Monday and Friday of the current week
  var monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek - 1));
  var friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // Format dates as "MMM-dd"
  var options = { month: "short", day: "2-digit" };
  var startDate = monday.toLocaleDateString("en-US", options);
  var endDate = friday.toLocaleDateString("en-US", options);

  // Email details
  var recipient = "ratnesh@eazyerp.com"; // Replace with actual email
  var subject = `Weekly Task Update - ${startDate} to ${endDate}`;
  var body = `Hello,\n\nHere is the weekly task update from ${startDate} to ${endDate}.\n\nBest Regards,\nAZAD`;

  // **Export Google Sheets as Excel**
  var fileId = "19KTjFdhPNRM1m6KeHtLklTdbxNqUZsyOhAnJoO7f7eg"; // Replace with your File ID
  var file = DriveApp.getFileById(fileId);
  
  // Use Drive API to export Google Sheet as Excel
  var url = "https://docs.google.com/feeds/download/spreadsheets/Export?key=" + fileId + "&exportFormat=xlsx";
  var params = {
    method: "get",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch(url, params);
  var excelBlob = response.getBlob().setName(file.getName() + ".xlsx"); // Convert to .xlsx file

  // Send email with Excel attachment
  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    body: body,
    attachments: [excelBlob]
  });
}
