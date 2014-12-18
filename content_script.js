// The background page is asking us to find an address on the page.
if (window == top) {
    chrome.extension.onMessage.addListener(function (options, sender, sendResponse) {
        switch (options.action) {
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
                        default:
                            break;
                    }
                }
                //alert('profile: ' + JSON.stringify(profile));
                sendResponse(isReminder);
                break;
            default:
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

//// Return null if none is found.
//var getProfile = function () {
//    var profile = {
//        'name': false
//    };

//    var hostname = document.location.hostname;
//    if (hostname.indexOf('github.com') >= 0) {
//        profile.name = "GitHub";
//    } else if (hostname.indexOf('facebook.com') >= 0) {
//        profile.name = "Facebook";
//    } else if (hostname.indexOf('hbonordic.com') >= 0) {
//        profile.name = "HBO Nordic";
//    } else if (hostname.indexOf('loopia.se') >= 0) {
//        profile.name = "Loopia";
//    } else if (hostname.indexOf('plex.tv') >= 0) {
//        profile.name = "Plex";
//    } else if (hostname.indexOf('netflix.com') >= 0) {
//        profile.name = "Netflix";
//    }

//    if (profile.name) {
//        var setup = localStorage.getItem(profile.name + "-setup");
//        switch (setup) {
//            case "1":
//                profile.setup = true;
//                break;
//            default:
//                profile.setup = false;
//                break;
//        }
//        var userId = localStorage.getItem(profile.name + "-user");
//        if (!userId) {
//            switch (profile.name) {
//                case 'GitHub':
//                    var userId = $('.header-logged-in .css-truncate-target').text();
//                    if (userId) {
//                        profile.userId = userId;
//                    }
//                    //var elements = document.getElementsByClassName('css-truncate-target');
//                    //if (elements.length > 0) {
//                    //    var span = elements[0];
//                    //    if (!span.children.length) {
//                    //        profile.userId = elements[0].textContent;
//                    //    }
//                    //}
//                    break;
//                case 'Facebook':
//                    //var userId = $('[role="navigation] a._2dpe _1ayn').attr('href');
//                    var userId = $('[role="navigation]').text();
//                    if (userId) {
//                        profile.userId = userId;
//                    }
//                    break;
//                default:
//                    break;
//            }
//        }
//    }

//    return profile;
//}

