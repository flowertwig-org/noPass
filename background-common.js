var availableSites = {};
var availableSources = {};

var sites = {};
var sources = {};
var types = {};
var progress = {};

var config = false;
var tabs = {};
var mailTimerId = false;

var selectedSource = false;
var selectedSourceName = false;

function getFileContent(path, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    var abortTimerId = window.setTimeout(function () {
        xhr.abort();  // synchronously calls onreadystatechange
    }, requestTimeout);

    function handleSuccess(count) {
        window.clearTimeout(abortTimerId);
        if (onSuccess)
            onSuccess(count);
    }

    var invokedErrorCallback = false;
    function handleError() {
        window.clearTimeout(abortTimerId);
        if (onError && !invokedErrorCallback)
            onError();
        invokedErrorCallback = true;
    }

    try {
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4)
                return;

            var data = xhr.responseText;
            if (data) {
                handleSuccess(data);
                return;
            }

            handleError();
        };

        xhr.onerror = function (error) {
            handleError();
        };

        xhr.open("GET", path, true);
        xhr.send(null);
    } catch (e) {
        console.error("get gmail messages excetion: ", e);
        handleError();
    }
}

function getPageTypeByHostName(hostname) {
    //console.log('getPageTypeByHostName', JSON.stringify(types));
    for (var typeId in types) {
        var pageType = types[typeId];
        if (hostname.indexOf(pageType.hostname) >= 0) {
            return pageType.hostname;
        }
    }
    return false;
}

function updateStepAndStatus(p, step, status) {
    if (!p) {
        return;
    }

    var sourceTabId = p['sourceTabId'];

    var statusName = '';
    switch (status) {
        default:
        case 0:
            break;
        case 1:
            statusName = 'starting';
            break;
        case 2:
            statusName = 'completed';
            break;
        case 3:
            statusName = 'failed';
            break;
    }

    switch (step) {
        case 1:
        case 2:
        case 3:
        case 4:
            chrome.pageAction.setIcon({ 'tabId': sourceTabId, 'path': '/resources/img/logo-step' + step + '-' + statusName + '.png' });
            break;
        default:
            // Invalid status, reset icon
            chrome.pageAction.setIcon({ 'tabId': sourceTabId, 'path': '/resources/img/logo.png' });
            break;
    }


}

function complexify(alphabet, f, pass) {
    var d = Math.floor(Math.random() * alphabet.length);
    var c = Math.floor(Math.random() * f);
    var pass = pass.substring(0, c) + alphabet.substring(d, d + 1) + pass.substring(c, f);
    return pass;
}

/****
 * Generate Password
 * length           -   Password length (6-2048)
 * useSymbols       -   Use symbols (0|1)
 * useLowercase     -   Use lowercase chars (0|1)
 * useUppercase     -   Use uppercase chars (0|1)
 * useNumbers       -   User numbers (0|1)
 ****/
function genPass(length, useLowercase, useUppercase, useNumbers, useSymbols) {
    var lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    var uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var numbers = "0123456789";
    var symbols = "|!#$%&*+-=?@^_{}[]()\/'\"`~,;:.<>\\";
    var alphabet = "";
    var g = 0;
    if (useLowercase) {
        alphabet += lowercaseChars;
        g++;
    }
    if (useUppercase) {
        alphabet += uppercaseChars;
        g++;
    }
    if (useNumbers) {
        alphabet += numbers;
        g++;
    }
    if (useSymbols) {
        alphabet += symbols;
        g++;
    }
    if (g == 0) {
        return "";
    }
    var alphabetLength = alphabet.length;
    var f = length - g;
    var pass = "";
    for (var e = 0; e < f; e++) {
        var b = Math.floor(Math.random() * alphabetLength);
        pass += alphabet.substring(b, b + 1);
    }
    if (useUppercase) {
        pass = complexify(uppercaseChars, f, pass);
        f++;
    }
    if (useLowercase) {
        pass = complexify(lowercaseChars, f, pass);
        f++;
    }
    if (useNumbers) {
        pass = complexify(numbers, f, pass);
        f++;
    }
    if (useSymbols) {
        pass = complexify(symbols, f, pass);
    }
    return pass;
}