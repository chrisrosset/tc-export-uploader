'use strict';

const {google} = require('googleapis');
const fetch = require('node-fetch');
const fs = require('fs');
const puppeteer = require('puppeteer');
const csvparse = require('csv-parse/lib/sync');
const L = require('logplease').create('export');

const login = require('./login');
const config = require('./credentials');

const TOKEN_PATH = 'credentials.json';
const EXPORT_URL = 'https://home.tenantcloud.com/v1/landlord/transactions?export=csv';

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            L.error('Failed to read the token.');
            return;
        }
            //return getNewToken(oAuth2Client, callback);

        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

async function download() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    L.info('Logging in...');
    const page = await login(browser);
    L.info('Logged in.');

    L.info('Fetching the export file...');
    const csvdata = await page.evaluate(async url => {
        const fetchResp = await fetch(url, {credentials: 'include'});
        return await fetchResp.text();
    }, EXPORT_URL);
    L.info('Fetched.');

    L.info('Closing the browser...');
    await browser.close();

    L.info('Browser closed.');

    return csvdata;
};

async function upload(auth, data) {
    const spreadsheetId = config.sheets_url;
    const sheetName = config.sheets_name;

    const sheets = google.sheets({version: 'v4', auth});

    L.info('Clearing the spreadsheet ...', spreadsheetId, sheetName);
    await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: sheetName
    });
    L.info('Cleared.');

    L.info('Inserting the data...');
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetName}!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: { values: data }
    });
    L.info('Inserted.');

    L.info('Updating the timestamp...');
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!Z1:Z2`,
        valueInputOption: 'RAW',
        resource: { values: [
            ["Last Updated"],
            [(new Date()).toString()]
        ] }
    });
    L.info('Updated.');
}

async function run(auth) {
    try {
        L.info('============== Starting run ==============');
        var data = await download();
        L.info('Downloaded the export file');
        var csv = csvparse(data);
        L.info('Parsed the csv');
        await upload(auth, csv);
        L.info('Success!');
    } catch(e) {
        L.error(e);
        process.exit(1);
    }
}

fs.readFile('client_secret.json', (err, content) => {
    if (err)
    {
        L.error('Error loading client secret file:', err);
        return;
    }
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), run);
});
