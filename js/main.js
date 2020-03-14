var margin = {top: 40, right: 40, bottom: 60, left: 60};

var width = 600 - margin.left - margin.right,
    height = 380 - margin.top - margin.bottom;

var svg, xScale, yScale, xAxis, yAxis, svgX, svgY, svgDetail;

// Date parser
var formatDate = d3.timeFormat("%Y");
var parseDate = d3.timeParse("%Y");

radius = 50;
var color = d3.scaleOrdinal()
    .range(["#f7af9c", "#f07b5d", "#F25732"]);


//***************** Eduction VIZ ***************************
function createEd(){
    d3.select("#viz").selectAll("*").remove();
    //set up the viz
    svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create scales and Axis
    yScale = d3.scaleLinear()
        .range([height, 0]);
    xScale = d3.scaleBand()
        .range([0, width]);
    xAxis = d3.axisBottom();
    yAxis = d3.axisLeft();

//append axes
    svgX = svg.append("g")
        .attr("transform", "translate(0, " + height + ")")
        .attr("class", "axis");
    svgY = svg.append("g")
        .attr("class", "axis");

    //load the data
    queue()
        .defer(d3.csv, "data/CumulativeStudentDebt.csv")
        .await(updateEd);
}

function updateEd(error, debt){
    debt.forEach(function(d){
        d.Debt = parseInt(d.Debt)
    });
    yScale.domain([0,d3.max(debt, function(d) { return d.Debt; })]);

    //set up lower barchart for Debt
    var dtSVG = svg.selectAll("rect")
        .data(debt)
        .enter()
        .append("rect")
        .attr("y", function(d){
            return yScale(d.Debt)
        })
        .attr("x", function(d,i){
            if (d.Characteristic=="Men"){
                return width/2 + 20;
            }
            else if(d.Characteristic=="Women"){
                return 10;
            }
            else {
                if (d.Characteristic.lastIndexOf("Men")>4){
                    return 0 + (i * 45 + 30);
                }
                else {
                    return i * 45 + 0;
                }
            }
        })
        .attr("width", function(d){
            if (d.Characteristic=="Men" || d.Characteristic=="Women") {
                return width/2 - 30;
            }
            else {
                return 40;
            }
        })

        .attr("height", function(d){
            return height- yScale(d.Debt);
        })
        .attr("fill", function(d){
            if (d.Characteristic=="Men" || d.Characteristic=="Women") {
                return "lightgrey";
            }
            else {
                return "#F25732";
            }
        })
        .attr("class", "bar")
        .on("click", function(d){return buildEdDetail(d)});

    xAxis.scale(xScale);
    yAxis.scale(yScale);
    svgX.call(xAxis);
    svgY.call(yAxis);

}

function buildEdDetail(data) {
    d3.select("#details").selectAll("*").remove();

//set up the viz
    svgDetail = d3.select("#details").append("svg")
        .attr("width", 300 + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("data/LoanDifficulties.csv", function(error, csv) {
        filteredData = csv.filter(function(d){
            return d.Characteristic == data.Characteristic
        })
        //need to wrangle the data to the right format
        var pieData = [];
        filteredData.map(function(d) {
            pieData.push({name: "Default", value: parseFloat(d["Default"])}),
                pieData.push({name: "Not Repaying", value: parseFloat(d["Not Repaying Loan"])}),
                pieData.push({name: "Repaying", value: parseFloat(d["Repaying Loan"])})
        });

        var arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var pie = d3.pie()
            .sort(null)
            .value(function(d) {return d.value; });
        var g = svgDetail.selectAll("path")
            .data(pie(pieData))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.value); });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
            .attr("dy", "-10px")
            .attr("class", "label")
            .text(function(d) { return d.data.name + " " + d.value + "%"; });
    })

    }

//***************** Workforce VIZ ***************************
function createWork(){
    d3.select("#viz").selectAll("*").remove();

//set up the viz
    svg = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", ((height + margin.top + margin.bottom)/2)+20)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Create scales and Axis
    yScale = d3.scaleLinear()
        .range([height/2, 0]);
    xScale = d3.scaleTime()
        .range([0, width]);
    xAxis = d3.axisBottom();
    yAxis = d3.axisLeft();

//append axes
    svgX = svg.append("g")
        .attr("transform", "translate(0, " + height/2 + ")")
        .attr("class", "axis");
    svgY = svg.append("g")
        .attr("class", "axis");

//load the data
    //load the data
    queue()
        .defer(d3.csv, "data/PercentLaborForce.csv")
        .defer(d3.csv, "data/JobLevels.csv")
        .await(updateWork);

}


