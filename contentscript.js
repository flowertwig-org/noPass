//function doWhenGmailIsLoaded(callback) {
//    var loading = $('#loading:visible').length > 0;
//    if (loading) {
//        setTimeout(function () {
//            doWhenGmailIsLoaded(callback);
//        }, 100);
//    } else {
//        callback();
//    }
//}

// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
            //case 'resetSource':
            //    //debugger;
            //    // TODO: As we are opening the tab, we know the id of it... we should match against that instead.
            //    if (document.location.toString().indexOf('source=noPass') >= 0) {
            //        // if options.profileType.remindEmailDataSelector is set, use it to find our data...
            //        if (options.profileType.remindEmailDataSelector) {
            //            var work = function () {
            //                var link = $(options.profileType.remindEmailDataSelector);
            //                if (link.length) {
            //                    var href = link.attr('href');

            //                    //console.log('mouseover:', $('[title="Labels"]').length);
            //                    //$('[title="Labels"]').mouseover();
            //                    //$('[title="Labels"]').mousedown();
            //                    //$('[title="Labels"]').mouseup();
            //                    //$('[title="Labels"]').click();

            //                    ////var labelsBtn = $('[aria-label="Labels"]');
            //                    ////console.log('Labels:', labelsBtn.length);
            //                    ////labelsBtn.click();
            //                    //var element = $(document.activeElement);
            //                    //if (element.tagName.toLowerCase() === 'input') {
            //                    //    $(element).text('noPass');
            //                    //}
            //                    sendResponse(href);
            //                    return;
            //                } else {
            //                    // NOT a full email, ignore this,
            //                }
            //            };
            //            doWhenGmailIsLoaded(work);
            //        }
            //    }
            //    sendResponse(false);
            //    break;
            //case 'resetInfo':
            //    //alert('resetInfo:', options);
            //    setTimeout(function () { console.error('test'); }, 30 * 1000);
            //    alert('test');

            //    sendResponse(JSON.stringify(options));
            //    break;
            case 'getPageType':
                // Used to identify site against our profile types (So we know if we support it or not)
                var types = options.types;
                var pageType = getPageType(types);
//                alert('a5: ' + profileType);
                sendResponse(pageType);
                break;
            case 'profile':
                // Fill out remind of password form.
                //console.log('location : ' + document.location);
                //console.log('remindUrl: ' + options.profileType.remindUrl);
                var isReminder = options.profileType.remindUrl == document.location;
                //console.log("profile0: " + isReminder);
                if (isReminder) {
                    var profile = options.profile;
                    //var backgroundPage = chrome.extension.getBackgroundPage();
                    //var backgroundProfile = backgroundPage.availableSites[profile.hostname];
                    //if ('remindFunction' in backgroundProfile) {
                    //    backgroundProfile["remindFunction"](sendResponse);
                    //} else {
                    //    // TODO: Something is wrong!!
                    //    console.error('something is wrong');
                    //}

                    //eval(profile.remindFunction);
                    //console.log("profile1: " + profile.name);
                    switch (profile.name) {
                        case 'Loopia':
                            var userIdElement = $('#i_domain');
                            if (userIdElement.length) {
                                userIdElement.val(profile.userId);
                                var form = userIdElement.parents('form');
                                var btn = form.find('[type="submit"]');
                                btn.click();
                            }
                            sendResponse(true);
                            break;
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
