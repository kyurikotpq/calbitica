// Save settings onclick
$(window).on('load', function() {
    $("#saveSettings").on("click", function() {
        const hUserID = $("#hUserID").val();
        const apiKey = $('#apiKey').val();
        let data = { };

        if(hUserID) data.hUserID = hUserID.replace(/[<>!*&^%$/.,'"=?`~|\\/; ]/g, "");
        if(apiKey) data.apiKey = apiKey.replace(/[<>!*&^%$/.,'"=?`~|\\/; ]/g, "");
        
        $.ajax({
            url: "api/settings/habitica",
            method: "post",
            data,
        }) // create toasts
        .done((result) => {
            console.log(result);
            createToast('success', result.message);
        })
        .fail((err) => {
            console.log(err);
            createToast('danger', err.responseJSON.message);
        })
    })
})
