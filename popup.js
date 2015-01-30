var profile = false;
var tabId = false;

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 **/
function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function (tabs) {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        //var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        //console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(tab);
    });
}

function onload() {
    var h1 = document.getElementsByTagName('h1')[0];
    var userIdElement = document.getElementById('userid');

    // TODO: Convert this to a sendMessage functionality instead (This is so it is easier to see dependency and to have all calls in one place)
    var backgroundPage = chrome.extension.getBackgroundPage();
    getCurrentTabUrl(function (tab) {
        tabId = tab.id;
        var pageTypeId = backgroundPage.getPageTypeByHostName(tab.url);
        profile = backgroundPage.getSite(pageTypeId);

        if (profile) {
            // Display Profile Name
            h1.textContent = profile.name;
            // Display user id
            if (profile.userId) {
                userIdElement.value = profile.userId;
            } else {
                userIdElement.value = '';
            }
        }

    });

    $('#updateUserId').on('click', function () {
        try {
            var userId = $('#userid').val();
            if (userId) {
                chrome.runtime.sendMessage({
                    'action': 'updateProfile',
                    'tabId': tabId,
                    'userId': userId
                });
                window.close();

                //var backgroundPage = chrome.extension.getBackgroundPage();
                //profile = backgroundPage.getSite(profile.hostname);
                //profile.userId = userId;
                //backgroundPage.saveProfile(profile);
                //window.close();
            }
        } catch (ex) { }
    });

    $('#login').on('click', function () {
        try {
            chrome.runtime.sendMessage({
                'action': 'login',
                'tabId': tabId
            });
            window.close()
        } catch (ex) { }
    });
}

onload();