// Keep track of the list of calendars
let CALENDARARR = null;

/**
 * v3 - helper functions
 */

/**
 * Convert Date string to suitable format
 * @param {String} str any MomentJS-parseable format
 */
function toYmdThisZ(str) {
    return moment(str).utc().toISOString();
}

/**
 * Calculate a suitable height of the calendar
 */
function getCalendarHeight() {
    return $(window).height() - $(".navbar").height() - (2 * 32);
}

/**
 * Calculate + set the modal position
 * and show it :)
 * @param {*} day 
 * @param {*} jsEvent 
 */
function openModal(day, jsEvent) {
    let columnWidth = $('.fc-axis.fc-time').width();
    let positionX = (day < 2) ? `left+${columnWidth}px` : `right-${columnWidth}px`;
    console.log(positionX);

    let mousePosY = jsEvent.clientY / $(window).height();
    let positionY = "bottom";
    if (mousePosY <= 0.4)
        positionY = "top";
    else if (mousePosY <= 0.65)
        positionY = "center";

    $("#myModal").dialog(
        "option",
        "position",
        {
            my: positionX + " " + positionY,
            at: "center",
            of: jsEvent.target
        }
    );

    setTimeout(() => {
        $('#myModal').dialog('open');
    }, 50);
}

/**
 * Transform data from API to 
 * suit the format of FullCalendar
 * @param {*} event 
 */
function transformData(event) {
    return {
        _id: event._id,
        id: event._id,
        habiticaID: event.habiticaID,
        title: event.summary,
        description: event.description,
        isDump: event.isDump,
        calendarID: event.calendarID,
        googleID: event.googleID,

        start: event.start.dateTime
            ? moment(event.start.dateTime).local()
            : moment(event.start.date).local(),

        end: event.end.dateTime
            ? moment(event.end.dateTime).local()
            : moment(event.end.date).local(),

        allDay: event.start.date != undefined,
        completed: event.completed,
    };
}

/**
 * Hide event details, show the event form
 */
function hideDetails() {
    $("#myModal .event-details").hide();
    $("#myModal .modal-header").hide();
    $("#myModal .event-form").show();
    $("#myModal + .ui-dialog-buttonpane").show();
}

/**
 * Show event details, hide the event form
 */
function showDetails() {
    $("#myModal .event-form").hide();
    $("#myModal + .ui-dialog-buttonpane").hide();
    $("#myModal .event-details").show();
    $("#myModal .modal-header").show();
}

/**
 * Refetch events from API and reset the form values
 */
function refreshCalendar() {
    $('#main-calendar').fullCalendar('refetchEvents');

    // reset values in form
    $("#myModal #event-form-title").val("");
    $("#myModal #event-form-location").text("");
    $("#myModal #event-form-startDate").val("");
    $("#myModal #event-form-startTime").val("");
    $("#myModal #event-form-endDate").val("");
    $("#myModal #event-form-endTime").val("");
    $("#myModal #event-form-calendarID").val("");
    $("#myModal #event-form-_id").val("");
    $("#myModal #event-form-googleID").text("");
    $("#myModal #event-form-allDay").val("");
}

/**
 * Interaction functions
 */

/**
 * Called when cells are selected
 * @param {*} start 
 * @param {*} end 
 * @param {*} jsEvent 
 */
function selectSection(start, end, jsEvent) {
    let allDay = !start.hasTime();

    // Set form values
    $("#myModal #event-form-startDate").val(start.format("DD/MM/YYYY"));
    $("#myModal #event-form-startTime").val(start.format("HH:mm"));
    $("#myModal #event-form-endDate").val(end.format("DD/MM/YYYY"));
    $("#myModal #event-form-endTime").val(end.format("HH:mm"));
    $("#myModal #event-form-allDay").val(allDay);

    $("#myModal #event-form-title").val("");
    $("#myModal #event-form-location").val("");

    // Hide event details
    hideDetails();

    // Open the modal
    openModal(start.day(), jsEvent);
}

/**
 * Called when an existing event is selected
 * @param {*} event 
 * @param {*} jsEvent 
 * @param {*} view 
 * @param {*} resourceObj 
 */
