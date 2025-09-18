import graph from "./graph.json";
import node_data from "./nodes.json";

import  { getDisplayInfo, expand_synset, dijkstra, get_cost_and_distance, make_path,
		  random_node, minmax, nodeid_from_text, colors, zin,
		  zout, MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM, TEXT, COST} from "./core.js";

export function CreateNavigator () {
	return new Navigator();
}

class Navigator {

	constructor() {

        // general navigation
        this.current = null; this.origin = null; this.history = [];

        // game specific
        this.target = null; this.cost = 0; this.jumps = 0; this.delta = 0;

        // zoom levels
        this.zlevel = 1e6; this.xfactor = 0; this.total = 0; this.trvlog = [];

        this.jumpstot = 0; this.deltaj = 0; this.cheats = 0; this.nsyns = 0;

        this.backCache = []; this.costOriginal = 0;
	}

    // put this in a dict, this is massively verbose
        set(ctx) {
		this.current = ctx.curr; this.origin = ctx.origin; this.history = ctx.history;
		this.target = ctx.target; this.cost = ctx.cost; this.jumps = ctx.jumps;
		this.delta = ctx.delta; this.zlevel = ctx.zlevel; this.xfactor = ctx.xfactor;
		this.total = ctx.total; this.trvlog = ctx.trvlog; this.jumpstot = ctx.jumpstot;
		this.deltaj = ctx.deltaj; this.cheats = ctx.cheats; this.nsyns =ctx.nsyns;
	        this.backCache = ctx.backCache; this.costOriginal = ctx.costOriginal;
	}

        get() {
		return { curr: this.current, origin: this.origin, history: this.history,
				 target: this.target, cost: this.cost, jumps: this.jumps, delta:
				 this.delta, zlevel: this.zlevel, xfactor: this.xfactor,
				 total: this.total, trvlog: this.trvlog, jumpstot: this.jumpstot,
			         deltaj: this.deltaj, cheats: this.cheats, nsyns: this.nsyns,
			         backCache: this.backCache, costOriginal: this.costOriginal };

	}

