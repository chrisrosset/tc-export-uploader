'use strict';

const L = require('logplease').create('login');

const credentials = require('./credentials');

const LOGIN_URL = 'https://home.tenantcloud.com';
const USERNAME_SELECTOR = '#email';
const PASSWORD_SELECTOR = '#password';
const REMEMBER_SELECTOR = ' body > app > div:nth-child(1) > div > div.content > auth-content-component > div > div > div > div > div > div > login-component > form > div > div.fieldset > custom-checkbox > div > div > label';
const LOGIN_SELECTOR = ' body > app > div:nth-child(1) > div > div.content > auth-content-component > div > div > div > div > div > div > login-component > form > div > div.form-group--button > button';

async function login(browser) {
    const page = await browser.newPage();
    L.info('New page');
    const nav1 = page.waitForNavigation({
        timeout: 60000,
        waitUntil: ['load', 'networkidle2']
    });
    await page.goto(LOGIN_URL);
    L.info('Navigating to', LOGIN_URL);
    L.info('Waiting for navigation...');
    await nav1;

    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(credentials.tc_username);
    L.info('Username entered.');

    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(credentials.tc_password);
    L.info('Password entered.');

    await page.click(REMEMBER_SELECTOR);
    L.info('Remember clicked.');

    const nav2 = page.waitForNavigation({
        timeout: 60000,
        waitUntil: ['load', 'networkidle2']
    });
    await page.click(LOGIN_SELECTOR);
    L.info('Login clicked.');
    L.info('Waiting for navigation...');
    await nav2;

    return page;
}

module.exports = login;