function clickOnEvent(event, jsEvent, view, resourceObj) {
    let start = event.start,
        end = event.end,
        allDay = !start.hasTime(),
        calendar = CALENDARARR.find(c => c.googleID == event.calendarID);

    $("#myModal #completed").val(event._id);

    if (event.completed != undefined && event.completed.status != undefined)
        $("#myModal #completed").prop("checked", event.completed.status);

    $("#myModal #event-details-title").text(event.title);
    $("#myModal #event-details-startDate").text(start.format("MMM D, YYYY"));
    $("#myModal #event-details-startTime").text(start.format("HH:mm"));
    $("#myModal #event-details-endDate").text(end.format("MMM D, YYYY"));
    $("#myModal #event-details-endTime").text(end.format("HH:mm"));
    $("#myModal #event-details-calendarID").text(calendar.summary);

    if (!event.location)
        $("#myModal .event-details-location").hide();
    else {
        $("#myModal .event-details-location").show();
        $("#myModal #event-details-location").text(event.location);
    }

    if (!allDay) {
        $("#myModal #event-details-startTime").show();
        $("#myModal #event-details-endTime").show();
    } else {
        $("#myModal #event-details-startTime").hide();
        $("#myModal #event-details-endTime").hide();
    }

    // Set values in the form!
    $("#myModal #event-form-title").val(event.title);
    $("#myModal #event-form-location").text(event.location);
    $("#myModal #event-form-startDate").val(start.format("DD/MM/YYYY"));
    $("#myModal #event-form-startTime").val(start.format("HH:mm"));
    $("#myModal #event-form-endDate").val(end.format("DD/MM/YYYY"));
    $("#myModal #event-form-endTime").val(end.format("HH:mm"));
    $("#myModal #event-form-calendarID").val(event.calendarID);
    $("#myModal #event-form-_id").val(event._id);
    $("#myModal #event-form-googleID").val(event.googleID);
    $("#myModal #event-form-allDay").val(allDay);

    // show the event details
    showDetails();

    openModal(event.start.day(), jsEvent);
}

/**
 * Ajax functions
 */

/**
 * Delete an event!
 */
function deleteEvent() {
    let id = $("#myModal #event-form-_id").val();
    $.ajax({
        url: `/api/calbit/${id}`,
        method: "delete",
    })
        .done(result => {
            $("#myModal").dialog("close");
            refreshCalendar();
            createToast("success", result.message);
        })
        .fail(err => {
            console.log(err);
            // Make a toast
            createToast('danger', err.message);
        })
}

/**
 * Called when event is resized & dragged.
 * 
 * Kinda falls under interaction functions as well
 * but there's an ajax call :)
 * @param {*} event 
 */
function modifyEvent(event) {
    let allDay = !event.start.hasTime(),
        start = (allDay)
            ? event.start.format("YYYY-MM-DD")
            : toYmdThisZ(event.start.format("YYYY-MM-DD HH:mm:ss")),
        end = (allDay)
            ? event.end.format("YYYY-MM-DD")
            : toYmdThisZ(event.end.format("YYYY-MM-DD HH:mm:ss"));

    let data = {
        _id: event._id,
        googleID: event.googleID,
        calendarID: event.calendarID,
        title: event.title,
        allDay,
        start,
        end,
    };

    $.ajax({
        url: `/api/calbit/${event._id}`,
        method: "put",
        data,
    })
        .done(result => {
            console.log(result);
            createToast('success', result.message);
            refreshCalendar();
        })
        .fail((err) => {
            createToast('danger', err.responseText);
        })
}

/**
 * Called when saving a new or existing event (triggered by button press)
 */
