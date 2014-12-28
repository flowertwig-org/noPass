// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
            case 'resetInfo':
                //alert('resetInfo:', options);
                sendResponse(JSON.stringify(options));
                break;
            case 'getProfileType':
                var profileTypes = options.profileTypes;
                var profileType = getProfileType(profileTypes);
                sendResponse(profileType);
                break;
            case 'profile':
                console.log('location : ' + document.location);
                console.log('remindUrl: ' + options.profileType.remindUrl);
                var isReminder = options.profileType.remindUrl == document.location;
                console.log("profile0: " + isReminder);
                if (isReminder) {
                    var profile = options.profile;
                    console.log("profile1: " + profile.name);
                    switch (profile.name) {
                        case 'Loopia':
                            var userIdElement = $('#i_domain');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "Netflix":
                            var userIdElement = $('#email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "Plex":
                            var userIdElement = $('#user_email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "GitHub":
                            var userIdElement = $('#email_field');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "Facebook":
                            // TODO: Facebook require more steps...
                            var userIdElement = $('#identify_email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "LinkedIn":
                            var userIdElement = $('#email-requestPasswordReset');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        case "Tele2":
                            var userIdElement = $('#PasswordRecoveryModel_PasswordRecoveryEmail');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            } else {
                                window.close();
                            }
                            break;
                        default:
                            break;
                    }
                }
                //alert('profile: ' + JSON.stringify(profile));
                sendResponse(isReminder);
                break;
            default:
                sendResponse('default result');
                break;
        }
    });
}

var getProfileType = function (profileTypes) {
    var hostname = document.location.hostname;
    for (var profileTypeName in profileTypes) {
        var profileType = profileTypes[profileTypeName];
        if (hostname.indexOf(profileType.hostname) >= 0) {
            return profileType.name;
        }
    }
}
