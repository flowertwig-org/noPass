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

                            chrome.runtime.sendMessage({
                                'action': 'updateStatus',
                                'status': 'passwordSet'
                            }, function () {
                                // TODO: Generate password
                                userPassElement.val("N0tSoStrongPassw0rd2");
                                var form = userPassElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();

                                var currentTab = progress.currentTab;
                                // TODO: Using a timeout is just stupid, change it...
                                // TODO: Update sourceTab (as we are now logged in)
                                setTimeout(function () {
                                    chrome.runtime.sendMessage({
                                        'action': 'closeTab',
                                        'status': 'done',
                                        'tabId': currentTab
                                    });
                                }, 1000);
                            });
                        }
                    }
                    break;
                case 'passwordSet':
                    chrome.runtime.sendMessage({
                        'action': 'closeTab',
                        'status': 'done',
                        'tabId': progress.currentTab
                    });
                    break
            }
            console.log('matched', JSON.stringify(arguments));
        });
    });
}