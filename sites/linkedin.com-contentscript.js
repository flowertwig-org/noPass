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
            //console.log('same tab');

            switch (progress.status) {
                case 'remindPass':
                    var address = '' + document.location;
                    var isReminder = profile.remindUrl == address;
                    if (isReminder) {
                        var userIdElement = $('#email-requestPasswordReset');
                        if (userIdElement.length) {
                            userIdElement.val(profile.userId);
                            var form = userIdElement.parents('form');
                            var btn = form.find('[type="submit"]');

                            chrome.runtime.sendMessage({
                                'action': 'updateStatus',
                                'status': 'changeDefaultPass'
                            }, function () {
                                btn.click();
                                setTimeout(function () {
                                    chrome.runtime.sendMessage({
                                        'action': 'closeTab',
                                        'tabId': progress.currentTab
                                    });
                                }, 1000);
                            });
                        }
                    }
                    break;
                case 'changeDefaultPass':
                    var address = '' + document.location;
                    if (address.indexOf('/reset-password') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'genPass'
                        }, function (pass) {

                            var userPassElements = $('#new_password-newPassword-passwordReset,#new_password_again-newPassword-passwordReset');
                            userPassElements.val(pass);

                            chrome.runtime.sendMessage({
                                'action': 'updateData',
                                'data': pass
                            }, function () {
                                chrome.runtime.sendMessage({
                                    'action': 'updateStatus',
                                    'status': 'login'
                                }, function () {
                                    var form = userPassElements.parents('form');
                                    var btn = form.find('[type="submit"]');
                                    btn.click();
                                });
                            });
                        });
                    }
                    break;
                case 'login':
                    var address = '' + document.location;
                    if (address.indexOf('/reset-password-submit') >= 0) {
                        chrome.runtime.sendMessage({
                            'action': 'loginDone'
                        });
                    }
                    break;
            }
            console.log('matched', JSON.stringify(arguments));
        });
    });
}
