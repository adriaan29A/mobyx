import * as fs from 'fs';
import readlineSync from 'readline-sync';
import { CreatePriorityQueue } from './priorityQueue.js';
import { HelpText } from './helpText.js';

// temporary testing purposes
var g_c1 = 1; var g_c2 = 1; var g_limit = 0;

// zoom stuff
const MIN_ZOOM = 5e4;
const MAX_ZOOM = 12e9;
const DEFAULT_ZOOM = 1e6;

const ztable = [12e9, 5e8, 1e8, 1e7, 1e6, 5e5, 3e5, 15e4, 5e4];
const zin = {}; const zout = {};

for (var i = 0; i < ztable.length - 1; i++) {
    zin[ztable[i]] = ztable[i+1];
    zout[ztable[i+1]] = ztable[i];
}

// tuples/indexes
const ID = 0;
const TEXT = 0;
const COST = 1;

// color stuff
const blue = '\x1b[34m'; const lightblue = '\x1b[94m'; const magenta = '\x1b[35m'; const lightmagenta = '\x1b[95m';
const green = '\x1b[32m'; const lightgreen = '\x1b[92m'; const yellow = '\x1b[33m'; const lightyellow = '\x1b[93m';
const cyan = '\x1b[36m'; const lightcyan = '\x1b[96m'; const red = '\x1b[31m'; const lightred ='\x1b[91m';
const black = '\x1b[30m'; const lightblack = '\x1b[90m';

const dim = '\x1b[2m';
const normal = '\x1b[22m';
const reset = '\x1b[0m';

var colors = [blue, lightblue, cyan, lightcyan, magenta, lightmagenta,
              green, lightgreen, yellow, lightyellow, red, lightred];

var styles = [dim, normal];

var fmt = [];
for (var c of colors)
	for (var s of styles)
		fmt.push(c + s);

// command dispatch methods - these are the main
// action verbs resulting from user input.
function list(nav, ui) { nav.list(); }
function zoomin(nav, ui) { nav.integrated_zoom(true); }
function zoomout(nav, ui) { nav.integrated_zoom(false); }
function back(nav, ui) { nav.back(); }
function history(nav, ui) { nav.print_history(); }
function random_word(nav, ui){ nav.goto(find_random_node(1e7, nav.node_data));}
//function info(nav, ui) { nav.print_info(ui); }
function color_scale(nav, ui) { nav.print_color_scale(); }
function help(nav,ui) { console.log(HelpText); }
function clear_screen(nav, ui) { nav.clear_screan(); }
function downfilter(nav, ui) { nav.zoom(true); }
function upfilter(nav, ui) { nav.zoom(false); }
function play_loop(nav, ui) { nav.play_loop(1000); }
function print_info(nav, ui) { nav.print_info(nav, ui); }
function set_target(nav, ui) { if (!nav.set_target(ui[1])) console.log('error');}
function next(nav, ui) { nav.next(); }
function clear(nav, ui) { nav.clear(); console.log('cleared'); }

// keyboard command mapping
var commands = {'l': list, 'i': zoomin, 'o': zoomout, 'r': random_word, 'b': back,
				'-p': history, '-g': set_target, '-c': clear, 'n': next, '-h': help,
				'-a': play_loop, '-s': color_scale, '-cls': clear_screen,
				'j': downfilter, 'k': upfilter, '-pi': print_info};

// cmd line fixup for gogogadget - 'out of it' <-> out_of_it
function mangle(cmdline, /* mangle/unmangle flag */ f) {
    var res = '';
    var q = false; // q flips on begin/end a quoted piece of text
    for (var c of cmdline) {
		q = (c == '\'') ? !q : q;
		c = (c == ' ' && q && f) ? '_' : (c == '_' && q &&  !f) ? ' ' : c;
        res += c;
	}
    return res;
}

