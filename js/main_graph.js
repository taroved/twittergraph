d3.xhr("may2015.csv", "text/csv", parse_csv);

function parse_csv(data) {
    display_graph(d3.csv.parseRows(data.response).slice(0, 1000));
}

function display_graph(rows) {
    //Date,Screen Name,Full Name,Followers,Follows,Retweets,Favorites,Tweet Text,"Longitude, Latitude",Street Address,Google Maps,Tweet URL,Profile Image
    var COMUMN_SCREEN_NAME = 1;

    var links = [];
    var nodes = [];
    
    rows.forEach(function(row) {
        nodes[row[COMUMN_SCREEN_NAME]] = {name: row[COMUMN_SCREEN_NAME]};
    });

    var w = parseInt(d3.select('body').style('width')),//1280,
        h = parseInt(d3.select('body').style('height'));//800;
    
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(80)
        .charge(-500)
        .on('tick', tick)
        .start();
	
	var svg = d3.select('#chart').append('svg:svg')
        .attr('width', w)
        .attr('height', h);
    
    svg.append('svg:rect')
        .attr('width', w)
        .attr('height', h);
    
    // Per-type markers, as they don't inherit styles.
    svg.append("svg:defs")
      .append("svg:marker")
        .attr("id", "link")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");
    
    var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
      .enter().append("svg:path")
        .attr("class", "link")
        .attr("marker-end", "url(#link)");
    
    var circle = svg.append("svg:g").selectAll("circle")
        .data(force.nodes())
      .enter().append("svg:circle")
        .attr("r", 8)
        .call(force.drag);
    
    var text = svg.append("svg:g").selectAll("g")
        .data(force.nodes())
      .enter().append("svg:g");
    
    //A copy of the text with a thick white stroke for legibility.
    text.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("class", "shadow")
        .text(function(d) { return d.name; });
    
    text.append("svg:text")
        .attr("x", 12)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });
    
    
    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
      path.attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      });
    
      circle.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      text.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    }
}