	getDisplayInfo(extent) {

		var params = null; var displayInfo = null;

	    	var pure_nodes = Object.keys(node_data).map(function(key) {
		    return key; });

//	    pure_nodes = pure_nodes.slice(0,30200);


	    if ( this.xfactor == 0) {
			[params, displayInfo] = getDisplayInfo(graph[this.current], this.zlevel,
								  this.xfactor, this.current, extent);
//			[params, displayInfo] = getDisplayInfo(pure_nodes, this.zlevel,
//								  this.xfactor, this.current, extent);
		}
		else {
			var expanded_synset = expand_synset(graph[this.current], this.xfactor);
			[params, displayInfo] = getDisplayInfo(expanded_synset, this.zlevel,
								  this.xfactor, this.current, extent);
//			[params, displayInfo] = getDisplayInfo(pure_nodes, this.zlevel,
//								  this.xfactor, this.current, extent);
		}

		this.nsyns = params.nsyns;
	        return [params, displayInfo];

	}
/*
	getDispInfo(extent) {
	    var params = null; var displayInfo = null;

	    if ( this.xfactor == 0) {
		[params, displayInfo] = getDisplayInfo(graph[this.current], this.zlevel,
						       this.xfactor, this.current, extent);
	    }
	    else {
                var expanded_synset = expand_synset(graph[this.current], this.xfactor);
		if (expanded_synset.length < 5000) {
                    [params, displayInfo] = getDisplayInfo(expanded_synset, this.zlevel,
							   this.xfactor, this.current, extent);
		}
		else {
		    [params, displayInfo] = getDispInfo(this.current, this.zlevel, this.xfactor, extent);
		}
	    }
	    this.nsyns = params.nsyns;
	    return [params, displayInfo];
	    }
*/
	zoom(z) {

            if (z == true && this.zlevel > MIN_ZOOM)
	    {
		this.zlevel = zin[this.zlevel];
	    }

            else if (z == false && this.zlevel < MAX_ZOOM)
	    {
		this.zlevel = zout[this.zlevel];
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
				}
				else {
					this.zoom(false); // are in expansion mode. down-filter synset
					return;
				}
			}
			else { // xfactor not 0 -> in expansion mode
				this.xfactor++;  // expand synset
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
			}
		}
	}

	set_target(object) {

		var nodeid = (typeof(object) === 'string') ?
			nodeid_from_text(object, node_data) : object;

        if (nodeid == null || graph[nodeid].length == 0)
            return false;

        this.origin = this.current;
        this.target = nodeid;
        this.history = [this.current];
	this.trvlog = [this.current];
	this.backCache = [];

        var parent = dijkstra(graph, node_data, this.current, this.target);
        var [cost, jumps] = get_cost_and_distance(parent, this.target, node_data);

        this.cost = cost;
	this.total = 0;
	this.jumps = jumps;
	this.jumpstot = 0;
	this.deltaj = 0;
	this.costOriginal = this.cost;

        return true;
	}


    next() {
	this.backCache = [];

        if (this.target == null || this.current == this.target)
            return false;

        // find min cost path from current node
        var parent = dijkstra(graph, node_data, this.current, this.target);
        var [path, nodes] = make_path(parent, this.target, node_data);

        if (nodes.length > 1) {

            // get next node in path, calculate new cost and delta
			var new_cost; var new_jumps;
            var next_node = nodes[1];

            if (next_node != this.target) {
                var [cost, jumps] = get_cost_and_distance(parent, this.target, node_data);
                new_cost = cost - node_data[next_node][COST];
				new_jumps = jumps - 1;
			}
			else
			{
				new_jumps = 0;
				new_cost = 0;
			}

			this.delta = (next_node != this.target)? new_cost - this.cost : 0;
			this.deltaj = (next_node != this.target)? new_jumps - this.jumps : 0;
            this.current = next_node;
            this.cost = new_cost;
			this.jumps = new_jumps;

			if (this.trvlog.find(node => node == this.current) == undefined) {
				this.total += node_data[this.current][COST];
				this.jumpstot += 1;
			}

            this.history.push(next_node);
            this.trvlog.push(next_node);
			this.cheats++;
		}
		return true;
	}



    forward() {

	if (this.backCache.length != 0) {
	    var node = this.backCache.pop();
	    this.current = node;
	    this.history.push(node);
	}

    }

    back() {

        var node = this.history.pop();
	if (node == undefined)
	    return false;

        if (this.history.length == 0) {
            this.history.push(node);
	    this.trvlog.push(node) // bug may be double counted
            return true;
	}

	    this.current = this.history.slice(-1);
	    this.trvlog.push(node);
	    this.backCache.push(node)

            if (this.target != null) {

		// find min cost path from current node
		var parent = dijkstra(graph, node_data,
				      this.current, this.target);

		var [cost, jumps] = get_cost_and_distance(parent, this.target, node_data);
		this.delta = cost - this.cost;
		this.deltaj = jumps - this.jumps;

		var lastcost = cost;
		this.cost = lastcost;

		this.jumps = jumps;
		if (lastcost == 0)
		    this.jumpstot--;
	    }

	    return true;
	}




        // jump to a given word, possibly in a navigation session
        goto(object) {
	    this.backCache = [];

	    var next_node = (typeof(object) == 'string') ?
		nodeid_from_text(object, node_data) : object;

        if (next_node == null || graph[next_node].length == 0)
            return false;

        // if tracking to a target
        if (this.target != null) {

            // find min cost path from current node
            var parent = dijkstra(graph, node_data, next_node, this.target);
            var [new_cost, jumps] = get_cost_and_distance(parent, this.target, node_data);

            this.delta = new_cost - this.cost;
            this.deltaj = jumps - this.jumps;
            this.cost = new_cost;

			if (this.trvlog.find(node => node == next_node) == undefined) {
				this.total += node_data[next_node][COST];
				this.jumpstot += 1;
			}

			this.jumps = jumps;
		}

		this.current = next_node;
        this.history.push(this.current);
        this.trvlog.push(this.current);
        return true;
	}


    clear(f_all) {

		// doesn't clear current node
        this.target = null;
        this.cost = 0;
		this.jumps = 0;
		this.total = 0;
		this.jumpstot = 0;
	    this.delta = 0;
		this.deltaj = 0;
		this.cheats = 0;
		this.trvlog = [this.current];
		this.history = [this.current];
	        this.backCache = [];

		if (f_all) {
			this.zlevel = DEFAULT_ZOOM;
			this.xlevel = 0;
		}
	}

	getCurrentText() {
		return node_data[this.current][TEXT];
	}

	getTargetText() {

		if (this.target != null)
			return node_data[this.target][TEXT];
		else
			return '';
	}

        getOriginText() {

		if (this.target != null)
			return node_data[this.origin][TEXT];
		else
			return '';
	}

        getLevelText() {

	if (this.xfactor != 0) {
	    var str = 'X' + this.xfactor.toString();
//			+ ' (' + this.nsyns.toString()
//			+ ')';
	    return (str);
	}

	return this.getNumText(this.zlevel);

    }



     getNumText(num) {
/*
		if (this.xfactor != 0) {
			var str = 'X' + this.xfactor.toString()
				+ ' (' + this.nsyns.toString()
				+ ' syns)';
			return (str);
		}
*/
		var p; var v = 0;

		var expstr = num.toExponential(1);
		var parts = expstr.split('e');
		var exp = parseInt(parts[1], 10);

		if (exp > 8) {
			p = 'G';
			v = Math.floor(num/1e9);
		}
		else if (exp > 5) {
			p = 'M';
			v = Math.floor(num/1e6);
		}
		else if (exp > 2) {
			p = 'K';
		    v = Math.floor(num/1e3);
		}
		else {
			p = '';
		}
		return (v.toString() + p);
     }

        getCostText(num = this.cost) { return this.getNumText(num); }

        getCostOriginalText(num = this.costOriginal) { return this.getNumText(num); }


	getHistoryText() {
		var hist = '';
		for (var i = 0; i < this.history.length; i++) {
			if (i == this.history.length -1)
				var c = ' ';
			else
				c = ' > ';
			hist += (node_data[this.history[i]][TEXT] + c);
		}
		return hist;
	}


} // end class Navigator