function gogogadget() {

    var [graph, node_data] = load_moby_graph();

    // Create a Navigator instance placed at a random word
    var nav = new Navigator(find_random_node(1e7, node_data),
							graph, node_data);
    nav.list();

    // Enter main loop
	while(true) {

        var ui = [];
		var line = readlineSync.question('\nmoby> ');
        line = mangle(line, true);

        var li = line.split(' ');
        for (var ele of li)
            ui.push(mangle(ele, false));

        if (ui[0] == '')
            continue;
        else if (ui[0] == 'q')
            break;

		// if a command, dispatch it
		if (commands[ui[0]] !== undefined)
			commands[ui[0]](nav, ui);

		// otherwise navigate to a single word
		else if (ui.length == 1) {
			if (nav.goto(ui[0]) != true)
				console.log('no synonyms');
		}
		// or navigate between two words
		else if (ui.length == 2) {
			if ((nav.set_current(ui[0]) != true)
				|| (nav.set_target(ui[1]) != true))
				console.log('no synonyms');
		}
	}
}

// Start of major functions

function read_file_data(filename) {
	debugger;
	var data = '';
	try {data = fs.readFileSync(filename, 'utf8');
		} catch (err) {
		console.error(err);
	}
	return data;
};

function load_moby_graph() {

	var nodes_string = read_file_data('/home/ac/dev/moby/src/nodes.json');
	var graph_string = read_file_data('/home/ac/dev/moby/src/graph.json');
//	var nodes_string = read_file_data('./src/nodes.json');
//	var graph_string = read_file_data('./src/graph.json');

	var nodes = JSON.parse(nodes_string);
	var graph = JSON.parse(graph_string);

	var node_data = {};

    // single quote any text containing apaces
    for (var id in nodes) {
		if (node_data[id] !== 'undefined') {

			var text = nodes[id][TEXT];
			if (text.indexOf(' ') != -1)
				text = '\'' + text + '\'';

			var cost = nodes[id][COST];
			node_data[id] = [text, cost];
		}
	}

	return [graph, node_data];
}

function dijkstra(G, C, start, goal, edge_weight = 0) {

    var visited = new Set();
	var cost = {}; cost[start] = 0;
	var parent = {}; parent[start] = null;
    var todo = CreatePriorityQueue();
	var empty = false;

    todo.push([0, start]);
	while (true) {
		while(true) {
			if (!todo.isEmpty()) {
				// finds lowest cost vertex
				var vertex = todo.pop()[1];
				// loop until new vertex
				if (!visited.has(vertex)) break;
			}
			else {
				empty = true;
				break;
			}
		}
		// done/ break to outer loop
		if (empty == true)
			break;

		visited.add(vertex);
		if (vertex == goal)
            break;

		for (var neighbor of G[vertex]) {
			if (visited.has(neighbor))
				continue;

		    var old_cost = cost[neighbor] ?? Infinity;


		    // serious bug I should have caught
		    //var cvertex = (C[vertex][COST] != 0) ? C[vertex][COST] : Infinity;
		    var cvertex = ((vertex == start) || (C[vertex][COST] != 0)) ? C[vertex][COST] : Infinity;
            var new_cost = cost[vertex] + cvertex + edge_weight;

            if (new_cost < old_cost) {
                todo.push([new_cost, neighbor]);
                cost[neighbor] = new_cost;
                parent[neighbor] = vertex;
			}
		}
	}
	return parent;
}

function make_path(parent, goal, node_data) {

//    if (!(goal in parent))
//        return null;

    var v = goal; var path = []; var nodes = [];

    // root has null parent
	while (v != null) {
        path.push(node_data[v][TEXT]);
        nodes.push(v);
        v = parent[v];
	}
    return [path.reverse(), nodes.reverse()];
}


function get_cost_and_distance(parent, goal, node_data) {

//	debugger;
//	if (!(goal in parent))
  //      return [Infinity, Infinity];

    var v = goal; var cost = 0; var distance = 0;

    // root has null parent
    while (v != null) {
        v = parent[v];
        if ((v != null) && (parent[v] != null)) {
            cost += node_data[v][COST];
            distance += 1;
		}
	}
    return [cost, distance];
}


