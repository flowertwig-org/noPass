// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
            case 'profile':
                var profile = options.profile;
                switch (profile.hostname) {
                    case "github.com":
                        var address = '' + document.location;
                        // Fill out remind of password form.
                        var isReminder = options.profileType.remindUrl == document.location;
                        if (isReminder) {
                            var userIdElement = $('#email_field');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                        } else if (address.indexOf("/password_reset/") >= 0) {
                            var newPass = "N0tSoStrongPassw0rd";
                            var userPassElement = $('#password');
                            if (userPassElement.length) {
                                // TODO: Generate password
                                userPassElement.val(newPass);
                                var userPassElement2 = $('#password_confirmation');
                                if (userPassElement2.length) {
                                    // TODO: Generate password
                                    userPassElement2.val(newPass);
                                }
                                //var form = userPassElement.parents('form');
                                //var btn = form.find('[type="submit"]');
                                //btn.click();
                                //sendResponse(true);
                            }
                        }
                        break;
                    default:
                        break;
                }
                //alert('profile: ' + JSON.stringify(profile));
                sendResponse(isReminder);
                break;
            default:
                break;
        }
    });
}