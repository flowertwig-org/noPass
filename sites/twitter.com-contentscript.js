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

            // If tab id doesn't match we are not interested (This is to make sure we are not changing any of the tabs our user is using
            if (progress.currentTab != options.tabId) {
                return;
            }

            switch (progress.status) {
                case 'remindPass':
                    var address = '' + document.location;
                    var isReminder = profile.remindUrl == address;
                    if (isReminder) {
                        var userIdElement = $('input[type=text]');
                        if (userIdElement.length) {
                            userIdElement.val(profile.userId);
                            chrome.runtime.sendMessage({
                                'action': 'updateStatus',
                                'status': 'remindPass2'
                            }, function () {
                                var submitBtn = userIdElement.parents('form').find('input[type=submit]');
                                submitBtn.click();
                            });
                        }
                    }
                    break;
                case 'remindPass2':
                    var address = '' + document.location;
                    if (address.indexOf('/send_password_reset') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'updateStatus',
                            'status': 'remindPass3'
                        }, function () {
                            var submitBtn = $('input[type=submit]');
                            submitBtn.click();
                        });
                    }
                    break;
                case 'remindPass3':
                    var address = '' + document.location;
                    if (address.indexOf('/reset_email_sent') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'updateStatus',
                            'status': 'remindPassSubmited'
                        }, function () {
                            chrome.runtime.sendMessage({
                                'action': 'closeTab',
                                'tabId': progress.currentTab
                            });
                        });
                    }
                    break;
                case 'remindPassSubmited':
                    chrome.runtime.sendMessage({
                        'action': 'iconUpdate',
                        'step': 4,
                        'status': 1
                    });
                    var address = '' + document.location;
                    if (address.indexOf('/reset_password') >= 0) {

                        // TODO: use settings for provider as input to genPass (Like password length and if it allows symbols)
                        chrome.runtime.sendMessage({
                            'action': 'genPass'
                        }, function (pass) {
                            chrome.runtime.sendMessage({
                                'action': 'updateStatus',
                                'status': 'passwordSet'
                            }, function () {
                                var userPassElement = $('input[type=password]');
                                userPassElement.val(pass);
                                // twitter is demanding calculating password strenght and they are doing that one change event.
                                userPassElement.change();
                                var submitBtn = userPassElement.parents('form').find('input[type=submit]');
                                setTimeout(function () {
                                    submitBtn.click();
                                }, 500);
                            });
                        });
                    }
                    break;
                case 'passwordSet':
                    var address = '' + document.location;
                    if (address.indexOf('/password_reset_complete') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'updateStatus',
                            'status': 'passwordFinished'
                        }, function () {
                            chrome.runtime.sendMessage({
                                'action': 'loginDone'
                            });
                        });
                    }
                    break;
            }
        });
    });
}