// sort function for expand_synset
function compareFn(a, b) {
	var sa = (a[1][0] == '\'') ? a[1].slice(1, a[1].length - 1) : a[1];
	var sb = (b[1][0] == '\'') ? b[1].slice(1, b[1].length - 1) : b[1];
	return (sa < sb)? -1 : (sa > sb) ? 1 : 0;
}


const EXPANSION_FACTOR = 2; // = 1.6; // eyeballed
function expand_synset(synset, graph, node_data, level) {

	var synsets = [];
	var final_set = [];
	var expanded_list = [];
	var visited = new Set();

	// includes temp hack
	var limit = (g_limit == 0) ? synset.length * (Math.floor(EXPANSION_FACTOR ** level)) : g_limit;

	// populate the final list to be shown with
	// the nodes of the starting synsets.
	if (synset !== undefined) {
		for (var child of synset ) {
			visited.add(child);
			synsets.push(child);
			final_set.push([child, node_data[child][TEXT]]);
		}
	}
	// breadth first search for nearest terms
	// completing when the requested limit has
	// been reached. BUG - infinit loop possible
	if (limit != 0) {

		var count = 0;
		for (var node of synsets) {
			var children = graph[node];
			for (child of children) {

				if (!visited.has(child) && (child !== undefined)) {
					visited.add(child);
					synsets.push(child);
					final_set.push([child, node_data[child][TEXT]]);
					if (count++ > limit)
						break;
				}
			}
			if (count > limit)
				break;
		}
	}

	final_set = final_set.sort(compareFn);
	for (var item of final_set)
		expanded_list.push(item[0]);

	return expanded_list;
}

// helper functions for print/display_adjacency_list below

function sigmoid(freq, max_freq) {
    var c1 = g_c1; var c2 = g_c2 / c1;
    var f = freq / max_freq;
    if (f == 0)
        var y = 1.0 / Infinity;
    else
        y  =  1.0 / (1 + Math.exp(-1.0 * c1 * (f - c2)));
    return y;
}

function minmax(nodes) {
	var values = Object.keys(nodes).map(function(key) {
		return nodes[key]; });
	return [Math.min(...values), Math.max(...values)];
}

function center_line(line, nodecount, columns) {
    var slack = columns - (line.length - (nodecount + nodecount * (black.length + dim.length)));
    var half = Math.floor(slack / 2);
    if (half < 2)
        return line;
    else
        var centered_line = ' '.repeat(half) + line + ' '.repeat(half);
    return centered_line;
}

const DEFAULT_COLUMNS = 80 ;
const AVG_WORDS_PER_80_COL = 8 ;
function print_adjacency_list(nodes, node_data, graph, revised_node_costs,
							  min_cost, max_cost, zlevel, suppress_leafs, curr) {
    var ncur = 0;
    var nprev = 0;

	// Start with 80 columns of single characters. Grow the #columns with the
    // #lines at the rate of 1 column per line. The #lines is simply the
    // #words/10, (at the average of 10 words per line)
	var columns = (nodes.length < DEFAULT_COLUMNS) ? DEFAULT_COLUMNS :
	DEFAULT_COLUMNS + Math.floor((nodes.length - DEFAULT_COLUMNS) / (AVG_WORDS_PER_80_COL /2 ));


    var n = nodes.length;
    while (ncur < n) {

        // determines the number of nodes that can be printed on
        // one line and the total resulting line length
        var line_length = 0;
        while (true) {

            var node = nodes[ncur];
            var length = node_data[node][TEXT].length + 1; // 1 for 1 ws
            line_length += length;
            if (line_length >= columns - 1) {
                line_length -= length;
                ncur -= 1;
                break;
			}
            if (ncur == (n - 1))
                break;
            ncur += 1;
		}

        // Print one line
        var line = '';
        var nodecount = 0;
		for (i = nprev; i < ncur; i++) {

            if (graph[nodes[i]].length != 0) {

                if (node_data[nodes[i]][COST] < zlevel) {
                    if (max_cost == 0)
                        var id = 0;
                    else
                        id = Math.floor((revised_node_costs[nodes[i]] - min_cost) /
                                        (max_cost - min_cost) * (fmt.length - 1));

					if (nodes[i] == curr) //
						var format = lightred + normal;//
					else //
						format = fmt[id]; // original
				}
				else
					format = black + dim;
			}
			else {

				if (!suppress_leafs)
					format = lightblack + dim;
				else
					format = black + dim;
			}
			var curr_bracket_left = (nodes[i] == curr) ? '<' : ''; //
			var curr_bracket_right = (nodes[i] == curr) ? '>' : ''; //

            s = format + curr_bracket_left + node_data[nodes[i]][TEXT] + curr_bracket_right + ' '; //
            line += s;
            nodecount += 1;
		}

		console.log(center_line(line, nodecount, columns));
		//console.log(line);
        // print(black, end=''); ????

        // Done printing line
        ncur += 1;
		nprev = ncur;

	}  // end while(ncur < n)

	console.log(reset);
}

