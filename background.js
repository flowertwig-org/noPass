var selectedId = null;
var tabs = {};
var selectedProfile = false;
var mailTimerId = false;

var selectedSource = false;
var selectedSourceName = false;

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
            //site['remindFunction'] = JSON.stringify(availableSite['remindFunction']);
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

var pollIntervalMin = 1;  // 1 minute
var pollIntervalMax = 60;  // 1 hour
var requestTimeout = 1000 * 2;  // 2 seconds

function getGmailUrl() {
    return "https://mail.google.com/mail/";
}

function getFeedUrl() {
    // "zx" is a Gmail query parameter that is expected to contain a random
    // string and may be ignored/stripped.
    return getGmailUrl() + "feed/atom?zx=noPass"; // + encodeURIComponent(getInstanceId());
}

function gmailNSResolver(prefix) {
    if (prefix == 'gmail') {
        return 'http://purl.org/atom/ns#';
    }
}

function getInboxCount(onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    var abortTimerId = window.setTimeout(function () {
        xhr.abort();  // synchronously calls onreadystatechange
    }, requestTimeout);

    function handleSuccess(count) {
        localStorage.requestFailureCount = 0;
        window.clearTimeout(abortTimerId);
        if (onSuccess)
            onSuccess(count);
    }

    var invokedErrorCallback = false;
    function handleError() {
        ++localStorage.requestFailureCount;
        window.clearTimeout(abortTimerId);
        if (onError && !invokedErrorCallback)
            onError();
        invokedErrorCallback = true;
    }

    try {
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4)
                return;

            if (xhr.responseXML) {
                var xmlDoc = xhr.responseXML;

                var entriesSet = xmlDoc.evaluate("/gmail:feed/gmail:entry",
                    xmlDoc, gmailNSResolver, XPathResult.ANY_TYPE, null);

                var resetEntries = [];

                var entry = false;
                while (entry = entriesSet.iterateNext()) {
                    //console.log('entry: ', entry);
                    var id = false;
                    var title = false;
                    var sender = false;
                    var link = false;

                    var childCount = entry.childNodes.length;
                    for (var i = 0; i < childCount; i++) {
                        var child = entry.childNodes[i];
                        var tagName = child.tagName;
                        switch (tagName) {
                            case 'id':
                                id = child.textContent;
                                break;
                            case 'title':
                                title = child.textContent;
                                break;
                            case 'author':
                                var authorChildCount = child.childNodes.length;
                                for (var j = 0; j < authorChildCount; j++) {
                                    var authorChild = child.childNodes[j];
                                    var authorTagName = authorChild.tagName;
                                    switch (authorTagName) {
                                        case 'email':
                                            sender = authorChild.textContent;
                                            break;
                                        default:
                                            //console.log('author ' + authorTagName + ': ', authorChild);
                                            break;
                                    }
                                }
                                break;
                            case 'link':
                                var attrCount = child.attributes.length;
                                for (var x = 0; x < attrCount; x++) {
                                    var attr = child.attributes[x];
                                    switch (attr.name) {
                                        case 'href':
                                            // Replace "extsrc=atom" in: http://mail.google.com/mail?account_id=XXXXXXXXXXXXXXXXXXXX&message_id=ZZZZZZZZZZZZZZZZZZ&view=conv&extsrc=atom
                                            // with "extsrc=noPass". This way the window we open will have url simular to this:
                                            // https://mail.google.com/mail/u/0/?fs=1&source=noPass&tf=1#all/YYYYYYYYYYYYYYYYYYYYY
                                            // so we can keep track on what is ours.. :)
                                            link = attr.value.replace('extsrc=atom', 'extsrc=noPass');
                                            break;
                                        default:
                                            //console.log('link ' + attr.name + ': ', attr);
                                            break;
                                    }
                                }
                                break;
                            default:
                                //console.log( tagName + ': ', child);
                                break;
                        }
                    }

                    var resetEntry = {
                        'id': id,
                        'title': title,
                        'sender': sender,
                        'emailLink': link,
                        'profileType': false
                    };

                    var found = false;
                    for (var profileTypeName in availableSites) {
                        var profileType = availableSites[profileTypeName];
                        if (profileType.remindEmail === resetEntry.sender) {
                            if (profileType.remindEmailHeader === resetEntry.title) {
                                resetEntry.profileType = profileType;
                                found = true;
                                //} else {
                                //    console.log(profileType.remindEmailHeader + ' === ' + resetEntry.title);
                            }
                            break;
                        }
                    }

                    if (found) {
                        resetEntries.push(resetEntry);
                        var tmpProfileTypeName = resetEntry.profileType.hostname;
                        //console.log('tmp:', tmpProfileTypeName);
                        chrome.tabs.create({
                            'url': resetEntry.emailLink,
                            'active': false
                        }, function (tab) {
                            tabs[tab.id] = tmpProfileTypeName;
                            //console.info('updating3 tab[' + tab.id + '] ' + tmpProfileTypeName);
                        });
                        //console.info('entry', id, title, sender, link);
                    } else {
                        //console.log('entry', id, title, sender, link);
                    }
                    //console.log('id: ', id ? id : 'empty');
                    //console.log('title: ', title ? title : 'empty');
                    //console.log('sender: ', sender ? sender : 'empty');
                }

                handleSuccess(resetEntries.length);
                return;
            }

            handleError();
        };

        xhr.onerror = function (error) {
            handleError();
        };

        xhr.open("GET", getFeedUrl(), true);
        xhr.send(null);
    } catch (e) {
        console.error("get gmail messages excetion: ", e);
        handleError();
    }
}

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

    getInboxCount(
      function (count) {
          console.log("success: " + count);
      },
      function () {
          console.log("error!!");
      }
    );
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

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);

if (chrome.runtime && chrome.runtime.onStartup) {
    chrome.runtime.onStartup.addListener(function () {
        console.log('Starting browser... updating icon.');
        startRequest({ scheduleRequest: false, showLoadingAnimation: false });
    });
}

function createTypesConfig() {
    for (var availableSiteId in availableSites) {
        var availableSite = availableSites[availableSiteId];
        types[availableSite.hostname] = { 'hostname': availableSite.hostname, 'type': 'site' };
    }

    for (var availableSourceId in availableSources) {
        var availableSource = availableSources[availableSourceId];
        types[availableSource.hostname] = { 'hostname': availableSource.hostname, 'type': 'source' };
    }
}

function setSelectedSource(selectedSourceName) {
    selectedSource = availableSources[selectedSourceName];
}

function setSelectedSourceName(selectedSourceName) {
    localStorage.setItem("selectedSource", selectedSourceName);
    setSelectedSource(selectedSourceName);
}

var selectedSourceName = localStorage.getItem("selectedSource");
if (!selectedSourceName) {
    // https://developer.chrome.com/extensions/tabs#method-create
    var options = { 'url': chrome.runtime.getURL('setup.html') };
    chrome.tabs.create(options, function (tab) { });
} else {
    setSelectedSource(selectedSourceName);
}

createTypesConfig();
