function doWhenGmailIsLoaded(callback) {
    var loading = $('#loading:visible').length > 0;
    if (loading) {
        setTimeout(function () {
            doWhenGmailIsLoaded(callback);
        }, 100);
    } else {
        callback();
    }
}

// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
            case 'getPageType':
                // Used to identify site against our profile types (So we know if we support it or not)
                var types = options.types;
                var pageType = getPageType(types);
                sendResponse(pageType);
                break;
            case 'resetSource':
                // TODO: As we are opening the tab, we know the id of it... we should match against that instead.
                if (document.location.toString().indexOf('source=noPass') >= 0) {
                    // if options.profileType.remindEmailDataSelector is set, use it to find our data...
                    if (options.profileType.remindEmailDataSelector) {
                        var work = function () {
                            var link = $(options.profileType.remindEmailDataSelector);
                            if (link.length) {
                                var href = link.attr('href');

                                //console.log('mouseover:', $('[title="Labels"]').length);
                                //$('[title="Labels"]').mouseover();
                                //$('[title="Labels"]').mousedown();
                                //$('[title="Labels"]').mouseup();
                                //$('[title="Labels"]').click();

                                ////var labelsBtn = $('[aria-label="Labels"]');
                                ////console.log('Labels:', labelsBtn.length);
                                ////labelsBtn.click();
                                //var element = $(document.activeElement);
                                //if (element.tagName.toLowerCase() === 'input') {
                                //    $(element).text('noPass');
                                //}
                                sendResponse(href);
                            } else {
                                // NOT a full email, ignore this,
                            }
                        };
                        setTimeout(function () {
                            doWhenGmailIsLoaded(work);
                        }, 2000);
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

function getPageType(types) {
    var hostname = document.location.hostname;
    for (var typeId in types) {
        var pageType = types[typeId];
        if (hostname.indexOf(pageType.hostname) >= 0) {
            return pageType.hostname;
        }
    }
    return false;
}
