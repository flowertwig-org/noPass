var availableSites = {};
var availableSources = {};

var sites = {};
var sources = {};
var types = {};
var progress = {};

var config = false;
var tabs = {};
var mailTimerId = false;

var selectedSource = false;
var selectedSourceName = false;

function getFileContent(path, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    var abortTimerId = window.setTimeout(function () {
        xhr.abort();  // synchronously calls onreadystatechange
    }, requestTimeout);

    function handleSuccess(count) {
        window.clearTimeout(abortTimerId);
        if (onSuccess)
            onSuccess(count);
    }

    var invokedErrorCallback = false;
    function handleError() {
        window.clearTimeout(abortTimerId);
        if (onError && !invokedErrorCallback)
            onError();
        invokedErrorCallback = true;
    }

    try {
        xhr.onreadystatechange = function () {
            if (xhr.readyState != 4)
                return;

            var data = xhr.responseText;
            if (data) {
                handleSuccess(data);
                return;
            }

            handleError();
        };

        xhr.onerror = function (error) {
            handleError();
        };

        xhr.open("GET", path, true);
        xhr.send(null);
    } catch (e) {
        console.error("get gmail messages excetion: ", e);
        handleError();
    }
}

function getPageTypeByHostName(hostname) {
    //console.log('getPageTypeByHostName', JSON.stringify(types));
    for (var typeId in types) {
        var pageType = types[typeId];
        if (hostname.indexOf(pageType.hostname) >= 0) {
            return pageType.hostname;
        }
    }
    return false;
}