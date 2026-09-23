/**
 * LIBESOLE — LEAD SHEET + EMAIL ALERTS
 *
 * Saves every website enquiry to a private Google Sheet (with date and time
 * in IST) and emails you. Also logs clicks on the WhatsApp / Call buttons.
 *
 * SETUP (one time, about 5 minutes)
 * 1. Create a new Google Sheet (sheets.new) named "Libesole Leads".
 * 2. Extensions → Apps Script. Delete the sample code and paste this file.
 * 3. Click Save, choose the "setup" function in the toolbar and click Run.
 *    Approve the permissions. You'll get a test email and see the tabs.
 * 4. Deploy → New deployment → type "Web app":
 *      Execute as:      Me
 *      Who has access:  Anyone
 *    Click Deploy and copy the Web app URL (ends in /exec).
 * 5. Paste that URL into LEAD_ENDPOINT at the top of js/script.js.
 *
 * PRIVACY
 * "Anyone" only lets the website SEND a lead. Nobody can read the sheet
 * through this URL; the sheet stays private in your Google Drive.
 */

const NOTIFY_EMAIL = "libesoleofficial@gmail.com";
const TIMEZONE = "Asia/Kolkata";

const ENQUIRY_TAB = "Enquiries";
const ENQUIRY_HEADERS = [
    "Date", "Time", "Name", "WhatsApp", "Occasion", "Event date",
    "Interested in", "Message", "Sent via", "Page", "Status"
];

const CLICK_TAB = "Button clicks";
const CLICK_HEADERS = ["Date", "Time", "Button", "Page"];


/* Receives leads from the website */
function doPost(e) {

    const data = (e && e.parameter) || {};

    /* Spam trap filled in: ignore silently */
    if (data.website) {
        return respond();
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {

        const now = new Date();
        const date = Utilities.formatDate(now, TIMEZONE, "dd MMM yyyy");
        const time = Utilities.formatDate(now, TIMEZONE, "hh:mm:ss a");

        if (data.type === "click") {
            getTab(CLICK_TAB, CLICK_HEADERS)
                .appendRow([date, time, clean(data.button), clean(data.page)]);
            return respond();
        }

        const lead = {
            name: clean(data.name),
            phone: clean(data.phone),
            occasion: clean(data.occasion),
            eventDate: clean(data.eventDate),
            services: clean(data.services),
            message: clean(data.message),
            channel: clean(data.channel),
            page: clean(data.page)
        };

        /* Ignore empty submissions */
        if (!lead.name && !lead.phone) {
            return respond();
        }

        getTab(ENQUIRY_TAB, ENQUIRY_HEADERS).appendRow([
            date, time, lead.name, lead.phone, lead.occasion, lead.eventDate,
            lead.services, lead.message, lead.channel, lead.page, "New"
        ]);

        sendAlert(lead, date, time);

    } finally {
        lock.releaseLock();
    }

    return respond();

}


/* Opening the URL in a browser just shows that it works */
function doGet() {
    return ContentService.createTextOutput("Libesole lead endpoint is running.");
}


/* Run once from the editor: creates the tabs and sends a test email */
function setup() {

    getTab(ENQUIRY_TAB, ENQUIRY_HEADERS);
    getTab(CLICK_TAB, CLICK_HEADERS);

    const now = new Date();

    sendAlert(
        {
            name: "Test Client",
            phone: "98765 43210",
            occasion: "Wedding",
            eventDate: "18/12/2026",
            services: "Video Invitation",
            message: "This is a test. Your lead alerts are working!",
            channel: "Setup test",
            page: ""
        },
        Utilities.formatDate(now, TIMEZONE, "dd MMM yyyy"),
        Utilities.formatDate(now, TIMEZONE, "hh:mm:ss a")
    );

}


/* ---------- Helpers ---------- */

function getTab(name, headers) {

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(name);

    if (!sheet) {
        sheet = spreadsheet.insertSheet(name);
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length)
            .setFontWeight("bold")
            .setBackground("#e0337a")
            .setFontColor("#ffffff");
        sheet.setFrozenRows(1);
        sheet.autoResizeColumns(1, headers.length);
    }

    return sheet;

}

function sendAlert(lead, date, time) {

    const phoneDigits = lead.phone.replace(/\D/g, "");
    const waNumber = phoneDigits.length === 10 ? "91" + phoneDigits : phoneDigits;

    const rows = [
        ["Date", date],
        ["Time", time],
        ["Name", lead.name],
        ["WhatsApp", lead.phone],
        ["Occasion", lead.occasion],
        ["Event date", lead.eventDate || "–"],
        ["Interested in", lead.services || "–"],
        ["Message", lead.message || "–"],
        ["Sent via", lead.channel]
    ];

    const table = rows.map(([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#6d5b66"><b>${label}</b></td>` +
        `<td style="padding:6px 12px">${escapeHtml(value)}</td></tr>`
    ).join("");

    const replyButton = waNumber
        ? `<p><a href="https://wa.me/${waNumber}" ` +
          `style="display:inline-block;padding:10px 18px;border-radius:999px;` +
          `background:#25d366;color:#0b3d1f;font-weight:bold;text-decoration:none">` +
          `Reply on WhatsApp</a></p>`
        : "";

    MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: `New enquiry: ${lead.name} (${lead.occasion}) – ${date} ${time}`,
        htmlBody:
            `<h2 style="color:#e0337a;font-family:Georgia,serif">New Libesole enquiry</h2>` +
            `<table style="border-collapse:collapse;font-family:Arial,sans-serif">${table}</table>` +
            replyButton
    });

}

/* Trim, limit length and stop spreadsheet formula injection */
function clean(value) {
    let text = String(value || "").trim().slice(0, 1000);
    if (/^[=+\-@]/.test(text)) {
        text = "'" + text;
    }
    return text;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function respond() {
    return ContentService.createTextOutput("ok");
}
