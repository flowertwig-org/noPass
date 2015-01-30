var pollIntervalMin = 1;  // 1 minute
var pollIntervalMax = 60;  // 1 hour
var requestTimeout = 1000 * 2;  // 2 seconds

function onMatched(hostName, tabId, sendResponse) {
    var pageTypeId = getPageTypeByHostName(hostName);
    var selectedPageType = types[pageTypeId];

    switch (selectedPageType.type) {
        case 'site':
            // If site type was matching
            var site = getSite(selectedPageType.hostname);

            if (!site) {
                chrome.pageAction.hide(tabId);
            } else {
                tabs[tabId] = site.hostname;
                sites[site.hostname] = site;

                chrome.pageAction.show(tabId);

                var test = progress[site.hostname];
                sendResponse({ 'profile': site, 'progress': test, 'tabId': tabId });
            }
            break;
        case 'source':
            var source = availableSources[selectedPageType.hostname];
            if (source) {
                source.testing(tabId);
            }
            break;
        default:
            break;
    }
}

function onUpdateStatus(tabId, status, sendResponse) {
    // Content script should only be able to update their own status
    var hostname = tabs[tabId];
    progress[hostname]['status'] = status;
    if (sendResponse && typeof (sendResponse) === 'function') {
        sendResponse();
    }
}

function onUpdateData(tabId, data, sendResponse) {
    console.log('onUpdateData');
    // Content script should only be able to update their own data
    var hostname = tabs[tabId];
    progress[hostname]['data'] = data;
    if (sendResponse && typeof (sendResponse) === 'function') {
        console.log('onUpdateData', data);
        sendResponse();
    }
}

function onLogin(tabId) {
    var hostname = tabs[tabId];
    var site = getSite(hostname);

    if (site && site.hostname) {
        var options = {
            'url': false,
            'active': false
        };
        progress[site.hostname] = { 'status': 'remindPass', 'sourceTabId': tabId };

        var profileType = false;
        for (var profileTypeName in availableSites) {
            var tmpProfileType = availableSites[profileTypeName];
            if (tmpProfileType.hostname == site.hostname) {
                options.url = tmpProfileType.remindUrl;
                profileType = tmpProfileType;
            }
        }

        // https://developer.chrome.com/extensions/tabs#method-create
        chrome.tabs.create(options, function (tab) {
            // TODO: Do stuff after new tab has been open.
            tabs[tab.id] = profileType.hostname;
            progress[site.hostname]['currentTab'] = tab.id;
        });
    }
}

// update site profile and stores it
function onUpdateProfile(tabId, userId) {
    var hostname = tabs[tabId];
    var site = getSite(hostname);

    if (site && site.hostname) {
        site.userId = userId;
        saveProfile(site);
    }
}

function onOpenTab(tabId, url, sendResponse) {
    var options = {
        'url': url,
        'active': false
    };

    // https://developer.chrome.com/extensions/tabs#method-create
    chrome.tabs.create(options, function (tab) {
        sendResponse(tab);
    });
}

function onCloseTab(tabId, sendResponse) {
    delete tabs[tabId];
    chrome.tabs.remove(tabId);
    sendResponse();
}

// listening on actions from popup and contentscripts
chrome.runtime.onMessage.addListener(function (options, sender, sendResponse) {
    var tabId = false;
    if (sender.tab) {
        // Calls from tabs
        tabId = sender.tab.id;
    } else {
        // Calls from popup
        tabId = options.tabId;
    }

    switch (options.action) {
        case 'matched':
            onMatched(options.hostname, tabId, sendResponse);
            return true;
            //break;
        case 'openTab':
            onOpenTab(tabId, options.url, sendResponse);
            break;
        case 'closeTab':
            onCloseTab(options.tabId, sendResponse);
            break;
        case 'updateProfile':
            onUpdateProfile(tabId, options.userId, sendResponse);
            break;
        case 'updateStatus':
            onUpdateStatus(tabId, options.status, sendResponse);
            break;
        case 'updateData':
            onUpdateData(tabId, options.data, sendResponse);
            break;
        case 'login':
            // 1. open remindPass url
            // 2. change status
            onLogin(tabId, sendResponse);
            break;
        case 'genPass':
            onGeneratePassword(tabId, sendResponse);
            break;
        case 'updateProfile':
            onUpdateProfile(tabId, options.userId, sendResponse);
            return true;
            //break;
    }
});

function saveProfile(profile) {
    if (profile && profile.hostname) {
        profile.stored = true;
        localStorage.setItem(profile.hostname, JSON.stringify(profile));
        sites[profile.hostname] = profile;
        // Yes... this is stupid... 
    }
}

