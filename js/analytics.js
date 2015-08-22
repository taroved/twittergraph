//Show dialog with hashtags statistics (already rendered)
function show_top_hashtags_dialog() {
	$('#analytics_dialog').modal();
}
function show_archive_dialog() {
	$('#archive_dialog').modal();
}

//Prepare sorted collection of hash-count pairs and call draw function
function setup_analytics(rows) {
	var hashtags = {},
		regexp = /#[a-zA-Z0-9_]+/g; 
	
	rows.forEach(function(row) {
		var tweet = row[COLUMN_TWEET_TEXT],
			match = null;
		while ((match = regexp.exec(tweet)) != null) {
			hashtags[match[0]] = (match[0] in hashtags ? hashtags[match[0]]+1 : 1);
		}
	});
	
	var sorted = [];
	for (k in hashtags) {
		sorted.push({hash: k, count: hashtags[k]});
	}
	sorted.sort(function(a, b){return b.count-a.count});
	
	draw_linear_chart('Top Hashtags', sorted);
}

//Draw linear chart for hash-count pairs
function draw_linear_chart(title, data) {
	$('#analytics_label').html(title);
	
	var chart_width = 300,
		title_width = 150,
		bar_height = 20;
	
	var x = d3.scale.linear()
    	.domain([0, d3.max(data.map(function(o){ return o.count; }))])
    	.range([0, chart_width]);
	
	var chart = d3.select("#analytics_dialog .chart").append('svg:svg')
    	.attr("width", chart_width+title_width)
    	.attr("height", bar_height * data.length);
	var bar = chart.selectAll("g")
    	.data(data)
      .enter().append("g")
      	.attr("transform", function(d, i) { return "translate(0," + i * bar_height + ")"; });
	
	bar.append("rect")
		.attr("x", title_width)
    	.attr("width", function(d){ return x(d.count); })
    	.attr("height", bar_height - 1);

	bar.append("text")
	    .attr("x", function(d) { return title_width+x(d.count) - 3; })
	    .attr("y", bar_height / 2)
	    .attr("dy", ".35em")
	    .text(function(d) { return d.count; });
	
	bar.append("text")
		.attr("class", "title")
	    .attr("x", 0)
	    .attr("y", bar_height / 2)
	    .attr("dy", ".35em")
	    .text(function(d) { return d.hash; });

}

//Prepare nodes and show page
function setup_archive(rows) {
	render_archive_page(rows, 1, 25);
}

var global_rows = null;
//Show separate page
function render_archive_page(rows, page, size) {
	if (rows)
		global_rows = rows;
	else
		rows = global_rows;
	show_archive_pagination(rows, page, size);
	
	var page_rows = rows.slice(size*(page-1), size*page);
	var tweets = page_rows.map(function(row){
		return {
    		id: row[COLUMN_TWEET_URL].match(/\d+$/)[0],
			date: row[COLUMN_DATE],
			name: row[COLUMN_SCREEN_NAME],
			text: row[COLUMN_TWEET_TEXT],
			image: row[COLUMN_PROFILE_IMAGE],
    	};
	}); 
	
	var tweet_divs = d3.select("#archive_page").selectAll('.twitter')
		.data(tweets)
		.html(supply_tweet_html);
	
	tweet_divs.enter().append('div')
		.attr('class', 'twitter')
		.html(supply_tweet_html);
	
	tweet_divs.exit().remove();

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
}

function show_archive_pagination(rows, page, size) {
	debugger;
	var page_count = Math.ceil(rows.length / size);
	if (page==1)
		d3.select('#archive_pagination ul').select('.previous')
			.attr('class', 'previous disabled');
	else {
		d3.select('#archive_pagination ul').select('.previous')
			.attr('class', 'previous')
			.select('a')
				.on('click', function(){
					render_archive_page(rows, page-1, size);
				});
	}
	
	d3.select('#archive_pagination .current').html(page);
	
	if (page==page_count)
		d3.select('#archive_pagination ul').select('.next')
			.attr('class', 'next disabled');
	else {
		d3.select('#archive_pagination ul').select('.next')
			.attr('class', 'next')
			.select('a')
				.on('click', function(){
					render_archive_page(rows, page+1, size);
				});
	}
}

//todo: it doesn't stop bubbling. to make it work
d3.select("#archive_dialog").on('mousewheel', function(){
	d3.event.sourceEvent.stopPropagation();
	window.event.cancelBubble = true; //IE
	return false;
});