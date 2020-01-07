function getCalendarHeight() {
    return $(window).height() - 142;
}

function setCalendarModalPosition(selected) {
    console.log(selected)

    // Paiseh this not dynamically, not benefit for responsive
    // This whole function trigger only once, all in if else statement

    // This is Month View Side and Columns Positioning hardcoded, will be distorted when smaller browser width change
    if (selected.indexOf("Sun") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "60px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Mon") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "225px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Tue") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "325px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Wed") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "-225px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Thu") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "-100px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Fri") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "50px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Sat") > -1 && $(".fc-month-view")[1] != undefined) {
        document.getElementById("myModal").style.marginLeft = "175px";
        document.getElementById("myModal").style.overflowY = "hidden";
    }

    // // This is Week View Side and Columns Positioning hardcoded, will be distorted when smaller browser width change
    else if (selected.indexOf("Sun") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "100px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Mon") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "250px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Tue") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "350px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Wed") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "-220px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Thu") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "-80px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Fri") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "50px";
        document.getElementById("myModal").style.overflowY = "hidden";
    } else if (selected.indexOf("Sat") > -1 && $(".fc-agendaWeek-view")[0] != undefined) {
        document.getElementById("myModal").style.marginLeft = "180px";
        document.getElementById("myModal").style.overflowY = "hidden";
    }
}

