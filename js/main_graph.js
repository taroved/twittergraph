d3.xhr("may2015.csv", "text/csv", parse_csv);

//Date,Screen Name,Full Name,Followers,Follows,Retweets,Favorites,Tweet Text,"Longitude, Latitude",Street Address,Google Maps,Tweet URL,Profile Image
var COLUMN_DATE = 0,
	COLUMN_SCREEN_NAME = 1,
	COLUMN_TWEET_TEXT = 7,
	COLUMN_TWEET_URL = 11,
	COLUMN_PROFILE_IMAGE = 12

function parse_csv(data) {
    display_graph(d3.csv.parseRows(data.response).slice(0, 1000));
}

//create_node - create nodes if not exists
function get_nodes_links_from_rows(rows, create_node) {
    var links = [];
    var nodes = [];

    rows.forEach(function(row) {
    	var name = row[COLUMN_SCREEN_NAME],
    		tweet = row[COLUMN_TWEET_TEXT];
    	if (!(name in nodes))
	        nodes[name] = {
	        		name: name,
	        		tweets: [],
	        		replies: [],
	        		mentions: [],
	        		image: row[COLUMN_PROFILE_IMAGE] 
	        	};
    	nodes[name].tweets.push({
    		id: row[COLUMN_TWEET_URL].match(/\d+$/)[0],
			date: row[COLUMN_DATE],
			name: row[COLUMN_SCREEN_NAME],
			text: row[COLUMN_TWEET_TEXT],
			image: row[COLUMN_PROFILE_IMAGE],
    	});
    });
    //setup replies and mentions
    rows.forEach(function(row) {
    	var name = row[COLUMN_SCREEN_NAME],
    		tweet = row[COLUMN_TWEET_TEXT];
    	
    	var reply_match = tweet.match(/^@\w+/);
    	if (reply_match) {
    		var reply_name = reply_match[0];
			if (reply_name in nodes) {
				nodes[reply_name].replies.push({
		        		id: row[COLUMN_TWEET_URL].match(/\d+$/)[0],
		    			date: row[COLUMN_DATE],
		    			name: row[COLUMN_SCREEN_NAME],
		    			text: row[COLUMN_TWEET_TEXT],
		    			image: row[COLUMN_PROFILE_IMAGE],
		    			reply_from: name
	    			})
	    		links.push({source: nodes[name], target: nodes[reply_name]});
			}
			else if (create_node) {
				nodes[reply_name] = {
		        		name: reply_name,
		        		tweets: [],
		        		replies: [],
		        		mentions: [],
		        		image: null 
		        	};
				links.push({source: nodes[name], target: nodes[reply_name]});
			}

    		tweet = tweet.substring(reply_name.length);
    	}
    	
    	var mention_matches = tweet.match(/@\w+/);
    	if (mention_matches)
	    	mention_matches.forEach(function(mention_name) {
				if (mention_name in nodes) {
	    			nodes[mention_name].mentions.push({
		    	    		id: row[COLUMN_TWEET_URL].match(/\d+$/)[0],
		    				date: row[COLUMN_DATE],
		    				name: row[COLUMN_SCREEN_NAME],
		    				text: row[COLUMN_TWEET_TEXT],
		    				image: row[COLUMN_PROFILE_IMAGE],
		    				mention_from: mention_name
	    				})
	    			links.push({source: nodes[name], target: nodes[mention_name]});
				}
				else if (create_node) {
					nodes[mention_name] = {
			        		name: mention_name,
			        		tweets: [],
			        		replies: [],
			        		mentions: [],
			        		image: null 
			        	};
					links.push({source: nodes[name], target: nodes[mention_name]});
				}
	    	})
    });
    
    return [nodes, links];
}

function display_graph(rows) {
    
    var rows = rows.filter(function(row) { 
    	if (row.length != COLUMN_PROFILE_IMAGE + 1) {
    		//console.log('Invalid data:', '(length :'+row.length+')', row)
    		return false;
    	}
    	return true;
    });
    
    var v = get_nodes_links_from_rows(rows, false),
    	nodes = v[0],
    	links = v[1];

    var w = parseInt(d3.select('body').style('width')),
        h = parseInt(d3.select('body').style('height'));
    
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
	setup_lists_dialog(circle, links, rows);
	setup_analytics(rows);
}

function setup_popup(circle) {
	circle.on('mouseover', function(d){
    	d3.select('#popup').style('visibility', 'visible');
	});
    circle.on('mousemove', function(d){
    	d3.select('#popup')
    		.style('left', d3.event.pageX+10)
    		.style('top', d3.event.pageY-20);
    	
    	d3.select('#popup_tweets')
			.text(d.tweets.length);
    	d3.select('#popup_replies')
    		.text(d.replies.length);
    	d3.select('#popup_mentions')
			.text(d.mentions.length);
    	d3.select('#popup_user_name')
    		.text(d.name);
	});
    circle.on('mouseout', function(d){
    	d3.select('#popup').style('visibility', 'hidden');
	});
} 

String.format = function() {
  var s = arguments[0],
      map = arguments[1];
  for (var key in map) {
    var reg = new RegExp("\\{" + key + "\\}", "gm");
    s = s.replace(reg, map[key]);
  }
  return s;
}

function setup_lists_dialog(circle, links, rows) {
	circle.on('click', function(d){
		d3.select("#summary_name")
			.text(d.name);
		d3.select("#summary_connections")
			.text(links.filter(function(l) {return l.source == d || l.target == d;}).length);
		d3.select("#summary_tweets")
			.text(d.tweets.length);
		
		d3.select("#summary_tweets_cnt")
			.text(d.tweets.length);
		d3.select("#summary_replies_cnt")
			.text(d.replies.length);
		d3.select("#summary_mentions_cnt")
			.text(d.mentions.length);
		
		var id_data = {
				'#summary_tweets_tab': d.tweets,
				'#summary_replies_tab': d.replies,
				'#summary_mentions_tab': d.mentions
				};
		for (var id in id_data) {
			var tweets = d3.select(id).selectAll('.twitter')
				.data(id_data[id])
				.html(supply_tweet_html);
			
			tweets.enter().append('div')
				.attr('class', 'twitter')
				.html(supply_tweet_html);
			
			tweets.exit().remove();
		}
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
		
		$('#summary_dialog').modal();
		
		setup_playback_dialog(d, rows);
	});
}

////maisonbisson.com/blog/post/12150/detecting-broken-images-in-javascript/
function iErr(source){
	//source.src = "/img/noavatar.jpg";
	
	source.onerror = "";
	return true;
}

