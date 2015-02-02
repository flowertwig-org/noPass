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
            console.log('same tab');

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
                                'action': 'updateStatus',
                                'status': 'remindPassSubmit'
                            }, function () {
                                btn.click();
                            });
                        }
                    }
                    break;
                case 'remindPassSubmit':
                    var address = '' + document.location;
                    var isReminder = profile.remindUrl == address;

                    if (isReminder) {
                        chrome.runtime.sendMessage({
                            'action': 'updateStatus',
                            'status': 'remindPassSubmited'
                        }, function () {
                            chrome.runtime.sendMessage({
                                'action': 'closeTab',
                                'status': 'remindPassSubmited',
                                'tabId': progress.currentTab
                            });
                        });
                    }
                    break;
                case 'remindPassSubmited':
                    var address = '' + document.location;
                    if (address.indexOf('/yourpassword/') >= 0) {
                        $('.userinfo-chars').each(function () {
                            var $this = $(this);
                            var txt = $this.parent('li').text();
                            if (txt.indexOf('senord') >= 0) {
                                chrome.runtime.sendMessage({
                                    'action': 'updateData',
                                    'data': $this.text()
                                }, function () {
                                    chrome.runtime.sendMessage({
                                        'action': 'updateStatus',
                                        'status': 'changeDefaultPass'
                                    }, function () {
                                        document.location.assign('https://www.loopia.se/loggain/');
                                    });
                                });
                            }
                        });
                    }
                    break;
                case 'changeDefaultPass':
                    var address = '' + document.location;
                    if (address.indexOf('/loggain/') >= 0) {
                        var userIdElement = $('#i_username');
                        if (userIdElement.length) {
                            userIdElement.val(profile.userId);
                            var userPassElement = $('#i_password');
                            if (userPassElement.length) {
                                userPassElement.val(progress.data);
                                var form = userPassElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                chrome.runtime.sendMessage({
                                    'action': 'updateStatus',
                                    'status': 'changeDefaultPass2'
                                });
                                btn.click();
                            }
                        }
                    }
                    break;
                case 'changeDefaultPass2':
                    chrome.runtime.sendMessage({
                        'action': 'updateStatus',
                        'status': 'changeDefaultPass3'
                    }, function () {
                        document.location.assign('https://customerzone.loopia.se/account/');
                    });
                    break;
                case 'changeDefaultPass3':
                    var address = '' + document.location;
                    if (address.indexOf("/account/") >= 0) {
                        var userPassElement = $('#loopia_account_password_password');
                        if (userPassElement.length) {

                            // TODO: use settings for provider as input to genPass (Like password length and if it allows symbols)
                            chrome.runtime.sendMessage({
                                'action': 'genPass'
                            }, function (pass) {
                                chrome.runtime.sendMessage({
                                    'action': 'updateStatus',
                                    'status': 'passwordSet'
                                }, function () {
                                    userPassElement.val(pass);
                                    var form = userPassElement.parents('form');
                                    var btn = form.find('[type="submit"]');
                                    btn.click();

                                    var currentTab = progress.currentTab;
                                    // TODO: Using a timeout is just stupid, change it...
                                    // TODO: Update sourceTab (as we are now logged in)
                                    // TODO: remove progress information (as we are now done with logging in and changing password)
                                    setTimeout(function () {

                                        chrome.runtime.sendMessage({
                                            'action': 'loginDone'
                                        });
                                    }, 1000);
                                });
                            });
                        }
                    }
                    break;
            }
            console.log('matched', JSON.stringify(arguments));
        });
    });

    chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
        console.log('onMessage');
        switch (msg.action) {
            case 'loginDone':
                if (confirm('noPass login process finished.\r\nYou need to refresh page to be logged in.\r\nClick "OK" to refresh page.')) {
                    document.location.reload();
                }
                break;
            default:
                break;
        }

        sendResponse();
    });
}