let CALENDARARR = null;

/**
 * v3 - helper functions
 */
function toYmdThisZ(str) {
    return moment(str).utc().toISOString();
}

function getCalendarHeight() {
    return $(window).height() - $(".navbar").height() - (2 * 32);
}
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
function hideDetails() {
    // Hide the details, show the form
    $("#myModal .event-details").hide();
    $("#myModal .modal-header").hide();
    $("#myModal .event-form").show();
    $("#myModal + .ui-dialog-buttonpane").show();
}

function showDetails() {
    // Hide the form, show the details
    $("#myModal .event-form").hide();
    $("#myModal + .ui-dialog-buttonpane").hide();
    $("#myModal .event-details").show();
    $("#myModal .modal-header").show();
}

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

    $("#myModal #event-form-startDate").val(start.format("DD/MM/YYYY"));
    $("#myModal #event-form-startTime").val(start.format("HH:mm"));
    $("#myModal #event-form-endDate").val(end.format("DD/MM/YYYY"));
    $("#myModal #event-form-endTime").val(end.format("HH:mm"));
    $("#myModal #event-form-allDay").val(allDay);

    $("#myModal #event-form-title").val("");
    $("#myModal #event-form-location").val("");

    hideDetails();

    openModal(start.day(), jsEvent);
    // $("#myModal .modal-title").text("Adding a new Event");
    // $("#myModal .modal-body").html('<p id="fields"></p>' +
    //     'Title: <input type="text" id="title"><br/><br/>' +
    //     'Start Date: <input type="date" id="startDate" value="' + $.fullCalendar.formatDate(start, "YYYY-MM-DD") + '">' +
    //     '\tStart Time: <input type="time" id="startTime" value="' + $.fullCalendar.formatDate(start, "HH:mm") + '"><br/><br/>' +
    //     'End Date: <input type="date" id="endDate" value="' + $.fullCalendar.formatDate(end, "YYYY-MM-DD") + '">' +
    //     '\tEnd Time: <input type="time" id="endTime" value="' + $.fullCalendar.formatDate(end, "HH:mm") + '"><br/><br/>' +
    //     'Choose your Color: <select id="color">' +
    //     '<option value="">-Select Color-</option>' +
    //     '<option value="#E68800" style="color: #E68800; background-color: black;"">Orange 1</option>' +
    //     '<option value="#FFD699" style="color: #FFD699; background-color: black;"">Orange 2</option>' +
    //     '<option value="#00D3E6" style="color: #00D3E6; background-color: black;"">Teal 1</option>' +
    //     '<option value="#99F6FF" style="color: #99F6FF; background-color: black;"">Teal 2</option>' +
    //     '<option value="#0088E6" style="color: #0088E6; background-color: black;"">Blue 1</option>' +
    //     '<option value="#99D5FF" style="color: #99D5FF; background-color: black;"">Blue 2</option>' +
    //     '<option value="#8600E6" style="color: #8600E6; background-color: black;"">Purple 1</option>' +
    //     '<option value="#D499FF" style="color: #D499FF; background-color: black;"">Purple 2</option>' +
    //     '<option value="#E600AC" style="color: #E600AC; background-color: black;"">Pink 1</option>' +
    //     '<option value="#FF99E6" style="color: #FF99E6; background-color: black;"">Pink 2</option>' +
    //     '<option value="#E60000" style="color: #E60000; background-color: black;"">Red 1</option>' +
    //     '<option value="#FF9999" style="color: #FF9999; background-color: black;"">Red 2</option>' +
    //     '<option value="#12E600" style="color: #12E600; background-color: black;"">Green 1</option>' +
    //     '<option value="#A1FF99" style="color: #A1FF99; background-color: black;"">Green 2</option>' +
    //     '</select>');
    // $("#myModal .modal-footer").html("<button class='modifyEvents' id='add'>&nbsp&nbspOk&nbsp&nbsp</button>" +
    //     "<button class='modifyEvents' id='delete'>Cancel</button>");

    // $('.modifyEvents').on("click", function (e) {
    //     if (e.target.id == "add") {

    //     } else {
    //         $('#myModal').modal('toggle');
    //     }
    // })
}

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
    

    showDetails();

    openModal(event.start.day(), jsEvent);
    // setCalendarModalPosition(calEvent.start._d.toString());

    // $("#myModal .modal-title").text("Title: " + calEvent.title);
    // $("#myModal .modal-body").html("Start From : " + moment(calEvent.start).format("MMMM Do YYYY, h:mm a") +
    //     "<br /><br />End From : " + moment(calEvent.end).format("MMMM Do YYYY, h:mm a"));
    // $("#myModal .modal-footer").html("<button class='modifyEvents' id='edit'>Editing?</button>" +
    //     "<button class='modifyEvents' id='delete'>Deleting?</button>");

    // $('.modifyEvents').on("click", function (e) {
    //     if (e.target.innerHTML == "Editing?") {
    //         $("#myModal .modal-title").text("Editing Event");
    //         // $("#myModal .modal-body").html('<p id="fields"></p>' +
    //         //     'Title: <input type="text" id="title" value="' + calEvent.title + '"><br/><br/>' +
    //         //     'Start Date: <input type="date" id="startDate" value="' + moment(calEvent.start).format("YYYY-MM-DD") + '">' +
    //         //     '\tStart Time: <input type="time" id="startTime" value="' + moment(calEvent.start).format("HH:mm") + '"><br/><br/>' +
    //         //     'End Date: <input type="date" id="endDate" value="' + moment(calEvent.end).format("YYYY-MM-DD") + '">' +
    //         //     '\tEnd Time: <input type="time" id="endTime" value="' + moment(calEvent.end).format("HH:mm") + '"><br/><br/>' +
    //         //     'Choose your Color: <select id="color" value="' + calEvent.color + '">' +
    //         //     '<option value="">-Select Color-</option>' +
    //         //     getCalendarColor(calEvent.color) +
    //         //     '</select>');
    //         // $("#myModal .modal-footer").html("<button class='modifyEvents' id='edit'>&nbsp&nbspOk&nbsp&nbsp</button>" +
    //         //     "<button class='modifyEvents' id='delete'>Cancel</button>");

    //         $('.modifyEvents').on("click", function (e) {
    //             if (e.target.id == "edit") {
    //                 var title = document.getElementById('title').value;

    //                 var startDate = document.getElementById('startDate').value;
    //                 var startTime = document.getElementById('startTime').value;
    //                 var startDateTime = startDate.concat("T" + startTime);

    //                 var endDate = document.getElementById('endDate').value;
    //                 var endTime = document.getElementById('endTime').value;
    //                 var endDateTime = endDate.concat("T" + endTime);

    //                 var color = document.getElementById("color").value;

    //                 if (title == "" || startDate == "" || startTime == "" || endDate == "" || endTime == "" || color == "") {
    //                     $('#fields').show();
    //                     $('#fields').text("Please fill in all the fields");
    //                 } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date" || moment(endDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
    //                     $('#fields').show();
    //                     $('#fields').text("Invalid Date and Time");
    //                 } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") >= moment(endDateTime).format("YYYY-MM-DD HH:mm:ss")) {
    //                     $('#fields').show();
    //                     $('#fields').text("Start Date&Time cannot be more than or equal to End Date&Time");
    //                 } else {
    //                     var id = calEvent._id;
    //                     $.ajax({
    //                         url: "/api/calbit/" + id,
    //                         method: "put",
    //                         data: {
    //                             _id: id,
    //                             title: title,
    //                             start: moment(startDateTime).toDate(),
    //                             end: moment(endDateTime).toDate(),
    //                             color: color
    //                         },
    //                         success: function () {
    //                             $('#myModal').modal('toggle');
    //                             alert("Updated Successfully");
    //                             $('#main-calendar').fullCalendar('refetchEvents');
    //                         }
    //                     }).fail(
    //                         function (err) {
    //                             alert(err.responseText);
    //                         }
    //                     )
    //                 }
    //             } else {
    //                 $('#myModal').modal('toggle');
    //             }
    //         })
    //     } else {
    //         //When Deleting

    //         var id = calEvent._id;
    //         $.ajax({
    //             url: "/api/calbit/" + id,
    //             method: "delete",
    //             data: { _id: id },
    //             success: function () {
    //                 $('#myModal').modal('toggle');
    //                 alert("Deleted Successfully");
    //                 $('#main-calendar').fullCalendar('refetchEvents');
    //             }
    //         }).fail(
    //             function (err) {
    //                 alert(err.responseText);
    //             }
    //         )
    //     }
    // })
}

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
 * Initialise calendars on load
 */
$(document).ready(function () {
    CALENDARARR = JSON.parse($('#calendarJSON').html());

    // Event listeners on slepe buttons
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