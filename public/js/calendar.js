$(document).ready(function () {
    $('#sidebar').fullCalendar({
        header: {
            left: 'title',
            center: '',
            right: 'prev,next'
        },
        fixedWeekCount: false,
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    });

    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'agendaWeek,agendaDay,month,listWeek'
        },
        fixedWeekCount: false,
        navLinks: true,
        editable: true,
        selectable: true,
        events: "/getEvents",
        select: function (start, end, allDay) {
            swal.fire({
                title: 'Adding a new Event',
                html: '<br /><p id="fields"></p>' +
                    'Title:<input type="text" id="title" class="swal2-input">' +
                    'Start Date:<input type="date" id="startDate" class="swal2-input" value="' + $.fullCalendar.formatDate(start, "YYYY-MM-DD") + '">' +
                    'Start Time(AM/PM):<input type="time" id="startTime" class="swal2-input" value="' + $.fullCalendar.formatDate(start, "HH:mm") + '">' +
                    'End Date:<input type="date" id="endDate" class="swal2-input" value="' + $.fullCalendar.formatDate(end, "YYYY-MM-DD") + '">' +
                    'End Time(AM/PM):<input type="time" id="endTime" class="swal2-input" value="' + $.fullCalendar.formatDate(end, "HH:mm") + '">',
                showCancelButton: true,
                preConfirm: () => {
                    var title = document.getElementById('title').value;

                    var startDate = document.getElementById('startDate').value;
                    var startTime = document.getElementById('startTime').value;
                    var startDateTime = startDate.concat("T" + startTime);

                    var endDate = document.getElementById('endDate').value;
                    var endTime = document.getElementById('endTime').value;
                    var endDateTime = endDate.concat("T" + endTime);

                    if (title == "" || startDate == "" || startTime == "" || endDate == "" || endTime == "") {
                        $('#fields').show();
                        $('#fields').text("Please fill in all the fields");
                        return false;
                    } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date" || moment(endDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
                        $('#fields').show();
                        $('#fields').text("Invalid Date and Time");
                        return false;
                    } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") >= moment(endDateTime).format("YYYY-MM-DD HH:mm:ss")) {
                        $('#fields').show();
                        $('#fields').text("Start Date&Time cannot be more than or equal to End Date&Time");
                        return false;
                    } else {
                        return [
                            title,
                            moment(startDateTime).format("YYYY-MM-DD HH:mm:ss"),
                            moment(endDateTime).format("YYYY-MM-DD HH:mm:ss")
                        ]
                    }
                }
            }).then((data) => {
                if (data.dismiss == "cancel" || data.dismiss == "backdrop") {
                    //do nothing, back to dashboard
                } else {
                    $.ajax({
                        url: "/saveEvent",
                        type: "post",
                        data: { title: data.value[0], start: data.value[1], end: data.value[2] },
                        success: function () {
                            alert("Added Successfully");
                            $('#calendar').fullCalendar('refetchEvents');
                        }
                    }).fail(
                        function (err) {
                            alert(err.responseText);
                        }
                    )
                }
            })
        },
        eventClick: function (calEvent, jsEvent, view, resourceObj) {
            $("#myModal").modal({ backdrop: false });
            $("#myModal .modal-title").text("Title: " + calEvent.title);
            $("#myModal .modal-body").html("Start From : " + moment(calEvent.start).format("MMMM Do YYYY, h:mm a") +
                "<br /><br />End From : " + moment(calEvent.end).format("MMMM Do YYYY, h:mm a"));
            $("#myModal .modal-footer").html("<button class='modifyEvents' id='edit'>Editing?</button>" +
                "<button class='modifyEvents' id='delete'>Deleting?</button>");

            $('.modifyEvents').on("click", function (e) {
                if (e.target.innerHTML == "Editing?") {
                    swal.fire({
                        title: 'Editing Event',
                        html: '<br /><p id="fields"></p>' +
                            'Title:<input type="text" id="title" class="swal2-input">' +
                            'Start Date & Time(AM/PM):<input type="datetime-local" id="start" class="swal2-input">' +
                            'End Date & Time(AM/PM):<input type="datetime-local" id="end" class="swal2-input">',
                        showCancelButton: true,
                        preConfirm: () => {
                            var title = document.getElementById('title').value;
                            var start = document.getElementById('start').value;
                            var end = document.getElementById('end').value;

                            if (title == "" || start == "" || end == "") {
                                $('#fields').show();
                                $('#fields').text("Please fill in all the fields");
                                return false;
                            } else if (moment(start).format("YYYY-MM-DD HH:mm:ss") == "Invalid date" || moment(end).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
                                $('#fields').show();
                                $('#fields').text("Invalid Date and Time");
                                return false;
                            } else if (moment(start).format("YYYY-MM-DD HH:mm:ss") >= moment(end).format("YYYY-MM-DD HH:mm:ss")) {
                                $('#fields').show();
                                $('#fields').text("Start Date&Time cannot be more than or equal to End Date&Time");
                                return false;
                            } else {
                                return [
                                    title,
                                    moment(start).format("YYYY-MM-DD HH:mm:ss"),
                                    moment(end).format("YYYY-MM-DD HH:mm:ss")
                                ]
                            }
                        }
                    }).then((data) => {
                        if (data.dismiss == "cancel" || data.dismiss == "backdrop") {
                            //do nothing, will go back to previous modal
                        } else {
                            $('#myModal').modal('toggle');

                            var id = calEvent._id;
                            $.ajax({
                                url: "/updateEvent/" + id,
                                type: "post",
                                data: { _id: id, title: data.value[0], start: data.value[1], end: data.value[2] },
                                success: function () {
                                    alert("Updated Successfully");
                                    $('#calendar').fullCalendar('refetchEvents');
                                }
                            }).fail(
                                function (err) {
                                    alert(err.responseText);
                                }
                            )
                        }
                    })
                } else {
                    //When in Deleting

                    swal.fire({
                        title: 'Are you sure?',
                        text: "You won't be able to revert this!",
                        icon: 'warning',
                        showCancelButton: true,
                        cancelButtonText: "No, Don't Delete",
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, Delete it!'
                    }).then((data) => {
                        if (data.dismiss == "cancel" || data.dismiss == "backdrop") {
                            //do nothing, will go back to previous modal
                        } else {
                            $('#myModal').modal('toggle');

                            var id = calEvent._id;
                            $.ajax({
                                url: "/deleteEvent/" + id,
                                type: "delete",
                                data: { _id: id },
                                success: function () {
                                    alert("Deleted Successfully");
                                    $('#calendar').fullCalendar('refetchEvents');
                                }
                            }).fail(
                                function (err) {
                                    alert(err.responseText);
                                }
                            )
                        }
                    })
                }
            })
        },
        eventResize: function (event) {
            var id = event._id;
            var title = event.title;
            var start = $.fullCalendar.formatDate(event.start, "YYYY-MM-DD HH:mm:ss");
            var end = $.fullCalendar.formatDate(event.end, "YYYY-MM-DD HH:mm:ss");
            $.ajax({
                url: "/updateEvent/" + id,
                type: "post",
                data: { _id: id, title: title, start: start, end: end },
                success: function () {
                    alert("Updated Successfully");
                    $('#calendar').fullCalendar('refetchEvents');
                }
            }).fail(
                function (err) {
                    alert(err.responseText);
                }
            )
        },
        eventDrop: function (event) {
            var id = event._id;
            var title = event.title;
            var start = $.fullCalendar.formatDate(event.start, "YYYY-MM-DD HH:mm:ss");
            var end = $.fullCalendar.formatDate(event.end, "YYYY-MM-DD HH:mm:ss");
            $.ajax({
                url: "/updateEvent/" + id,
                type: "post",
                data: { _id: id, title: title, start: start, end: end },
                success: function () {
                    alert("Updated Successfully");
                    $('#calendar').fullCalendar('refetchEvents');
                }
            }).fail(
                function (err) {
                    alert(err.responseText);
                }
            )
        },
    });
});