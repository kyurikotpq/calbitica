function updateStats(stats, scoreTask = false) {
    let maxHealth = (!scoreTask) ? stats.maxHealth : $(".label .max-health").text(),
        toNextLevel = (!scoreTask) ? stats.toNextLevel : $(".label .max-exp").text(),
        maxMP = (!scoreTask) ? stats.maxMP : $(".label .max-mana").text();

    $(".label .level").text(stats.lvl);
    $(".label .class").text(stats.class);

    $(".label .health").text(stats.hp);
    $(".label .max-health").text(maxHealth);
    $("#health-bar .progress-bar").css('width', (stats.hp / maxHealth * 100) + "%");


    $(".label .exp").text(stats.exp);
    $(".label .max-exp").text(toNextLevel);
    $("#exp-bar .progress-bar").css('width', (stats.exp / toNextLevel * 100) + "%");

    $(".label .mana").text(stats.mp);
    $(".label .max-mana").text(maxMP);
    $("#mana-bar .progress-bar").css('width', (stats.mp / maxMP * 100) + "%");
}


// Get the Habitica profile from my backend
function getProfile() {
    $.ajax({
        method: 'get',
        url: "/api/h/profile"
    }).done(r => {
        console.log(r);
        // Update the elements
        let stats = r.stats;
        updateStats(stats);

    }).fail(err => {
        console.log(err);
        // Make a toast
        createToast('danger', err.responseJSON.message);
    })
}

function toggleSleep() {
    $.ajax({
        url: '/api/h/sleep',
        method: 'get'
    })
        .done(result => {
            createToast("success", result.message);

            let addClassText = (result.sleep) ? "btn-danger" : "btn-primary",
                removeClassText = (result.sleep) ? "btn-primary" : "btn-danger",
                btnText = (result.sleep) ? "Resume Damage" : "Pause Damage";

            $('#sleep-btn').addClass(addClassText);
            $('#sleep-btn').removeClass(removeClassText);
            $('#sleep-btn').text(btnText);
        })
        .fail(err => {
            createToast("err", err.responseJSON.message);
        })
}