
//setup of display of dialog with links to separate single node ("Replay tweets" dialog)
function setup_playback_dialog(circle_d, rows) {
	d3.select("#replay_tweets").on("click", function(d) {
		d3.select("#playback_name")
			.text(circle_d.name);
		
		var v = get_nodes_links_from_rows(rows, true), 
			all_nodes = v[0],//links.filter(function(l) {return l.source.name == circle_d.name || l.target.name == circle_d.name;})
			all_links = v[1];
		
		var links = [],
			nodes = {};
		
		nodes[circle_d.name] = circle_d;
		
		for (var i=0; i<all_links.length; ++i) {
			var l = all_links[i];
			if (l.source.name == circle_d.name) {
				nodes[l.target.name] = l.target;
				links.push({source: nodes[l.source.name], target: nodes[l.target.name]});
			}
			if (l.target.name == circle_d.name) {
				nodes[l.source.name] = l.source;
				links.push({source: nodes[l.source.name], target: nodes[l.target.name]});
			}
		}
		
	    $('#playback_dialog').modal();
		
	    var w = d3.select("#playback_left_container").node().getBoundingClientRect().width,
	    	body_h = parseInt(d3.select('body').style('height')),
	    	h = body_h - 350;
	    
	    /*** graph ***/
		var linkDistance = 160;
		
	    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([w, h])
        .linkDistance(linkDistance)
        .charge(-100)
        .on('tick', tick)
        .start();

		var svg = d3.select('#playback_graph').append('svg:svg')
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

		/*** chart ***/
		var svg = d3.select('#playback_chart').append('svg:svg')
	        .attr('width', '100%')
	        .attr('height', 100);
		
		/*** tweets ***/
		var tweets = [];
		for (var name in nodes) {
			var node = nodes[name];
			tweets = tweets.concat(node.tweets.concat(node.replies.concat(node.mentions)));
		}
		
		var tweets = d3.select('#playback_tweets').selectAll('.twitter')
			.data(tweets)
			.html(supply_tweet_html);
		
		tweets.enter().append('div')
			.attr('class', 'twitter')
			.html(supply_tweet_html);
		
		tweets.exit().remove();

		function supply_tweet_html(d) {
			return String.format($('#twitter_tpl > .tweet-text').html(), {
					date_timestamp: Date.parse(d.date.substring(0,33)),
					name: d.name.substring(1),
					profile_image: d.image,
					message: d.text,
					date: d.date,
					tweet_id: d.id,
					short_date: (new Date(Date.parse(d.date.substring(0,33)))).toString('d MMM yy') 
			});
		}
	});
}
