
function setup_playback_dialog(circle_d, rows) {
	d3.select("#replay_tweets").on("click", function(d) {
		d3.select("#playback_name")
			.text(circle_d.name);
		
		var v = get_nodes_links_from_rows(rows, true), 
			links = v[0],//links.filter(function(l) {return l.source == circle_d || l.target == circle_d;})
			nodes = v[1]; 
		$('#playback_dialog').modal();
	});
}