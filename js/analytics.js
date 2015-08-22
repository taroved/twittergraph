//Show dialog with hashtags statistics (already rendered)
function show_top_hashtags_dialog() {
	$('#analytics_dialog').modal();
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
