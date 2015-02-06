
var title = '';
var nOfEmails = -1;

function checkForNewEmails(callback) {
    var hasChanged = hasTitleBeenChanged();
    if (hasChanged) {
        callback();
    }

    setTimeout(function () {
        checkForNewEmails(callback);
    }, 1000);
}

function doWhenGmailIsLoaded(callback) {
    var loading = $('#loading:visible').length > 0;
    if (loading) {
        setTimeout(function () {
            doWhenGmailIsLoaded(callback);
        }, 1000);
    } else {
        callback();
    }
}

function hasTitleBeenChanged() {
    var hasChanged = title !== document.title;
    updateTitle();
    return hasChanged;
}

function updateTitle() {
    title = document.title;
}

// The background page is asking us to find an address on the page.
if (window == top) {
    updateTitle();
    checkForNewEmails(function () {
        //title 
        var match = /Inbox \(([0-9]+)\)/.exec(title);
        var isMatch = !!match;
        if (isMatch) {
            var tmpNOfEmails = parseInt(match[1]);
            if (tmpNOfEmails > nOfEmails) {
                console.log('number of emails: ' + tmpNOfEmails, ', we should do somthing when it increases');
                chrome.runtime.sendMessage({
                    'action': 'sourceRefresh',
                    'hostname': document.location.hostname
                });
            }

            if (tmpNOfEmails != nOfEmails) {
                nOfEmails = tmpNOfEmails;
            }
        }
    });

    $(document).ready(function () {
        chrome.runtime.sendMessage({
            'action': 'matched',
            'hostname': document.location.hostname
        });
    });

    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        console.log('onMessage', options.action, options);
        switch (options.action) {
            case 'resetSource':
                // TODO: As we are opening the tab, we know the id of it... we should match against that instead.
                if (document.location.toString().indexOf('source=noPass') >= 0) {
                    // if options.profileType.remindEmailDataSelector is set, use it to find our data...
                    if (options.profileType.remindEmailDataSelector) {
                        var work = function () {
                            var parseType = options.profileType.remindEmailDataType;
                            switch (parseType) {
                                case "element":
                                    var el = $(options.profileType.remindEmailDataSelector);
                                    if (el.length) {
                                        var attr = el.attr(options.profileType.remindEmailDataAttribute);
                                        sendResponse(attr);
                                    } else {
                                        // NOT a full email, ignore this,
                                    }
                                    break;

                                default:
                                    break;
                            }
                        };
                        setTimeout(function () {
                            doWhenGmailIsLoaded(work);
                        }, 1000);
                        return true;
                    }
                }
                sendResponse(false);
                break;
            default:
                break;
        }
    });
}