function display_adjacency_list(raw_nodes, node_data, graph, zlevel, xfactor, curr) {

    var nodes = [];
    var node_costs = {};
    var revised_node_costs = {};

    for (var node of raw_nodes) {
		if ((node_data[node] !== 'undefined') && (node_data[node][COST] != Infinity)) {
			nodes.push(node);
			node_costs[node] = node_data[node][COST];
		}
	}
    if (nodes.length == 0)
        return false;

    for (node of nodes)
        if (graph[node].length == 0)
            node_costs[node] = 0;

	// compute min and max cost before applying sigmoid
    var [min_cost, max_cost] = minmax(node_costs);
    for (node of nodes)
        if (node_data[node][COST] < zlevel)
            revised_node_costs[node] = Math.floor(node_costs[node]
												  * sigmoid(node_costs[node], max_cost));
        else
            // Important so these nodes don't contribute to scaling
            revised_node_costs[node] = 0;

    // post-sigmoid recompute max and min cost
    [min_cost, max_cost] = minmax(revised_node_costs);

    // leaf nodes blanked when any other nodes are.
    var suppress_leafs = false;
    for (node of nodes)
        if (graph[node].length != 0)
            if (node_data[node][COST] > zlevel) {
                suppress_leafs = true;
                break;
			}

	//console.clear();
    console.log('\n');

    print_adjacency_list(nodes, node_data, graph, revised_node_costs,
                         min_cost, max_cost, zlevel, suppress_leafs, curr);

	console.log('\nzoom:\t' + zlevel.toExponential(1));
	console.log('syns:\t', nodes.length);

	// if (xfactor != 0)
		// console.log('expand:\t', xfactor);

    console.log('curr:\t' + node_data[curr][TEXT] + ' (' + curr + ')');

    return true;
}


class Navigator
{
    constructor(current, graph, node_data) {

        this.graph = graph;
        this.node_data = node_data;

        // general navigation
        this.current = current;
        this.origin = current;
        this.history = [current];
        this.travlog = [current];

        // game specific
        this.target = null;
        this.cost = 0;
        this.last_delta = 0;

        // zoom levels
        this.zlevel = DEFAULT_ZOOM;
		this.xfactor = 0;
        this.zin = zin;
        this.zout = zout;

        this.nodeid_from_text = nodeid_from_text;
	}

	display(synset = this.graph[this.current]) {

		if ((g_limit == 0) && (this.xfactor == 0)) {
			display_adjacency_list(synset, this.node_data,
								   this.graph, this.zlevel, this.xfactor, this.current);
		}
		else {
			var expanded_synset = expand_synset(synset, this.graph, this.node_data, this.xfactor);
			display_adjacency_list(expanded_synset, this.node_data,
								   this.graph, this.zlevel, this.xfactor, this.current);
		}
	}