function saveEvent() {
    let title = $('#event-form-title').val();
    let allDay = $('#event-form-allDay').val() == 'true';

    let startDate = $('#event-form-startDate').val().split("/").reverse().join("-");
    let startTime = $('#event-form-startTime').val();
    let startDateTime = `${startDate}T${startTime}:00`;

    let endDate = $('#event-form-endDate').val().split("/").reverse().join("-");
    let endTime = $('#event-form-endTime').val();
    let endDateTime = `${endDate}T${endTime}:00`;

    let start = (allDay) ? startDate : toYmdThisZ(startDateTime),
        end = (allDay) ? endDate : toYmdThisZ(endDateTime);

    let location = $('#event-form-location').val();
    let calendarID = $('#event-form-calendarID').val();

    let calendar = CALENDARARR.find(c => c.googleID == calendarID);
    let display = (calendar) ? calendar.sync : false;

    if (!title || !startDate || !startTime || !endDate || !endTime) {
        alert("Please fill in the fields");
        return;

    } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date"
        || moment(endDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
        alert("Invalid Date and Time");
        return;

    } else if (moment(startDateTime) >= moment(endDateTime)) {
        alert("Start Date & Time must be before End Date & Time");
        return;

    }

    // Compile the data!
    let data = {
        title, location,
        allDay, calendarID,
        start, end, display,
        isDump: false
    }

    // Are we updating an event?
    let id = $('#myModal #event-form-_id').val();

    let method = (id != '') ? 'put' : "post";
    let url = '/api/calbit';
    if (id != '') url += `/${id}`;

    if (id != '')
        data.googleID = $('#event-form-googleID').val();

    $.ajax({
        url,
        method,
        data,
    })
        .done((messageObj) => {
            $('#myModal').dialog('close');
            createToast("success", messageObj.message);

            (id == '') ? setTimeout(refreshCalendar, 1000)
                : refreshCalendar();
        })
        .fail((err) => {
            createToast("danger", err.responseJSON.message);
        })
}

/**
 * MISCELLANEOUS
 */

/**
 * Modify the HTML markup of each event
 * @param {*} event 
 * @param {*} element 
 * @param {*} view 
 */
function renderEvent(event, element, view) {
    let diff = event.end.diff(event.start, "minutes");

    let start = (diff <= 30) ? event.start.format("ha") : event.start.format("h"),
        startWithA = event.start.format("HH:mm A"),
        end = event.end.format("ha"),
        endWithA = event.end.format("HH:mm A"),
        allDay = !event.start.hasTime();

    let markup = `<div class="fc-content">
                    <div class="fc-title">${event.title}</div>`;
    if (!allDay) {
        markup += `<div class="fc-time" data-start="${start}" data-full="${startWithA} - ${endWithA}">
                        <span>${start} - ${end}</span>
                    </div>`;
    }
    markup += "</div>";
    if (!allDay)
        markup += `<div class="fc-bg"></div>`;

    markup += `<div class="fc-resizer fc-end-resizer"></div>`;

    element[0].innerHTML = markup;
    return element;
}

/**
 * Initialise calendars on load
 */
$(document).ready(function () {
    CALENDARARR = JSON.parse($('#calendarJSON').html());

    // Event listeners on sleep buttons
    $('#sleep-btn').on("click", toggleSleep)

    $('#sidebar-calendar').fullCalendar({
        header: {
            left: 'title',
            center: '',
            right: 'prev,next'
        },
        fixedWeekCount: false,
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    });

    $('#main-calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaWeek,agendaDay,month,listWeek'
        },
        height: getCalendarHeight,
        defaultView: "agendaWeek",
        fixedWeekCount: false,
        navLinks: true,
        editable: true,
        selectable: true,
        nowIndicator: true,
        events: "/api/calbit",
        eventDataTransform: transformData,
        select: selectSection,
        eventRender: renderEvent,
        eventClick: clickOnEvent,
        eventResize: modifyEvent,
        eventDrop: modifyEvent,
    });

    $("#myModal").dialog({
        classes: {
            'ui-dialog-titlebar-close': 'btn',
        },
        buttons: [
            {
                'text': "Cancel",
                'click': function () { $(this).dialog("close"); },
                'class': 'btn',

            },
            {
                'text': "Save",
                'click': saveEvent,
                'class': 'btn btn-primary',
            }
        ],
        closeText: '×',
        draggable: true,
        autoOpen: false,
        width: 450,
    });

    $(".datepicker").datepicker({
        dateFormat: "dd/mm/yy"
    });

    // Event listeners on calendar icons
    $("#myModal #completed").on("change", function (e) {
        let eventID = $(this).val(),
            data = { status: $(this).prop('checked') };

        $.ajax({
            url: `/api/calbit/${eventID}/complete`,
            method: 'put',
            data
        }).done((result) => {
            createToast("success", result.message);

            $("#myModal").dialog("close");
            refreshCalendar();
            updateStats(result.stats, true);
        }).fail((err) => {
            createToast("danger", err.responseJSON.message);
            alert(err.responseText);
        })
    });

    $("#myModal .delete-icon").on("click", function (e) {
        deleteEvent();
    })

    $("#myModal .edit-icon").on("click", function (e) {
        hideDetails();
    })
})