(function (availableSources) {
    function getGmailUrl() {
        return "https://mail.google.com/mail/";
    }

    function getFeedUrl() {
        // "zx" is a Gmail query parameter that is expected to contain a random
        // string and may be ignored/stripped.
        return getGmailUrl() + "feed/atom?zx=noPass";
    }

    function gmailNSResolver(prefix) {
        if (prefix == 'gmail') {
            return 'http://purl.org/atom/ns#';
        }
    }

    function refresh(onSuccess, onError) {
        var xhr = new XMLHttpRequest();
        var abortTimerId = window.setTimeout(function () {
            xhr.abort();  // synchronously calls onreadystatechange
        }, requestTimeout);

        function handleSuccess(count) {
            localStorage.requestFailureCount = 0;
            window.clearTimeout(abortTimerId);
            if (onSuccess)
                onSuccess(count);
        }

        var invokedErrorCallback = false;
        function handleError() {
            ++localStorage.requestFailureCount;
            window.clearTimeout(abortTimerId);
            if (onError && !invokedErrorCallback)
                onError();
            invokedErrorCallback = true;
        }

        try {
            xhr.onreadystatechange = function () {
                if (xhr.readyState != 4)
                    return;

                if (xhr.responseXML) {
                    var xmlDoc = xhr.responseXML;

                    var entriesSet = xmlDoc.evaluate("/gmail:feed/gmail:entry",
                        xmlDoc, gmailNSResolver, XPathResult.ANY_TYPE, null);

                    var resetEntries = [];

                    var entry = false;
                    while (entry = entriesSet.iterateNext()) {
                        //console.log('entry: ', entry);
                        var id = false;
                        var title = false;
                        var sender = false;
                        var link = false;

                        var childCount = entry.childNodes.length;
                        for (var i = 0; i < childCount; i++) {
                            var child = entry.childNodes[i];
                            var tagName = child.tagName;
                            switch (tagName) {
                                case 'id':
                                    id = child.textContent;
                                    break;
                                case 'title':
                                    title = child.textContent;
                                    break;
                                case 'author':
                                    var authorChildCount = child.childNodes.length;
                                    for (var j = 0; j < authorChildCount; j++) {
                                        var authorChild = child.childNodes[j];
                                        var authorTagName = authorChild.tagName;
                                        switch (authorTagName) {
                                            case 'email':
                                                sender = authorChild.textContent;
                                                break;
                                            default:
                                                //console.log('author ' + authorTagName + ': ', authorChild);
                                                break;
                                        }
                                    }
                                    break;
                                case 'link':
                                    var attrCount = child.attributes.length;
                                    for (var x = 0; x < attrCount; x++) {
                                        var attr = child.attributes[x];
                                        switch (attr.name) {
                                            case 'href':
                                                // Replace "extsrc=atom" in: http://mail.google.com/mail?account_id=XXXXXXXXXXXXXXXXXXXX&message_id=ZZZZZZZZZZZZZZZZZZ&view=conv&extsrc=atom
                                                // with "extsrc=noPass". This way the window we open will have url simular to this:
                                                // https://mail.google.com/mail/u/0/?fs=1&source=noPass&tf=1#all/YYYYYYYYYYYYYYYYYYYYY
                                                // so we can keep track on what is ours.. :)
                                                link = attr.value.replace('extsrc=atom', 'extsrc=noPass');
                                                break;
                                            default:
                                                //console.log('link ' + attr.name + ': ', attr);
                                                break;
                                        }
                                    }
                                    break;
                                default:
                                    //console.log( tagName + ': ', child);
                                    break;
                            }
                        }

                        var resetEntry = {
                            'id': id,
                            'title': title,
                            'sender': sender,
                            'emailLink': link,
                            'profileType': false
                        };

                        var found = false;
                        for (var profileTypeName in availableSites) {
                            var profileType = availableSites[profileTypeName];
                            if (profileType.remindEmail === resetEntry.sender) {
                                switch (profileType.remindEmailHeaderMatch) {
                                    case 'contains':
                                        if (resetEntry.title.indexOf(profileType.remindEmailHeader) >= 0) {
                                            resetEntry.profileType = profileType;
                                            found = true;
                                        }
                                        break;
                                    case 'equal':
                                        if (profileType.remindEmailHeader === resetEntry.title) {
                                            resetEntry.profileType = profileType;
                                            found = true;
                                        }
                                        break;
                                    default:
                                        break;
                                }
                                break;
                            }
                        }

                        var isAlreadyInProgress = resetEntry.id in localStorage;

                        if (found && !isAlreadyInProgress) {
                            resetEntries.push(resetEntry);
                            var tmpProfileTypeName = resetEntry.profileType.hostname;
                            //console.log('tmp:', tmpProfileTypeName);
                            localStorage.setItem(resetEntry.id, '1');
                            chrome.tabs.create({
                                'url': resetEntry.emailLink,
                                'active': false
                            }, function (tab) {
                                tabs[tab.id] = tmpProfileTypeName;
                                // Update value for current Tab
                                progress[tmpProfileTypeName]['currentTab'] = tab.id;

                                // Update pageAction icon
                                updateStepAndStatus(progress[tmpProfileTypeName], 2, 1);
                                //console.info('updating3 tab[' + tab.id + '] ' + tmpProfileTypeName);
                            });
                            //console.info('entry', id, title, sender, link);
                        } else {
                            //console.log('entry', id, title, sender, link);
                        }
                        //console.log('id: ', id ? id : 'empty');
                        //console.log('title: ', title ? title : 'empty');
                        //console.log('sender: ', sender ? sender : 'empty');
                    }

                    handleSuccess(resetEntries.length);
                    return;
                }

                handleError();
            };

            xhr.onerror = function (error) {
                handleError();
            };

            xhr.open("GET", getFeedUrl(), true);
            xhr.send(null);
        } catch (e) {
            console.error("get gmail messages excetion: ", e);
            handleError();
        }
    }

    function onTabInit(tabId) {
        var tmpProfileTypeName = tabs[tabId];
        if (tmpProfileTypeName) {

            chrome.tabs.sendMessage(tabId, { 'action': 'resetSource', 'profileType': availableSites[tmpProfileTypeName] }, function (closeWindow) {
                if (closeWindow) {
                    // TODO: have site specific logic here..
                    // TODO: let content script return what type it found..
                    chrome.tabs.update(tabId, { 'url': closeWindow });
                } else {
                    console.error('nothing returned from resetSource');
                }
            });
        }
    }

    var source = availableSources["mail.google.com"] || {};
    source.refresh = refresh;
    source.init = onTabInit;
    availableSources["mail.google.com"] = source;
    
})(availableSources);