    list() {

		this.display();

		if (this.target != null) {
			var color = (this.last_delta <= 0 || this.current == this.origin) ? green : red;
			console.log('goal:\t', this.node_data[this.target][TEXT]);
			console.log('cost:\t' + color + this.cost.toLocaleString('en-US') + reset);
		}

    }

	zoom(z) {

        if (z == true && this.zlevel > MIN_ZOOM)
            this.zlevel = this.zin[this.zlevel];
        else if (z == false && this.zlevel < MAX_ZOOM)
			this.zlevel = this.zout[this.zlevel];

		this.display();

        if (this.target != null) {
			var color = (this.last_delta <= 0 || this.current == this.origin) ? green : red;
            console.log('goal:\t', this.node_data[this.target][TEXT]);
			console.log('cost:\t' + color + this.cost.toLocaleString('en-US') + reset);
		}
	}

	// zlevel (filtering) and xfactor (synset expansion) can be modified
	// independently but this function chains them to give an intgrated
	// zoom effect. zlevel = MAX_ZOOM and xfactor = 0 are used to transition
	// betwen the two regimes.

	integrated_zoom(z) {

		// zoom out
		if (z == false) {
			if (this.xfactor == 0) { // are in filter mode
				if (this.zlevel == MAX_ZOOM) { // already at max filter level
					this.xfactor++; // expand synset
					this.display();
				}
				else {
					this.zoom(false); // are in expansion mode. down-filter synset
					return;
				}
			}
			else { // xfactor not 0 -> in expansion mode
				this.xfactor++;  // expand synset
				this.display();
			}
		}
		// zoom in, (z = true)
		else {
			if (this.xfactor == 0) { // in filter mode
				this.zoom(true); // up filter synset
				return;
			}
			else {
				this.xfactor--; // unexpand synset
				this.display();
			}
		}

		if (this.target != null) {
			var color = (this.last_delta <= 0 || this.current == this.origin) ? green : red;
			console.log('goal:\t', this.node_data[this.target][TEXT]);
			console.log('cost:\t' + color + this.cost.toLocaleString('en-US') + reset);
		}
	}

	set_current(object) {

		var nodeid = (typeof(object) == 'string') ?
			this.nodeid_from_text(object, this.node_data) : object;

		if (nodeid == null || this.graph[nodeid].length == 0)
            return false;

        this.current = nodeid;
        this.history.push(this.current);
        return true;
	}


	set_target(object) {

		var nodeid = (typeof(object) == 'string') ?
			this.nodeid_from_text(object, this.node_data) : object;

        if (nodeid == null || this.graph[nodeid].length == 0)
            return false;

        this.origin = this.current;
        this.target = nodeid;
        this.history = [this.current];

		this.display();

        console.log('goal:\t', this.node_data[this.target][TEXT]);

        var parent = dijkstra(this.graph, this.node_data, this.current, this.target);
        var [cost, jumps] = get_cost_and_distance(parent, this.target, this.node_data);
        console.log('\nmin cost:\t' + cost.toLocaleString('en-US') + ' / ' + jumps.toLocaleString('en-US'));

        this.cost = cost; // current cost to target
        parent = dijkstra(this.graph, this.node_data, this.current, this.target, 1e8);
        [cost, jumps] = get_cost_and_distance(parent, this.target, this.node_data);
        console.log('min jumps:\t' + cost.toLocaleString('en-US') + ' / ' + jumps.toLocaleString('en-US'));

        return true;
	}

    next() {

        if (this.target == null) {
            console.log('No target selected');
            return false;
		}
        else if (this.current == this.target)
            return false;

        // find min cost path from current node
        var parent = dijkstra(this.graph, this.node_data, this.current, this.target);
        var [path, nodes] = make_path(parent, this.target, this.node_data);

        if (nodes.length > 1) {

            // get next node in path, calculate new cost and delta
            var next_node = nodes[1]; var new_cost;
            if (next_node != this.target) {
                var [cost, jumps] = get_cost_and_distance(parent, this.target, this.node_data);
                new_cost = cost - this.node_data[next_node][COST];
			}
			else
				new_cost = 0;

			this.last_delta = (next_node != this.target)? new_cost - this.cost : 0;

            this.current = next_node;
            this.history.push(next_node);
            this.travlog.push(next_node);
            this.cost = new_cost;

			this.display();

			var color = (this.last_delta <= 0)? green : red;
            console.log('target:\t', this.node_data[this.target][TEXT]);
			console.log('cost:\t' + color  + this.cost.toLocaleString() + reset); // dropped another endl
		}
		return true;
	}