function updateWork(error, lfData, levelData){
    //Percent of Labor Force for African Americans
    lfData.forEach(function(d){
        d.Year = parseDate(d.Year);
        d.Percent = parseFloat(d.Percent);
    })
    lfData.sort(function (a, b) {
        return a.Year - b.Year;
    });
    //console.log(lfData);
    //set up scale for the year
    xScale.domain([d3.min(lfData, function(d) { return d["Year"]; }),
        d3.max(lfData, function(d) { return d["Year"]; })
    ]);

    yScale.domain([0, 25]);

    xAxis.scale(xScale);
//        .ticks(lfData.length);
    yAxis.scale(yScale);

    var line = d3.line()
        .x(function(d) { return xScale(d["Year"]); })
        .y(function(d) { return yScale(d["Percent"]); });
//        .curve(d3.curveMonotoneX);

    var lfSVG = svg
        .append("path")
        .datum(lfData)
        .attr("class", "line");
    var lfSVG = svg.transition()
        .duration(500);
    var lfLine = lfSVG.select(".line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "1");

    svgX.call(xAxis);
    svgY.call(yAxis);

    // build age group circles
    var ageData = lfData.filter(function(d){
        return d["16-25"]>0;
    });
    //console.log(ageData);

    var lfCircles = svg.selectAll("circles")
        .data(ageData)
        .enter()
        .append("circle")
        .attr("class", "circles")
        .attr("r", 4)
        .attr("cx", function(d) {return xScale(d["Year"])})
        .attr("cy", function(d) {return yScale(d["Percent"])})
    lfCircles.on("click", function(d){buildAgeDetail(d)});

    //BUILD OUT THE JOB LEVEL PIES
    console.log(levelData);
    lvlSVG = d3.select("#viz").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", ((height + margin.top + margin.bottom)/2)+20)
        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + 200 + ")");

    for (i=0;i<levelData.length;i++){
//        var top = (i<3 ? 50 :150 );
        var top = 60;
        var left =(i * 90) + 50;
        var gLevel = lvlSVG.append("g")
            .attr("transform", "translate(" + left + "," + top + ")");

        var pieData = [];
        pieData.push({name: "White Men", value: parseInt(levelData[i]["WhiteMen"])});
        pieData.push({name: "Men of Color", value: parseInt(levelData[i]["Men of Color"])});
        pieData.push({name: "White Women", value: parseInt(levelData[i]["White Women"])});
        pieData.push({name: "Women of Color", value: parseInt(levelData[i]["Women of Color"])});

        var arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var pie = d3.pie()
            .sort(null)
            .value(function(d) {return d.value; });
        var g = gLevel.selectAll("path")
            .data(pie(pieData))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.value); });

    }



}

function buildAgeDetail(ageData) {
    d3.select("#details").selectAll("*").remove();

//set up the viz
    svgDetail = d3.select("#details").append("svg")
        .attr("width", 300 + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    console.log(ageData);
        var pieData = [];
            pieData.push({name: "16-25", value: parseFloat(ageData["16-25"])});
            pieData.push({name: "25-54", value: parseFloat(ageData["25-54"])});
            pieData.push({name: "Over 55", value: parseFloat(ageData["Over 55"])});

        var arc = d3.arc()
            .outerRadius(radius - 10)
            .innerRadius(0);

        var labelArc = d3.arc()
            .outerRadius(radius - 40)
            .innerRadius(radius - 40);

        var pie = d3.pie()
            .sort(null)
            .value(function(d) {return d.value; });
        var g = svgDetail.selectAll("path")
            .data(pie(pieData))
            .enter().append("g")
            .attr("class", "arc");

        g.append("path")
            .attr("d", arc)
            .style("fill", function(d) { return color(d.value); });

        g.append("text")
            .attr("transform", function(d) { return "translate(" + labelArc.centroid(d) + ")"; })
            .attr("dy", "-10px")
            .attr("class", "label")
            .text(function(d) { return d.data.name + " " + d.value + "%"; });

}
