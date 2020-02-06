// Simple JS toasts
let TOASTS = [];
let TOAST_COUNT = -2;

// Create a toast
function createToast(type, message) {
    let markup = `<div class="toast toast-${type}">
                    <span>${message}<span>
                </div>`;
    let closeBtnMarkup = `<span class="toast-delete" data-count="${TOAST_COUNT}">&times;<span>`;

    let toast = $(markup),
        closeBtn = $(closeBtnMarkup);

    closeBtn.on("click", (e) => {
        let count = e.target.dataset.count;
        destroyToast(count, $(e.target));
    });

    toast.append(closeBtn);

    $('.toast-container').append(toast);

    let currentCount = TOAST_COUNT;
    setTimeout(() => { destroyToast(currentCount, closeBtn) }, 4000);
    
    TOASTS.push(TOAST_COUNT);
    TOAST_COUNT--;
}

// Remove the Toast
function destroyToast(count, closeBtn) {
    let index = TOASTS.indexOf(parseInt(count));

    if (index != -1) {
        TOASTS.splice(index, 1);
        closeBtn.parent().remove();
    }
}