	back() {

        var node = this.history.pop();
        if (this.history.length == 0) {
            this.history.push(node);
            return true;
		}

		this.current = this.history.slice(-1);
		this.display();

        if (this.target != null) {

            // find min cost path from current node
            var parent = dijkstra(this.graph, this.node_data,
								  this.current, this.target);

            var [cost, jumps] = get_cost_and_distance(parent, this.target,
													  this.node_data);
            this.last_delta = cost - this.cost;
            this.cost = cost;

			var color = (this.last_delta <= 0 || this.current == this.origin) ? green : red;
            console.log('goal:\t', this.node_data[this.target][TEXT]);
            console.log('cost:\t' + color  + this.cost.toLocaleString() + reset); // dropped another endl
		}

		return true;
	}


    // jump to a given word, possibly in a navigation session
	goto(object) {

		var next_node = (typeof(object) == 'string') ?
			this.nodeid_from_text(object, this.node_data) : object;

        if (next_node == null || this.graph[next_node].length == 0)
            return false;

		this.current = next_node;
		this.display(this.graph[this.current]);

        // if tracking to a target
        if (this.target != null) {

            // find min cost path from current node
            var parent = dijkstra(this.graph, this.node_data, next_node, this.target);
            var [new_cost, jumps] = get_cost_and_distance(parent, this.target, this.node_data);

            this.last_delta = new_cost - this.cost;
            this.cost = new_cost;

			var color = (this.last_delta <= 0 || this.current == this.origin) ? green : red;
            console.log('goal:\t', this.node_data[this.target][TEXT]);
            console.log('cost:\t' + color  + this.cost.toLocaleString() + reset); // dropped another endl
		}

        this.history.push(this.current);
        this.travlog.push(this.current);

        return true;
	}

	play_loop(n) {

		for (var i = 0; i < n; i++) {
			var start = find_random_node(1e4, this.node_data);
			var target = find_random_node(1e4, this.node_data);
			this.clear();
			this.zlevel = DEFAULT_ZOOM;
			this.set_current(start);
			this.set_target(target);
			sleep(SLEEP_TIME);
		}
	}

    print_history() {
        var path = '';
        if (this.history.length == 0)
            this.history.push(this.current);
        for (var nodeid of this.history)
            path += this.node_data[nodeid][TEXT] + ' ';
        console.log(path);
	}

    print_color_scale() {

        var color_scale = '';

        // Get max cost in current view
        var node_costs = {};
        var adj_list = this.graph[this.current];
        for (var nodeid of adj_list)
            if (this.node_data[nodeid][COST] < this.zlevel)
                node_costs[nodeid] = this.node_data[nodeid][COST];

        var [min_cost, max_cost] = minmax(node_costs);
        for (i = 0; i < colors.length; i++) {
            var color = colors[i];
            var flat_level = i * (max_cost - min_cost)/colors.length + min_cost;
            var scaled_level = flat_level; // = Math.floor(flat_level * sigmoid(flat_level, max_cost));
            var level = scaled_level.toExponential(0);
			color_scale += color + level + ' ';
		}
        console.log('\n' + color_scale);
        console.log(reset);
	}

    clear() {

        this.target = null;
        this.cost = 0;
        this.last_delta = 0;
		this.travlog = [this.current];
        this.history = [this.current];
        this.zlevel = DEFAULT_ZOOM;
	}



