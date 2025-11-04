// Excel processing Web Worker
// This runs in a separate thread to prevent blocking the main UI

/* eslint-disable no-undef, no-restricted-globals */
importScripts('https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js');

self.onmessage = async function(e) {
  const { file, chunkSize = 1000 } = e.data;

  try {
    const data = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) throw new Error('Could not read worksheet from Excel file');
    if (worksheet.rowCount < 2) throw new Error('Excel file must contain at least one header row and one data row');

    const headers = [];
    const rows = [];

    // Get headers
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      const headerValue = cell.value?.toString()?.trim() || `Column${colNumber}`;
      headers.push(headerValue);
    });

    // Process all data rows
    const totalRows = worksheet.rowCount;
    let processedRows = 0;

    for (let rowIndex = 2; rowIndex <= totalRows; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      const rowData = {};

      headers.forEach((header, colIndex) => {
        const cell = row.getCell(colIndex + 1);
        const cellValue = cell ? (cell.text !== undefined && cell.text !== null ? cell.text : cell.value) : '';
        rowData[header] = cellValue?.toString()?.trim() || '';
      });

      rows.push(rowData);
      processedRows++;

      // Send progress update every chunk
      if (processedRows % chunkSize === 0 || processedRows === totalRows - 1) {
        self.postMessage({
          type: 'progress',
          progress: (processedRows / (totalRows - 1)) * 100,
          processedRows,
          totalRows: totalRows - 1
        });
      }
    }

    // Send final result with all data
    self.postMessage({
      type: 'complete',
      headers,
      rows,
      totalRows: rows.length
    });

  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