function getCalendarColor(color) {
    const colorValue = ["Orange 1", "Orange 2", "Teal 1", "Teal 2", "Blue 1", "Blue 2", "Purple 1", "Purple 2",
        "Pink 1", "Pink 2", "Red 1", "Red 2", "Green 1", "Green 2"];
    const colorPattern = ["#E68800", "#FFD699", "#00D3E6", "#99F6FF", "#0088E6", "#99D5FF", "#8600E6", "#D499FF",
        "#E600AC", "#FF99E6", "#E60000", "#FF9999", "#12E600", "#A1FF99"];
    const data = [];

    for (let i = 0; i < colorPattern.length; i++) {
        if (colorPattern[i] == color) {
            data.push('<option value="' + color + '" style="color: ' + color + '; background-color: black;" selected>' + colorValue[i] + '</option>');
        } else {
            data.push('<option value="' + colorPattern[i] + '" style="color: ' + colorPattern[i] + '; background-color: black;">' + colorValue[i] + '</option>');
        }
    }
    return data;
}

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
        height: getCalendarHeight,
        defaultView: "agendaWeek",  //More prefer in month, but our scope is week so...
        fixedWeekCount: false,
        navLinks: true,
        editable: true,
        selectable: true,
        events: "/api/calbit",
        select: function (start, end) {
            let allDay = !start.hasTime();

            setCalendarModalPosition(start._d.toString());

            // $("#myModal").modal({ backdrop: false });
            $("#myModal").draggable({ handle: ".modal-header" });
            $("#myModal .modal-title").text("Adding a new Event");
            $("#myModal .modal-body").html('<p id="fields"></p>' +
                'Title: <input type="text" id="title"><br/><br/>' +
                'Start Date: <input type="date" id="startDate" value="' + $.fullCalendar.formatDate(start, "YYYY-MM-DD") + '">' +
                '\tStart Time: <input type="time" id="startTime" value="' + $.fullCalendar.formatDate(start, "HH:mm") + '"><br/><br/>' +
                'End Date: <input type="date" id="endDate" value="' + $.fullCalendar.formatDate(end, "YYYY-MM-DD") + '">' +
                '\tEnd Time: <input type="time" id="endTime" value="' + $.fullCalendar.formatDate(end, "HH:mm") + '"><br/><br/>' +
                'Choose your Color: <select id="color">' +
                '<option value="">-Select Color-</option>' +
                '<option value="#E68800" style="color: #E68800; background-color: black;"">Orange 1</option>' +
                '<option value="#FFD699" style="color: #FFD699; background-color: black;"">Orange 2</option>' +
                '<option value="#00D3E6" style="color: #00D3E6; background-color: black;"">Teal 1</option>' +
                '<option value="#99F6FF" style="color: #99F6FF; background-color: black;"">Teal 2</option>' +
                '<option value="#0088E6" style="color: #0088E6; background-color: black;"">Blue 1</option>' +
                '<option value="#99D5FF" style="color: #99D5FF; background-color: black;"">Blue 2</option>' +
                '<option value="#8600E6" style="color: #8600E6; background-color: black;"">Purple 1</option>' +
                '<option value="#D499FF" style="color: #D499FF; background-color: black;"">Purple 2</option>' +
                '<option value="#E600AC" style="color: #E600AC; background-color: black;"">Pink 1</option>' +
                '<option value="#FF99E6" style="color: #FF99E6; background-color: black;"">Pink 2</option>' +
                '<option value="#E60000" style="color: #E60000; background-color: black;"">Red 1</option>' +
                '<option value="#FF9999" style="color: #FF9999; background-color: black;"">Red 2</option>' +
                '<option value="#12E600" style="color: #12E600; background-color: black;"">Green 1</option>' +
                '<option value="#A1FF99" style="color: #A1FF99; background-color: black;"">Green 2</option>' +
                '</select>');
            $("#myModal .modal-footer").html("<button class='modifyEvents' id='add'>&nbsp&nbspOk&nbsp&nbsp</button>" +
                "<button class='modifyEvents' id='delete'>Cancel</button>");

            $('.modifyEvents').on("click", function (e) {
                if (e.target.id == "add") {
                    var title = document.getElementById('title').value;

                    var startDate = document.getElementById('startDate').value;
                    var startTime = document.getElementById('startTime').value;
                    var startDateTime = startDate.concat("T" + startTime);

                    var endDate = document.getElementById('endDate').value;
                    var endTime = document.getElementById('endTime').value;
                    var endDateTime = endDate.concat("T" + endTime);

                    var color = document.getElementById("color").value;

                    if (title == "" || startDate == "" || startTime == "" || endDate == "" || endTime == "" || color == "") {
                        $('#fields').show();
                        $('#fields').text("Please fill in all the fields");
                    } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date" || moment(endDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
                        $('#fields').show();
                        $('#fields').text("Invalid Date and Time");
                    } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") >= moment(endDateTime).format("YYYY-MM-DD HH:mm:ss")) {
                        $('#fields').show();
                        $('#fields').text("Start Date&Time cannot be more than or equal to End Date&Time");
                    } else {
                        $.ajax({
                            url: "/api/calbit",
                            type: "post",
                            data: {
                                title,
                                start: start.toDate(),
                                end: end.toDate(),
                                color,
                                allDay
                            },
                            success: function () {
                                $('#myModal').modal('toggle');
                                alert("Added Successfully");
                                $('#calendar').fullCalendar('refetchEvents');
                            }
                        }).fail(
                            function (err) {
                                alert(err.responseText);
                            }
                        )
                    }
                } else {
                    $('#myModal').modal('toggle');
                }
            })
        },
        eventClick: function (calEvent, jsEvent, view, resourceObj) {
            setCalendarModalPosition(calEvent.start._d.toString());

            $("#myModal").modal({ backdrop: false });
            $("#myModal .modal-title").text("Title: " + calEvent.title);
            $("#myModal .modal-body").html("Start From : " + moment(calEvent.start).format("MMMM Do YYYY, h:mm a") +
                "<br /><br />End From : " + moment(calEvent.end).format("MMMM Do YYYY, h:mm a"));
            $("#myModal .modal-footer").html("<button class='modifyEvents' id='edit'>Editing?</button>" +
                "<button class='modifyEvents' id='delete'>Deleting?</button>");

            $('.modifyEvents').on("click", function (e) {
                if (e.target.innerHTML == "Editing?") {
                    $("#myModal .modal-title").text("Editing Event");
                    $("#myModal .modal-body").html('<p id="fields"></p>' +
                        'Title: <input type="text" id="title" value="' + calEvent.title + '"><br/><br/>' +
                        'Start Date: <input type="date" id="startDate" value="' + moment(calEvent.start).format("YYYY-MM-DD") + '">' +
                        '\tStart Time: <input type="time" id="startTime" value="' + moment(calEvent.start).format("HH:mm") + '"><br/><br/>' +
                        'End Date: <input type="date" id="endDate" value="' + moment(calEvent.end).format("YYYY-MM-DD") + '">' +
                        '\tEnd Time: <input type="time" id="endTime" value="' + moment(calEvent.end).format("HH:mm") + '"><br/><br/>' +
                        'Choose your Color: <select id="color" value="' + calEvent.color + '">' +
                        '<option value="">-Select Color-</option>' +
                        getCalendarColor(calEvent.color) +
                        '</select>');
                    $("#myModal .modal-footer").html("<button class='modifyEvents' id='edit'>&nbsp&nbspOk&nbsp&nbsp</button>" +
                        "<button class='modifyEvents' id='delete'>Cancel</button>");

                    $('.modifyEvents').on("click", function (e) {
                        if (e.target.id == "edit") {
                            var title = document.getElementById('title').value;

                            var startDate = document.getElementById('startDate').value;
                            var startTime = document.getElementById('startTime').value;
                            var startDateTime = startDate.concat("T" + startTime);

                            var endDate = document.getElementById('endDate').value;
                            var endTime = document.getElementById('endTime').value;
                            var endDateTime = endDate.concat("T" + endTime);

                            var color = document.getElementById("color").value;

                            if (title == "" || startDate == "" || startTime == "" || endDate == "" || endTime == "" || color == "") {
                                $('#fields').show();
                                $('#fields').text("Please fill in all the fields");
                            } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date" || moment(endDateTime).format("YYYY-MM-DD HH:mm:ss") == "Invalid date") {
                                $('#fields').show();
                                $('#fields').text("Invalid Date and Time");
                            } else if (moment(startDateTime).format("YYYY-MM-DD HH:mm:ss") >= moment(endDateTime).format("YYYY-MM-DD HH:mm:ss")) {
                                $('#fields').show();
                                $('#fields').text("Start Date&Time cannot be more than or equal to End Date&Time");
                            } else {
                                var id = calEvent._id;
                                $.ajax({
                                    url: "/api/calbit/" + id,
                                    type: "put",
                                    data: {
                                        _id: id, 
                                        title: title,
                                        start: moment(startDateTime).toDate(),
                                        end: moment(endDateTime).toDate(),
                                        color: color
                                    },
                                    success: function () {
                                        $('#myModal').modal('toggle');
                                        alert("Updated Successfully");
                                        $('#calendar').fullCalendar('refetchEvents');
                                    }
                                }).fail(
                                    function (err) {
                                        alert(err.responseText);
                                    }
                                )
                            }
                        } else {
                            $('#myModal').modal('toggle');
                        }
                    })
                } else {
                    //When in Deleting

                    var id = calEvent._id;
                    $.ajax({
                        url: "/api/calbit/" + id,
                        type: "delete",
                        data: { _id: id },
                        success: function () {
                            $('#myModal').modal('toggle');
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
        },
        eventResize: function (event) {
            var id = event._id;
            var title = event.title;
            var start = event.start;
            var end = event.end;

            var color = event.color;
            $.ajax({
                url: "/api/calbit/" + id,
                type: "put",
                data: { _id: id, title: title, start: start.toDate(), end: end.toDate(), color: color },
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
            var start = event.start;
            var end = event.end;
            var color = event.color;
            $.ajax({
                url: "/api/calbit/" + id,
                type: "put",
                data: { _id: id, title: title, start: start.toDate(), end: end.toDate(), color: color },
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