function getSite(id) {
    var site = false;
    var tmp = localStorage.getItem(id);
    if (tmp) {
        site = JSON.parse(tmp);
    }

    if (!site) {
        site = {
            'hostname': id,
            'name': id,
            'stored': false,
            'setup': false,
            'userId': false
        };
    }

    for (var siteId in availableSites) {
        var availableSite = availableSites[siteId];
        if (availableSite.hostname == id) {
            for (var propName in availableSite) {
                site[propName] = availableSite[propName]
            }
        }
    }

    return site;
}

chrome.tabs.onSelectionChanged.addListener(function (tabId, info) {
    selectedId = tabId;
    //updateSelected(tabId);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    delete tabs[tabId];
});

function scheduleRequest() {
    var randomness = Math.random() * 2;
    var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
    var multiplier = Math.max(randomness * exponent, 1);
    var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
    delay = Math.round(delay);

    // Use a repeating alarm so that it fires again if there was a problem
    // setting the next alarm.
    chrome.alarms.create('refresh', { periodInMinutes: delay });
}

function startRequest(params) {
    // Schedule request immediately. We want to be sure to reschedule, even in the
    // case where the extension process shuts down while this request is
    // outstanding.
    if (params && params.scheduleRequest) scheduleRequest();

    if (selectedSource) {
        selectedSource.refresh(
          function (count) {
              //console.log("success: " + count);
          },
          function () {
              //console.log("error!!");
          }
        );
    }
}

function onWatchdog() {
    chrome.alarms.get('refresh', function (alarm) {
        if (alarm) {
            console.log('Refresh alarm exists. Yay.');
        } else {
            console.log('Refresh alarm doesn\'t exist!? ' +
                        'Refreshing now and rescheduling.');
            startRequest({ scheduleRequest: true, showLoadingAnimation: false });
        }
    });
}

function onInit() {
    init();
    localStorage.requestFailureCount = 0;  // used for exponential backoff
    startRequest({ scheduleRequest: true, showLoadingAnimation: true });
    chrome.alarms.create('watchdog', { periodInMinutes: 5 });
}

function onAlarm(alarm) {
    // |alarm| can be undefined because onAlarm also gets called from
    // window.setTimeout on old chrome versions.
    if (alarm && alarm.name == 'watchdog') {
        onWatchdog();
    } else {
        startRequest({ scheduleRequest: true, showLoadingAnimation: false });
    }
}

function setSelectedSource(selectedSourceName) {
    selectedSource = availableSources[selectedSourceName];
}

function setSelectedSourceName(sourceName) {
    selectedSourceName = sourceName;
    localStorage.setItem("selectedSource", sourceName);
    setSelectedSource(sourceName);
}

function initConfig() {
    var path = chrome.extension.getURL("config.json");
    getFileContent(path, function (data) {
        config = JSON.parse(data);
        // load available sites

        for (var siteIndex in config.sites) {
            var siteId = config.sites[siteIndex];
            var sitePath = chrome.extension.getURL("sites/" + siteId + "-config.json");
            getFileContent(sitePath, function (siteData) {
                var site = JSON.parse(siteData);
                availableSites[site.hostname] = site;
                types[site.hostname] = { 'hostname': site.hostname, 'type': 'site' };
            }, function () { });
        }

        // load sources
        for (var sourceIndex in config.sources) {
            var sourceId = config.sources[sourceIndex];
            var sourcesPath = chrome.extension.getURL("sources/" + sourceId + "-config.json");
            getFileContent(sourcesPath, function (sourceData) {
                var source = JSON.parse(sourceData);

                var tmp = availableSources[source.hostname];
                source.refresh = tmp.refresh;
                source.testing = tmp.testing;
                availableSources[source.hostname] = source;
                types[source.hostname] = { 'hostname': source.hostname, 'type': 'source' };
            }, function () { });
        }
    }, function () { });
}

function checkForSource() {
    if (selectedSourceName in availableSources) {
        setSelectedSource(selectedSourceName);
    } else {
        setTimeout(checkForSource, 100);
    }
}

function init() {
    selectedSourceName = localStorage.getItem("selectedSource");
    if (!selectedSourceName) {
        // https://developer.chrome.com/extensions/tabs#method-create
        var options = { 'url': chrome.runtime.getURL('setup.html') };
        chrome.tabs.create(options, function (tab) { });
    } else {
        checkForSource();
    }

    initConfig();
}

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);

if (chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(function () {
        init();
        startRequest({ scheduleRequest: false, showLoadingAnimation: false });
    });
}
