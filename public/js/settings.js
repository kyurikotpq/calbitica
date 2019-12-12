$(window).on('load', function() {
    $("#saveSettings").on("click", function() {
        const userID = $("#userID").val();
        const apiKey = $('#apiKey').val();
        let data = { };

        if(userID) data.userID = userID;
        if(apiKey) data.apiKey = apiKey;
        
        $.ajax({
            url: "/api/settings/habitica",
            method: "post",
            data,
        }) // create toasts
        .done((result) => {
            console.log(result);
            
        })
        .fail((err) => {
            console.log(err);
        })
    })
})
