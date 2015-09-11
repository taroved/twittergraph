//Show dialog with hashtags statistics
function show_top_tweeters_dialog() {
	setup_tweeter_analytics(result_rows);
	$('#analytics_dialog').modal();
}
//Show dialog with hashtags statistics
function show_top_hashtags_dialog() {
	setup_hashtag_analytics(result_rows);
	$('#analytics_dialog').modal();
}
//Show archive search dialog
function show_archive_dialog() {
	$('#archive_dialog').modal();
}

//Prepare sorted collection of hash-count pairs and call draw function
function setup_tweeter_analytics(rows) {
	var tweeters = {}; 
	
	rows.forEach(function(row) {
		var tweeter = row[COLUMN_SCREEN_NAME];
		tweeters[tweeter] = tweeter in tweeters ? tweeters[tweeter]+1 : 1;
	});
	
	var sorted = [];
	for (k in tweeters) {
		sorted.push({hash: k, count: tweeters[k]});
	}
	sorted.sort(function(a, b){return b.count-a.count});
	
	draw_linear_chart('Top Tweeters', sorted);
}

//Prepare sorted collection of hash-count pairs and call draw function
function setup_hashtag_analytics(rows) {
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
	
	d3.select("#analytics_dialog .chart").html("");  // clear chart
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
	
	//setup filters
	d3.select('#archive_dialog_tweet_filter').on('keyup', filter);
	d3.select('#archive_dialog_name_filter').on('keyup', filter);
	
	//filters keyup handler
	function filter(d, index) {
		var tweet_search = d3.select('#archive_dialog_tweet_filter')[0][0].value;
		var name_search = d3.select('#archive_dialog_name_filter')[0][0].value;
		var filtered_rows = rows.filter(function(row) {
			return row[COLUMN_TWEET_TEXT].indexOf(tweet_search) != -1 
				&& row[COLUMN_SCREEN_NAME].indexOf(name_search) != -1;
		});
		render_archive_page(filtered_rows, 1, 25);
	}
}

//Show separate page
function render_archive_page(rows, page, size) {
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

//todo: it doesn't stop bubbling. to make it work. ...I have found out the question. Scroll bubbling is not stoppable: http://stackoverflow.com/questions/1459676/prevent-scroll-bubbling-from-element-to-window 
d3.select("#archive_dialog").on('mousewheel', function(){
	d3.event.sourceEvent.stopPropagation();
	window.event.cancelBubble = true; //IE
	return false;
});
