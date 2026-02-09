var names = ["Chris", "Eduard", "Fabio", "Felix", "Kobus", "Lebo", "Marco", "Nobby", "Nupur", "Punya", "Sam", "Sebastian", "Simon", "Tshepo", "Wayne"];

var padding = {top: 20, right: 40, bottom: 0, left: 0},
    w = 500 - padding.left - padding.right,
    h = 500 - padding.top - padding.bottom,
    r = Math.min(w, h) / 2,
    rotation = 0,
    oldrotation = 0,
    picked = 100000,
    oldpick = [],
    color = d3.scale.category20(),
    container = {},
    vis = {};

var data = [];

function mapData() {
    names.forEach(function (n) {
        data.push({"label": n, "value": 1})
    });
}

function drawAttendees() {
    names.map(function (n) {
        drawAttendee(n);
    });
}

function drawAttendee(n) {
    var innerHTML = document.getElementById("attendeesList");
    var li = document.createElement("li");
    var input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("id", "check_" + n);
    input.setAttribute("checked", true);
    li.append(input);
    var label = document.createElement("label");
    label.setAttribute("for", "check_" + n);
    label.innerHTML = n;
    li.append(label);
    innerHTML.append(li);
}

function addAttendee() {
    var name = document.getElementById("attendeeName").value;
    names.push(name);
    data.push({
        "label": name,
        "value": 1
    });

    drawAttendee(name);
    drawSpinner(data);
    document.getElementById("attendeeName").value = "";
}

function drawSpinner(data) {
    oldpick = [];
    d3.select("#chart").selectAll("*").remove();
    var svg = d3.select('#chart')
        .append("svg")
        .data([data])
        .attr("width", w + padding.left + padding.right)
        .attr("height", h + padding.top + padding.bottom);
    container = svg.append("g")
        .attr("id", "chartholder")
        .attr("class", "chartholder")
        .attr("transform", "translate(" + (w / 2 + padding.left) + "," + (h / 2 + padding.top) + ")");
    vis = container
        .append("g");

    var pie = d3.layout.pie().sort(null).value(function (d) {
        return 1;
    });

    var arc = d3.svg.arc().outerRadius(r);
    var arcs = vis.selectAll("g.slice")
        .data(pie)
        .enter()
        .append("g")
        .attr("class", "slice");

    arcs.append("path")
        .attr("fill", function (d, i) {
            return color(i);
        })
        .attr("d", function (d) {
            return arc(d);
        });
    arcs.append("text")
        .attr("transform", function (d) {
            d.innerRadius = 0;
            d.outerRadius = r;
            d.angle = (d.startAngle + d.endAngle) / 2;
            return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")translate(" + (d.outerRadius - 10) + ")";
        })
        .attr("text-anchor", "end")
        .text(function (d, i) {
            return data[i].label;
        });

    svg.append("g")
        .attr("transform", "translate(" + (w + padding.left + padding.right) + "," + ((h / 2) + padding.top) + ")")
        .append("path")
        .attr("d", "M-" + (r * .15) + ",0L0," + (r * .05) + "L0,-" + (r * .05) + "Z")
        .style({"fill": "white"});
    container.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 60)
        .style({"fill": "white", "cursor": "pointer"});
    container.append("text")
        .attr("x", 0)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("SPIN")
        .style({"font-weight": "bold", "font-size": "30px"});

    // Change the spin to only execute when clicking the SPIN text
    container.select("circle").on("click", spin);
}

function spin(d) {
    // Disable the attendees controls
    var checkboxes = document.querySelectorAll("#attendeesList input[type='checkbox']");
    checkboxes.forEach(function (checkbox) {
        checkbox.disabled = true;
    });
    document.getElementById("attendeeName").disabled = true;
    document.getElementById("addAttendee").disabled = true;



    container.select("circle").on("click", null);

    var degreesPerAttendee = 360 / data.length,
        rng = Math.floor((Math.random() * 1440) + 360);

    rotation = (Math.round(rng / degreesPerAttendee) * degreesPerAttendee);

    picked = Math.round(data.length - (rotation % 360) / degreesPerAttendee);
    picked = picked >= data.length ? (picked % data.length) : picked;
    if (oldpick.indexOf(picked) !== -1) {
        // A previous attendee was selected, so spin again
        d3.select(this).call(spin);
        return;
    } else {
        oldpick.push(picked);
    }
    rotation += 90 - Math.round(degreesPerAttendee / 2);
    vis.transition()
        .duration(3000)
        .attrTween("transform", rotTween)
        .each("end", function () {

            d3.select(".slice:nth-child(" + (picked + 1) + ") path")
                .attr("fill", "#111")
            document.getElementById("questionh1").innerHTML = data[picked].label + "<ul><li>What was done?</li><li>Plan for today?</li><li>Any impediments?</li></ul>";
            oldrotation = rotation;

            container.select("circle").on("click", spin);

            let remainingAttendees = [];
            for(var i = 0; i < data.length; i++) {
                if (oldpick.indexOf(i) === -1) {
                    remainingAttendees.push(data[i]);
                }
            }
            let remainingAttendeesCount = data.length - oldpick.length;

            if (remainingAttendeesCount === 0) {
                console.log("done");
                return;
            }

            if (remainingAttendeesCount === 2) {
                document.getElementById("voteMessage").innerHTML = "Time to vote! " + remainingAttendees[0].label + " or " + remainingAttendees[1].label;
                document.getElementById("voteMessage").style.display = "block";
            } else {
                document.getElementById("voteMessage").style.display = "none";
            }

            if(remainingAttendeesCount === 1) {
                document.getElementById("spinWinner").innerHTML = "The winner is " + data[picked].label + "!";
                document.getElementById("spinWinner").style.display = "block";
            }
        });
}

function rotTween(to) {
    var i = d3.interpolate(oldrotation % 360, rotation);
    return function (t) {
        return "rotate(" + i(t) + ")";
    };
}

// Add event listener to remove attendees when clicked
document.addEventListener("click", function (e) {
    if (e.target.tagName === "INPUT") {
        if (e.target.id.split("_")[0] === "check") {
            var name = e.target.id.split("_")[1];
            var index = data.findIndex(function (d) {
                return d.label === name;
            });
            if (e.target.checked) {
                data.push({
                    "label": name,
                    "value": 1
                });
            } else {
                data[index].value = 0;
                // Delete object from data
                data.splice(index, 1);
            }

            drawSpinner(data);
        }
    }

    if (e.target.tagName === "BUTTON") {
        addAttendee();
    }
});

// If press enter while on the text box then add attendee
document.getElementById("attendeeName").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        addAttendee();
    }
});

mapData();
drawAttendees();
drawSpinner(data);
