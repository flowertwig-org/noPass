var profile = false;

function map() {
    var h1 = document.getElementsByTagName('h1')[0];
    var userIdElement = document.getElementById('userid');
    var debugElement = document.getElementById('debug');

    var backgroundPage = chrome.extension.getBackgroundPage();

    //debugElement.textContent = JSON.stringify(profile) + "\r\n" + JSON.stringify(backgroundPage.selectedProfile) + "\r\n" + new Date().toString();

    profile = backgroundPage.selectedProfile;
    if (profile) {
        // Display Profile Name
        h1.textContent = profile.name;
        // Display user id
        if (profile.userId) {
            userIdElement.value = profile.userId;
        } else {
            userIdElement.value = '';
        }
        //switch (profile.status) {
        //    case 'loggedin':
        //        statusElement.textContent = 'using noPass';
        //        break;
        //    case 'loggedout':
        //        statusElement.textContent = 'noPass is not in use';
        //        break;
        //    default:
        //        statusElement.textContent = 'Unknown 1';
        //        break;
        //}
    }

    $('#updateUserId').on('click', function () {
        try {
            var userId = $('#userid').val();
            if (userId) {
                var backgroundPage = chrome.extension.getBackgroundPage();
                profile = backgroundPage.getSite(profile.hostname);
                profile.userId = userId;
                backgroundPage.saveProfile(profile);
                window.close();
            }
        } catch (ex) {
            var debugElement = document.getElementById('debug');
            debugElement.textContent = ex.toString();
        }
    });

    $('#login').on('click', function () {
        try {
            var backgroundPage = chrome.extension.getBackgroundPage();
            profile = backgroundPage.getSite(profile.hostname);
            backgroundPage.login(profile);
            window.close()
        } catch (ex) {
            var debugElement = document.getElementById('debug');
            debugElement.textContent = ex.toString();
        }
    });
}
window.onload = map;