    // prints path info between two words
    print_info (nav, ui) {

	var data = ui;
	var node_data = nav.node_data;
	var graph = nav.graph;

	if (data.length == 5) {
            var start = nodeid_from_text(ui[1], node_data);
            var goal = nodeid_from_text(ui[2], node_data);
            var edge_weight = parseInt(parseFloat(ui[3]));
            var display_path = ui[4];
            var parent = dijkstra(graph, node_data, start, goal, edge_weight);
            const [cost, distance] = get_cost_and_distance(parent, goal, node_data);;
            const [path, nodes] = make_path(parent, goal, node_data);
	    console.log('\ncost: ' + cost.toLocaleString('en-US'));
	    console.log('jumps: ' + distance);

            if (display_path == 'y')
		console.log(path);
	}
	else if (data.length == 2) {
            var nodeid = nodeid_from_text(ui[1], node_data);
            var cost = node_data[nodeid][COST];
	    console.log('\ncost: ' + cost.toLocaleString('en-US'));
	}
	else if (data.length == 3) {
            var nodeid1 = nodeid_from_text(ui[1], node_data);
            var nodeid2 = nodeid_from_text(ui[2], node_data);
	    var cost1 = node_data[nodeid1][COST];
	    var cost2 = node_data[nodeid2][COST];
	    console.log('\ncost1: ' + cost1.toLocaleString('en-US'));
	    console.log('\ncost2: ' + cost2.toLocaleString('en-US'));
	}

    }

} // end class Navigator


// ---------- sundry utility, test and other unloved functions ----------

// unused
function makeStruct(keys) {

	if (!keys) return null;
	const k = keys.split(', ');
	const count = k.length;
	function constructor() {
		for (let i = 0; i < count; i++) this[k[i]] = arguments[i];
	}
	return constructor;
}


const NUM_ROOT_WORDS = 30260;
function find_random_node(mincost, node_data) {
    while(true) {
        var nodeid = Math.floor(Math.random() * NUM_ROOT_WORDS);
        var cost = node_data[nodeid][COST];
        if (cost != Infinity && cost > mincost)
            return nodeid;
	}
}

function nodeid_from_text(text, node_data) {

    // This func is O(N), but it is rarely used and the
    // the need for an auxiliary dictionary is avoided.
	for (var nodeid in node_data) {
		if (node_data[nodeid][TEXT] == text)
		    return parseInt(nodeid, 10);
	}
	return null;
}

const SLEEP_TIME = 2500;
function sleep(milliseconds) {
	const date = Date.now();
	let currentDate = null;
	do {
	  currentDate = Date.now();
	} while (currentDate - date < milliseconds);
}




function test(nav, ui) {

    console.log('here')
    print_info(ui[1], nav.graph, nav.node_data);
    print_info(ui[2], nav.graph, nav.node_data);

}


gogogadget();


/*
const [graph, nodes] = load_moby_graph();

var synsetx = graph[find_random_node(1e2, nodes)];
var synsety = graph[find_random_node(1e2, nodes)];

var expandx = expand_synset(synsetx, graph, nodes, 7);
var expandy = expand_synset(synsety, graph, nodes, 7);

console.log(expandx);
console.log(expandy);

const dupes = [];

for (s of expandx) {

    if (expandy.includes(s)) {
	const index = expandy.indexOf(s);
	dupes.push(expandy.splice(index, 1));
    }
}

for (s of expandy) {
    if (expandx.includes(s)) {
	const index = expandx.indexOf(s);
	dupes.push(expandx.splice(index, 1));
    }
}

console.log("dupes.len:" + dupes.length);

var [big, small] = ((expandy.length > expandx.length) ? [expandy, expandx] : [expandx, expandy]);




var bl = big.length;
var sl = small.length;

var ratio = 0;

if (bl > 9e4)
    ratio = 1;
else if (bl > 7e4)
    ratio =.9;
else if (bl > 5e4)
    ratio = .6;
else
    ratio = .2;

var estimate = ratio * sl;

console.log('estimate = ' + estimate);

*/


//        1         2         3         4         5         6         7         8         9        10        11        12        13        14
//2345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890
