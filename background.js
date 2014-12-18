var selectedId = null;
var profileTypes = {};
profileTypes['Facebook'] = { 'name': 'Facebook', 'hostname': 'facebook.com', 'remindUrl': 'https://www.facebook.com/login/identify?ctx=recover' };
profileTypes['GitHub'] = { 'name': 'GitHub', 'hostname': 'github.com', 'remindUrl': 'https://github.com/password_reset' };
profileTypes['HBO Nordic'] = { 'name': 'HBO Nordic', 'hostname': 'hbonordic.com', 'remindUrl': 'http://hbonordic.se/web/hbo/home' };
profileTypes['Loopia'] = { 'name': 'Loopia', 'hostname': 'loopia.se', 'remindUrl': 'https://www.loopia.se/loggain/losenord/' };
profileTypes['Plex'] = { 'name': 'Plex', 'hostname': 'plex.tv', 'remindUrl': 'https://plex.tv/users/password/new' };
profileTypes['Netflix'] = { 'name': 'Netflix', 'hostname': 'netflix.com', 'remindUrl': 'https://www2.netflix.com/LoginHelp' };

var profiles = {};
var tabs = {};
var selectedProfile = false;
var test = false;

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
            'url': false
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

//function getProfileTypeFromHostName(hostname) {
//    if (hostname.indexOf('github.com') >= 0) {
//        return "GitHub";
//    } else if (hostname.indexOf('facebook.com') >= 0) {
//        return "Facebook";
//    } else if (hostname.indexOf('hbonordic.com') >= 0) {
//        return "HBO Nordic";
//    } else if (hostname.indexOf('loopia.se') >= 0) {
//        return "Loopia";
//    } else if (hostname.indexOf('plex.tv') >= 0) {
//        return "Plex";
//    } else if (hostname.indexOf('netflix.com') >= 0) {
//        return "Netflix";
//    } else {
//        return false;
//    }
//}

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
