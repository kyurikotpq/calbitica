/**
 * Attach listeners for toggling of sync for calendars
 * and run the import process
 */
$(window).on("load", function () {
    // Event Listeners for Calendar stuff
    $("input[name='isSynced']").on("change", function(e) {
        let checked = $(this)[0].checked,
            id = $(this)[0].id;
        console.log(checked);
        $.ajax({
            method: 'get',
            url: `/api/cal/sync/${id}?sync=${checked}`
        }).done(result => {
            // make a toast
            console.log(result);
            createToast('success', result.message);

            if(window.location.pathname == "/dashboard") {
                gcalImport(false);
            }
        }).fail(err => {
            console.log(err);
            // Make a toast
            createToast('danger', err.message);
        })
    });
});