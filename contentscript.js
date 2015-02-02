// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        switch (msg.action) {
            case 'loginDone':
                if (confirm('noPass login process finished.\r\nYou need to refresh page to be logged in.\r\nClick "OK" to refresh page.')) {
                    document.location.reload();
                }
                break;
            default:
                break;
        }

        sendResponse();
    });
}
