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
            case 'profile':
                // Fill out remind of password form.
                var isReminder = options.profileType.remindUrl == document.location;
                if (isReminder) {
                    var profile = options.profile;
                    switch (profile.name) {
                        case "Netflix":
                            var userIdElement = $('#email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "Plex":
                            var userIdElement = $('#user_email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "GitHub":
                            var userIdElement = $('#email_field');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "Facebook":
                            // TODO: Facebook require more steps...
                            var userIdElement = $('#identify_email');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "LinkedIn":
                            var userIdElement = $('#email-requestPasswordReset');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "Tele2":
                            var userIdElement = $('#PasswordRecoveryModel_PasswordRecoveryEmail');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
                        case "CodeProject.com":
                            var userIdElement = $('input[id*="MC_Email"]');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');

                                // TODO: Add Captcha logic

                                //var btn = form.find('[type="submit"]');
                                //btn.click();
                            }
                            // TODO: Re add sendResponse logic
                            //sendResponse(true);
                            break;
                        default:
                            break;
                    }
                }
                //alert('profile: ' + JSON.stringify(profile));
                sendResponse(isReminder);
                break;
            default:
                //sendResponse('default result');
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
