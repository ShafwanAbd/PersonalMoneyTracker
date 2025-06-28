import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

export async function exportToGoogleSheets(data) {
  try {
    // Authenticate with Google
    const auth = await authenticate({
      scopes: SCOPES,
      keyfilePath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      properties: {
        title: `Financial Report - ${new Date().toLocaleDateString()}`,
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // Prepare the data
    const values = [
      // Headers
      ['Date', 'Type', 'Category', 'Amount', 'Description'],
      // Data rows
      ...data.map(transaction => [
        new Date(transaction.date).toLocaleDateString(),
        transaction.type,
        transaction.category,
        transaction.amount,
        transaction.description,
      ]),
    ];

    // Add summary data
    values.push(
      [''],
      ['Summary'],
      ['Total Income', data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)],
      ['Total Expenses', data.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)],
      ['Balance', data.reduce((sum, t) => sum + t.amount, 0)]
    );

    // Update the spreadsheet with the data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      resource: { values },
    });

    return spreadsheet.data.spreadsheetUrl;
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
} 