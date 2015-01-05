chrome.runtime.getBackgroundPage(function (backgroundPage) {
    // List available sources
    var sources = backgroundPage.availableSources;
    var select = $('select');
    var hasSources = false;
    for (var sourceId in sources) {
        var source = sources[sourceId];
        select.append($('<option>', { 'value': source.hostname, 'text': source.name }));
        hasSources = true;
    }

    // Make select button visible if we have one or more sources for user to choose from.
    if (hasSources) {
        $('form').css('display', '');
    }

    $('button').on('click', function () {
        var select = $('select');
        backgroundPage.setSelectedSourceName(select.val());
        window.close();
    });
});
