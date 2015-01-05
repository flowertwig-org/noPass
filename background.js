var availableSites = {};
var availableSources = {};

var sites = {};
var sources = {};
var types = {};

var config = false;
var selectedId = null;
var tabs = {};
var selectedProfile = false;
var mailTimerId = false;

var selectedSource = false;
var selectedSourceName = false;

var pollIntervalMin = 1;  // 1 minute
var pollIntervalMax = 60;  // 1 hour
var requestTimeout = 1000 * 2;  // 2 seconds

function updateProfile(tabId) {
    chrome.tabs.sendMessage(tabId, { 'action': 'getPageType', 'types': types }, function (pageTypeId) {
        if (pageTypeId) {
            var selectedPageType = types[pageTypeId];
            switch (selectedPageType.type) {
                case 'site':
                    // If profile type was matching
                    var profile = getSite(selectedPageType.hostname);

                    if (!profile) {
                        chrome.pageAction.hide(tabId);
                    } else {
                        tabs[tabId] = profile.hostname;
                        console.info('updating tab[' + tabId + '] ' + profile.hostname);
                        sites[profile.hostname] = profile;

                        chrome.pageAction.show(tabId);
                        if (selectedId == tabId) {
                            updateSelected(tabId, profile.hostname);
                        }
                    }

                    if (profile.stored) {
                        chrome.tabs.sendMessage(tabId, { 'action': 'profile', 'profile': profile, 'profileType': availableSites[profile.hostname] }, function (closeWindow) {
                            if (closeWindow) {
                                console.error('waiting 10 sec until closing window.');
                                setTimeout(function () {
                                    console.error('closing window.');
                                    chrome.tabs.remove(tabId);
                                }, 10 * 1000);
                            }
                        });
                    }
                    break;
                case 'source':
                    console.log('Source:', selectedPageType);
                    console.info('Stored ProfileName for Source tab[' + tabId + '] ' + tabs[tabId]);
                    var tmpProfileTypeName = tabs[tabId];

                    chrome.tabs.sendMessage(tabId, { 'action': 'resetSource', 'profileType': availableSites[tmpProfileTypeName] }, function (closeWindow) {
                        if (closeWindow) {
                            console.error('link in email:', closeWindow);
                            //console.error('waiting 10 sec until closing window.');
                            //setTimeout(function () {
                            console.error('closing window.');
                            chrome.tabs.remove(tabId);
                            //}, 10 * 1000);
                        } else {
                            console.error('nothing returned from resetSource');
                        }
                    });
                    break;
                default:
                    break;
            }
        }
    });
}

function login(profile) {
    if (profile && profile.hostname) {
        var options = {
            'url': false,
            'active': false
        };

        var profileType = false;
        for (var profileTypeName in availableSites) {
            var tmpProfileType = availableSites[profileTypeName];
            if (tmpProfileType.hostname == profile.hostname) {
                options.url = tmpProfileType.remindUrl;
                profileType = tmpProfileType;
            }
        }

        // https://developer.chrome.com/extensions/tabs#method-create
        chrome.tabs.create(options, function (tab) {
            // TODO: Do stuff after new tab has been open.
            tabs[tab.id] = profileType.hostname;
            console.info('updating2 tab[' + tab.id + '] ' + profileType.hostname);
        });
    }
}

function saveProfile(profile) {
    if (profile && profile.hostname) {
        profile.stored = true;
        localStorage.setItem(profile.hostname, JSON.stringify(profile));
        sites[profile.hostname] = profile;
        // Yes... this is stupid... 
        selectedProfile = profile;
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

function updateSelected(tabId) {
    var profileName = tabs[tabId];
    selectedProfile = sites[profileName];
    if (selectedProfile) {
        chrome.pageAction.setTitle({ tabId: tabId, title: selectedProfile.name });
    }
}

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    if (change.status == "complete") {
        updateProfile(tabId);
    }
});

chrome.tabs.onSelectionChanged.addListener(function (tabId, info) {
    selectedId = tabId;
    updateSelected(tabId);
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    delete tabs[tabId];
});

// Ensure the current selected tab is set up.
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    updateProfile(tabs[0].id);
});

function scheduleRequest() {
    //console.log('scheduleRequest');
    var randomness = Math.random() * 2;
    var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
    var multiplier = Math.max(randomness * exponent, 1);
    var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
    delay = Math.round(delay);
    //console.log('Scheduling for: ' + delay);

    //console.log('Creating alarm');
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
        console.info('refresh was called.');
        selectedSource.refresh(
          function (count) {
              console.log("success: " + count);
          },
          function () {
              console.log("error!!");
          }
        );
    } else {
        console.info('unable to call refresh.');
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
    //console.log('onInit');
    localStorage.requestFailureCount = 0;  // used for exponential backoff
    startRequest({ scheduleRequest: true, showLoadingAnimation: true });
    chrome.alarms.create('watchdog', { periodInMinutes: 5 });
}

function onAlarm(alarm) {
    //console.log('Got alarm', alarm);
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
                //console.log(site.hostname, siteData);
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
                //console.log(site.hostname, siteData);
                var tmp = availableSources[source.hostname];
                source.refresh = tmp.refresh;
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
        console.log('Starting browser... updating icon.');
        startRequest({ scheduleRequest: false, showLoadingAnimation: false });
    });
}
