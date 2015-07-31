d3.xhr("may2015.csv", "text/csv", parse_csv);

function parse_csv(data) {
    display_graph(d3.csv.parseRows(data.response).slice(0, 1000));
}

function display_graph(rows) {
    //Date,Screen Name,Full Name,Followers,Follows,Retweets,Favorites,Tweet Text,"Longitude, Latitude",Street Address,Google Maps,Tweet URL,Profile Image
    var COLUMN_SCREEN_NAME = 1,
    	COLUMN_TWEET_TEXT = 7,
    	COLUMN_PROFILE_IMAGE = 13

    var links = [];
    var nodes = [];
    
    rows.forEach(function(row) {
    	var name = row[COLUMN_SCREEN_NAME],
    		tweet = row[COLUMN_TWEET_TEXT];
    	if (name in nodes)
    		nodes[name].tweets.push({tweet: tweet});
    	else
	        nodes[name] = {
	        		name: name,
	        		tweets: [{tweet: tweet}],
	        		replies: [],
	        		mentions: [],
	        		image: row[COLUMN_PROFILE_IMAGE] 
	        	};
    });
    //setup replies and mentions
    rows.forEach(function(row) {
    	var name = row[COLUMN_SCREEN_NAME],
    		tweet = row[COLUMN_TWEET_TEXT];
    	
    	if (!tweet) {
    		console.log('Invalid data:', row)
    		return;
    	}
    	
    	var reply_match = tweet.match(/^@\w+/);
    	if (reply_match) {
    		var reply_name = reply_match[0];
    		if (reply_name in nodes) {
	    		nodes[name].replies.push({tweet: tweet, reply_to: reply_name})
	    		links.push({source: nodes[name], target: nodes[reply_name]});
    		}
    		tweet = tweet.substring(reply_name.length);
    	}
    	
    	var mention_matches = tweet.match(/@\w+/);
    	if (mention_matches)
	    	mention_matches.forEach(function(mention_name) {
	    		if (mention_name in nodes) {
	    			nodes[name].mentions.push({tweet: tweet, mention_to: mention_name})
	    			links.push({source: nodes[name], target: nodes[mention_name]});
	    		}
	    	})
    });

    var w = parseInt(d3.select('body').style('width')),//1280,
        h = parseInt(d3.select('body').style('height'));//800;
    
    var linkDistance = 80;
    
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(linkDistance)
        .charge(-100)
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
    
    
    /*** graph scrolling ***/
    
	$("body").mousewheel(function(i,intDelta){
		if (intDelta > 0 ) gravityUp();
		if (intDelta < 0 ) gravityDown();
	});
	
	function gravityUp()
	{
		var value = force.gravity()+0.01;
		linkDistance = linkDistance-5;
		if(value > 1) value = 1;
		force.gravity(value);
		if (linkDistance >40) force.linkDistance(linkDistance);
		force.start();
	}

	function gravityDown()
	{
		var value = force.gravity()-0.01;
		linkDistance = linkDistance+5;
		if(value < 0) value = 0;
		force.linkDistance(linkDistance);
		force.gravity(value);
		force.start();
	}
	
	setup_popup(circle);
}

function setup_popup(circle) {
	circle.on('mouseover', function(d){
    	d3.select('#popup').style('visibility', 'visible');
	});
    circle.on('mousemove', function(d){
    	console.log(d);
    	d3.select('#popup')
    		.style('display', 'block')
    		.style('left', d3.event.pageX+10)
    		.style('top', d3.event.pageY-20)
    		.select('#popup_user_name')
    			.text(d.name);
	});
    circle.on('mouseout', function(d){
    	d3.select('#popup').style('visibility', 'hidden');
	});
} 


