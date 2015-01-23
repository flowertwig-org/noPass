// The background page is asking us to find an address on the page.
if (window == top) {

    $(document).ready(function () {
        chrome.runtime.sendMessage({
            'action': 'matched',
            'hostname': document.location.hostname
        }, function (options) {
            var profile = options.profile;
            var progress = options.progress;

            if (!progress) {
                return;
            }

            switch (progress.status) {
                case 'remindPass':
                    var address = '' + document.location;
                    var isReminder = profile.remindUrl == address;
                    if (isReminder) {
                        var userIdElement = $('#i_domain');
                        if (userIdElement.length) {
                            userIdElement.val(profile.userId);
                            var form = userIdElement.parents('form');
                            var btn = form.find('[type="submit"]');

                            chrome.runtime.sendMessage({
                                'action': 'remindPassSubmit',
                                'hostname': document.location.hostname
                            }, function () {
                                btn.click();
                            });
                        }
                    }
                    break;
                case 'remindPassSubmit':
                    var address = '' + document.location;
                    var isReminder = profile.remindUrl == address;
                    chrome.runtime.sendMessage({
                        'action': 'remindPassSubmited'
                    });
                    break;
                case 'remindPassSubmited':
                    break;
            }
            console.log('matched', JSON.stringify(arguments));
        });
    });

    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
            case 'profile':
                // Fill out remind of password form.
                var profile = options.profile;
                switch (profile.hostname) {
                    case "loopia.se":
                        var address = '' + document.location;
                        var isReminder = options.profileType.remindUrl == address;
                        if (isReminder) {
                            var userIdElement = $('#i_domain');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                        } else if (address.indexOf('/yourpassword/') >= 0) {
                            $('.userinfo-chars').each(function () {
                                var $this = $(this);
                                var txt = $this.parent('li').text();
                                if (txt.indexOf('senord') >= 0) {
                                    sendResponse($this.text());
                                }
                            });
                        } else if (address.indexOf('/loggain/') >= 0) {
                            var userIdElement = $('#i_username');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var userPassElement = $('#i_password');
                                if (userPassElement.length) {
                                    userPassElement.val(profile.pass);
                                    var form = userPassElement.parents('form');
                                    var btn = form.find('[type="submit"]');
                                    btn.click();
                                }
                            }
                            sendResponse(true);
                            //} else if (address.indexOf("https://customerzone.loopia.se/") >= 0) {
                            // TODO: Keep track of what step we are on, mostly so we only do this when we are in a reset password chain..
                            // TODO: Loopia.se has 8 char "long" passwords as default after a reset... this is just silly... make it more secure..
                        } else if (address.indexOf("/account/") >= 0) {
                            var userPassElement = $('#loopia_account_password_password');
                            if (userPassElement.length) {
                                // TODO: Generate password
                                userPassElement.val("N0tSoStrongPassw0rd");
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
                sendResponse(isReminder);
                break;
            default:
                break;
        }
    });
}