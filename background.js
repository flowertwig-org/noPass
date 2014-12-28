var selectedId = null;
var profileTypes = {};
profileTypes['Facebook'] = {
    'name': 'Facebook',
    'hostname': 'facebook.com',
    'remindEmail': 'password+osscyc69@facebookmail.com',
    'remindEmailHeader': 'Somebody requested a new password for your Facebook account',
    'remindUrl': 'https://www.facebook.com/login/identify?ctx=recover'
};
profileTypes['GitHub'] = {
    'name': 'GitHub',
    'hostname': 'github.com',
    'remindEmail': 'noreply@github.com',
    'remindEmailHeader': '[GitHub] Please reset your password',
    'remindUrl': 'https://github.com/password_reset'
};
profileTypes['HBO Nordic'] = {
    'name': 'HBO Nordic',
    'hostname': 'hbonordic.com',
    'remindEmail': '',
    'remindEmailHeader': '',
    'remindUrl': 'http://hbonordic.se/web/hbo/home'
};
profileTypes['Loopia'] = {
    'name': 'Loopia',
    'hostname': 'loopia.se',
    'remindEmail': 'support@loopia.se',
    'remindEmailHeader': 'Användaruppgifter - Loopia Kundzon',
    'remindUrl': 'https://www.loopia.se/loggain/losenord/'
};
profileTypes['Plex'] = {
    'name': 'Plex',
    'hostname': 'plex.tv',
    'remindEmail': '',
    'remindEmailHeader': '',
    'remindUrl': 'https://plex.tv/users/password/new'
};
profileTypes['Netflix'] = {
    'name': 'Netflix',
    'hostname': 'netflix.com',
    'remindEmail': '',
    'remindEmailHeader': '',
    'remindUrl': 'https://www2.netflix.com/LoginHelp'
};
profileTypes['LinkedIn'] = {
    'name': 'LinkedIn',
    'hostname': 'linkedin.com',
    'remindEmail': '',
    'remindEmailHeader': '',
    'remindUrl': 'https://www.linkedin.com/uas/request-password-reset'
};
profileTypes['Tele2'] = {
    'name': 'Tele2',
    'hostname': 'tele2.se',
    'remindEmail': 'noreply@tele2.com',
    'remindEmailHeader': 'Nytt lösenord till Mitt Tele2',
    'remindUrl': 'https://www.tele2.se/logga-in/#forgotpassword'
};

var profiles = {};
var tabs = {};
var selectedProfile = false;
var test = false;
var mailTimerId = false;

function updateProfile(tabId) {
    chrome.tabs.sendMessage(tabId, { 'action': 'getProfileType', 'profileTypes': profileTypes }, function (profileTypeName) {
        var profile = getProfile(profileTypeName);

        if (!profile) {
            chrome.pageAction.hide(tabId);
        } else {
            tabs[tabId] = profile.name;
            profiles[profile.name] = profile;

            chrome.pageAction.show(tabId);
            if (selectedId == tabId) {
                updateSelected(tabId, profile.name);
            }
        }

        if (profile.stored) {
            chrome.tabs.sendMessage(tabId, { 'action': 'profile', 'profile': profile, 'profileType': profileTypes[profile.name] }, function (test) {
                // TODO: Do some crazy stuff here :)                
            });
        }
    });
}

function login(profile) {
    if (profile && profile.name) {
        var options = {
            'url': false,
            'active': false
        };

        for (var profileTypeName in profileTypes) {
            var profileType = profileTypes[profileTypeName];
            if (profileType.name == profile.name) {
                options.url = profileType.remindUrl;
            }
        }

        // https://developer.chrome.com/extensions/tabs#method-create
        chrome.tabs.create(options, function (tab) {
            // TODO: Do stuff after new tab has been open.
        });
    }
}

function saveProfile(profile) {
    if (profile && profile.name) {
        profile.stored = true;
        localStorage.setItem(profile.name, JSON.stringify(profile));
        profiles[profile.name] = profile;
        // Yes... this is stupid... 
        selectedProfile = profile;
    }
}

function getProfile(name) {
    var profile = false;
    var tmp = localStorage.getItem(name);
    if (tmp) {
        profile = JSON.parse(tmp);
    }

    if (!profile) {
        for (var profileTypeName in profileTypes) {
            var profileType = profileTypes[profileTypeName];
            if (profileType.name == name) {
                profile = {
                    'name': name,
                    'stored': false,
                    'setup': false,
                    'userId': false
                };
            }
        }

    }

    return profile;
}

function updateSelected(tabId) {
    var profileName = tabs[tabId];
    selectedProfile = profiles[profileName];
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
                    for (var profileTypeName in profileTypes) {
                        var profileType = profileTypes[profileTypeName];
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

                        chrome.tabs.create({
                            'url': resetEntry.emailLink,
                            'active': false
                        }, function (tab) {
                            var createdTabId = tab.id;
                            console.error('tab', tabs[createdTabId]);
                            var tmp = resetEntry;
                            chrome.tabs.sendMessage(createdTabId, { 'action': 'resetInfo', 'entry': resetEntry }, function (test) {
                                // TODO: Do some crazy stuff here :)
                                console.warn('resetInfo:', test);
                            });
                        });
                        console.info('entry', id, title, sender, link);
                    } else {
                        console.log('entry', id, title, sender, link);
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
    console.log('scheduleRequest');
    var randomness = Math.random() * 2;
    var exponent = Math.pow(2, localStorage.requestFailureCount || 0);
    var multiplier = Math.max(randomness * exponent, 1);
    var delay = Math.min(multiplier * pollIntervalMin, pollIntervalMax);
    delay = Math.round(delay);
    console.log('Scheduling for: ' + delay);

    console.log('Creating alarm');
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
    console.log('onInit');
    localStorage.requestFailureCount = 0;  // used for exponential backoff
    startRequest({ scheduleRequest: true, showLoadingAnimation: true });
    chrome.alarms.create('watchdog', { periodInMinutes: 5 });
}

function onAlarm(alarm) {
    console.log('Got alarm', alarm);
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