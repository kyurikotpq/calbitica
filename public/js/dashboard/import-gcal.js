/**
 * Trigger the import of Google calender items to Habitica
 * AND syncing between Calbitica and Habitica
 */
function isFullSync() {
    // Syncing stuff
    let lastSync = sessionStorage.calbitLastSync
        ? JSON.parse(sessionStorage.calbitLastSync)
        : new Date().getTime();
    let fullSync = true;

    if (!lastSync) {
        let timeDiff = new Date() - lastSync;

        if (timeDiff < 60 * 1000)
            fullSync = false;
    }
    return fullSync;
}

// Google to Habitica Import
function gcalImport(firstLoad = false) {
    let fullSync = isFullSync();

    $.ajax({
        method: 'get',
        url: `api/cal/import?fullSync=${fullSync}`
    }).done(result => {
        sessionStorage.lastSync = new Date().getTime();

        // get the events again
        setTimeout(refreshCalendar, 1000);

        createToast('success', "Events synced successfully.");
    }).fail(err => {
        // Make a toast
        createToast('danger', err.message);
    })
}

// Button event listener
$(window).on("load", function () {
    $("#gCalImport").on("click", gcalImport);
});