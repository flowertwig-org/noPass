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
                        var userIdElement = $('#identify_email');
                        if (userIdElement.length) {
                            userIdElement.val(profile.userId);
                            chrome.runtime.sendMessage({
                                'action': 'updateStatus',
                                'status': 'remindPass2'
                            }, function () {
                                var submitBtn = userIdElement.parents('form').find('input[type=submit]');
                                submitBtn.click();
                                setTimeout(function () {
                                    chrome.runtime.sendMessage({
                                        'action': 'closeTab',
                                        'tabId': progress.currentTab
                                    });
                                }, 2000);
                            });
                        }
                    }
                    break;
                case 'remindPass2':
                    var address = '' + document.location;
                    if (address.indexOf('/recover/initiate') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'updateStatus',
                            'status': 'remindPass3'
                        }, function () {
                            var submitBtn = $(document.getElementsByName('reset_action')[0]);
                            if (submitBtn.length) {
                                submitBtn.click();
                                setTimeout(function () {
                                    chrome.runtime.sendMessage({
                                        'action': 'closeTab',
                                        'tabId': progress.currentTab
                                    });
                                }, 2000);
                            }
                        });
                    }
                    break;
                case 'remindPass3':
                    var address = '' + document.location;
                    if (address.indexOf('/recover/code') >= 0) {
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
                    if (address.indexOf('/recover/password') >= 0) {

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
                                var submitBtn = userPassElement.parents('form').find('input[type=submit]');
                                submitBtn.click();
                            });
                        });
                    }
                    break;
                case 'passwordSet':
                    // Don't care about the address, we are already checking tabid above so.. :)
                    chrome.runtime.sendMessage({
                        'action': 'loginDone'
                    });
                    break;
            }
        });
    });
}