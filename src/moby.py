"""
Navigate the Moby thesaurus

1) Type in a single term (a word or phrase) to see a list of its synonyms
   colored and filtered by word frequency

moby> splendiferous
moby> 'transcendental meditation'

2) Type in two terms to navigate between the two:

moby> luxury poverty
moby> dregs 'upper crust'

This will set up a navigation session between them: The first term is made current
and the second term the target. The object is to graph-walk your way to the target: You can do
this by guessing the next best synonym from the list (hard) or just enter 'n' (next) to let
Moby compute it, and follow along or guess at each turn.

3) Commands:

Zoom in and out on a set of synonyms, view/clear history, etc.

'l' - lists the current word/phrase and its synonyms
'i' - zoom in  (filter out higher frequency terms)
'o' - zoom out (filter in higher frequency terms)
'n' - jumps to the next best* term in a navigation session
'b' - jump back to the previous term in the history
'r' - navigate to a random term and list its synonyms
'q' - quit

'-g' <target> - starts a navigation session to the target term
'-p' - print history
'-c' - clear history and ends the current navigation session if one exists
'-a' - play loop 10 random terms.
'-h' - prints this help
'-s' - prints word frequency color scale

*best - the next best word/phrase from the current to the target is
computed via minimum cost (frequency) path using Dijkstra's algorithm

"""
#!/usr/bin/env python
import pdb
import random
from collections import namedtuple
import math
import json
from queue import PriorityQueue # binary heap
import time
from os import system, name
import locale

# used for console cleare screen
locale.setlocale(locale.LC_ALL, '')  # Use '' for auto, or force e.g. to 'en_US.UTF-8'
def clear():
    if name == 'nt':
        _ = system('cls')
    else:
        _ = system('clear')


# temporary testing purposes
g_c1 = 1; g_c2 = 0

# zoom stuff
MAX_ZOOM = int(12e9)
MIN_ZOOM = int(5e4)
DEFAULT_ZOOM = int(1e6)

ztable = [12e9, 1e9, 1e8, 1e7, 1e6, 5e5, 3e5, 15e4, 5e4]
zin = {}; zout = {}
for i in range(len(ztable) - 1):
    zin[int(ztable[i])] = int(ztable[i+1])
    zout[int(ztable[i+1])] = int(ztable[i])

# tuples/indexes
Node = namedtuple("Node", "text cost")
ID = 0
TEXT = 0
COST = 1

# color stuff
blue = '\x1b[34m'; lightblue = '\x1b[94m'; magenta = '\x1b[35m'; lightmagenta = '\x1b[95m';
green = '\x1b[32m'; lightgreen = '\x1b[92m';yellow = '\x1b[33m'; lightyellow = '\x1b[93m';
cyan = '\x1b[36m'; lightcyan = '\x1b[96m'; red = '\x1b[31m'; lightred ='\x1b[91m';
black = '\x1b[30m'; lightblack = '\x1b[90m'

dim = '\x1b[2m'
normal = '\x1b[22m'
reset = '\x1b[0m'

colors = [blue, lightblue, cyan, lightcyan, magenta, lightmagenta,
           green, lightgreen, yellow, lightyellow, red, lightred]

styles = [dim, normal]

fmt = []
for c in colors:
    for s in styles:
        fmt.append(c + s)


def read_word_data(filename):
    with open(filename) as f:
         lines = f.read().splitlines()
         f.close()
    return lines

GRAPH_REDUCE_FACTOR = 0
def create_moby_graph():
    """
    Run at build time - makes the two files used at runtime

    input:
    words.txt (the moby thesaurus)
    google_word_frequencies.txt

    output:
    moby.nodes - dictionary containing the cost and text for
    each term in the thesaurus, keyed on nodeid (integer)

    moby.graph - dictionary containing the adjacency lists for
    each root term in the thesaurus, expressed in node ids

    """
    ordinals = {}
    node_data = {}
    frequencies = {}
    graph = {}

    i = 0
    # Read in Google word frequencies
    lines = read_word_data('./junkyard/google_word_frequencies.txt')
    for line in lines:
        data = line.split('\t')
        frequencies[data[0]] = int(data[1])

    # Read in Moby thesaurus, combine with word frequencies.
    # ordinals is keyed off word to yield (nodeid, freq)
    lines = read_word_data('./junkyard/words.txt')
    for line in lines:
        root_word = (line.split(',', 1))[0]
        if frequencies.get(root_word) is not None:
            ordinals[root_word] = (i, frequencies[root_word])
        else:
            ordinals[root_word] = (i, estimate_frequency_of_phrase(root_word, frequencies))
        i += 1

    # Include leaf nodes
    leafs = {}
    for line in lines:
        synonyms = line.split(',')
        for s in synonyms:
            if ordinals.get(s) is None:
                if frequencies.get(s) is not None:
                    ordinals[s] = leafs[s] = (i, frequencies[s])
                else:
                    ordinals[s] = leafs[s] = (i, estimate_frequency_of_phrase(s, frequencies))
                i += 1 # starting with the value i from above

    # Construct graph
    for line in lines:
        nodes = []
        synonyms = line.split(',')
        for s in synonyms:
            o = ordinals[s]
            nodes.append(o[ID])

        graph[nodes[0]] = nodes

    # BUG - not filtering out bad nodes when constructing graph -
    # this bug is NOT due to json

    # Don't forget leafs node identies (no reference list)
    for s in leafs:
        o = ordinals[s]
        graph[o[ID]] = []

    # Two hash tables in total
    for name, (id, cost)  in ordinals.items():
        node_data[id] = Node(name, cost)

    # testing purposes
    if (GRAPH_REDUCE_FACTOR != 0):
        graph, node_data = reduce_graph_size(GRAPH_REDUCE_FACTOR, node_data, graph)

    with open('./junkyard/nodes.json', 'w') as convert_file:
        convert_file.write(json.dumps(node_data))

    with open('./junkyard/graph.json', 'w') as convert_file:
        convert_file.write(json.dumps(graph))

    print('graph:', len(graph))
    print('nodes: ', len(node_data))

    return graph, node_data


# testing
NUM_WORDS = 103296
def reduce_graph_size(factor, nodes, graph):

    for node in range(NUM_WORDS):
        if (node % factor != 0) and (nodes.get(node) != None):
            nodes.pop(node)
            graph.pop(node)

    for node in graph:
        if graph.get(node) != None:
            li = graph[node].copy()
            for adj in li:
                if (adj % factor != 0):
                    graph[node].remove(adj)

    return graph, nodes


def load_moby_graph():

    graph = {}; node_data = {}; json_graph = {}

    with open('graph.json') as f:
        data = f.read()
        json_graph = json.loads(data)

    with open('nodes.json') as f:
        data = f.read()
        json_nodes = json.loads(data)

    # json keys everything on string
    # convert graph to int key
    for k, v in json_graph.items():
        graph[int(k)] = v

    # ditto for nodes plus fixup
    for id in json_nodes:

        text = json_nodes[id][TEXT]
        if text.find(' ') != -1:
            text = '\'' + text + '\''

        cost = json_nodes[id][COST]
        # cost = cost if cost != -1 else float('inf')
        node_data[int(id)] = Node(text, cost)

    return graph, node_data


def dijkstra(G, C, start, goal, edge_weight = 0):
    visited = set()
    cost = {start: 0}
    parent = {start: None}
    todo = PriorityQueue()

    todo.put((0, start))
    while todo:
        while not todo.empty():
            # finds lowest cost vertex
            _, vertex = todo.get()
            # loop until new vertex
            if vertex not in visited: break
        else: # if todo ran out
            break # quit main loop

        visited.add(vertex)
        if vertex == goal:
            break

        for neighbor in G[vertex]:
            if neighbor in visited:
                continue

            old_cost = cost.get(neighbor, float('inf'))
            cvertex = C[vertex].cost if C[vertex].cost != 0 else float('inf')
            new_cost = cost[vertex] + cvertex + edge_weight
            if new_cost < old_cost:
                todo.put((new_cost, neighbor))
                cost[neighbor] = int(new_cost)
                parent[neighbor] = vertex

    return parent

def make_path(parent, goal, node_data):
    if goal not in parent:
        return None
    v = goal
    path = []
    nodes = []
    while v is not None: # root has null parent
        path.append(node_data[v].text)
        nodes.append(v)
        v = parent[v]

    return path[::-1], nodes[::-1]


def get_cost_and_distance(parent, goal, node_data):
    if goal not in parent:
        return float('inf'), float('inf')
    v = goal
    cost = 0
    distance = 0
    # root has null parent
    while v is not None:
        v = parent[v]
        if (v is not None) and (parent[v] is not None):
            cost += node_data[v].cost
            distance += 1

    return cost, distance


def sigmoid(freq, max_freq):

    c1 = g_c1; c2 = g_c2 / c1
    f = freq / max_freq
    if f == 0:
        y = 1.0 / float('inf')
    else:
        y  =  1.0 / (1 + math.exp(-1.0 * c1 * (f - c2)))
    return y


def minmax(nodes):
    return min(nodes.values()), max(nodes.values())


def print_adjacency_list(nodes, node_data, graph, revised_node_costs,
                         min_cost, max_cost, zlevel, suppress_leafs):
    ncur = 0
    nprev = 0

    n = len(nodes)
    while ncur < n:

        # determines the number of nodes that can be printed on
        # one line and the total resulting line length
        line_length = 0
        while (True):

            node = nodes[ncur]
            length = len(node_data[node].text) + 1
            line_length += length
            if line_length >= COLUMNS - 1:
                line_length -= length
                ncur -= 1
                break
            if ncur == n - 1:
                break
            ncur += 1

        # Print one line
        line = ''
        nodecount = 0
        for i in range(nprev,ncur + 1):

            if len(graph[nodes[i]]) != 0:
                if node_data[nodes[i]].cost < zlevel:
                    if max_cost == 0:
                        id = 0
                    else:
                        id = math.floor((revised_node_costs[nodes[i]] - min_cost) /
                                        (max_cost - min_cost) * (len(fmt) - 1))
                    format = fmt[id]
                else:
                    format = black + dim
            else:
                if not suppress_leafs:
                    format = lightblack + dim
                else:
                    format = black + dim

            s = format + node_data[nodes[i]].text + ' '
            nodecount += 1
            line += s

        print(center_line(line, nodecount))
        print(black, end='')

        # Done printing line
        ncur += 1
        nprev = ncur
    # end while
    print(reset)

def display_adjacency_list(raw_nodes, node_data, graph, zlevel):

    nodes = []
    node_costs = {}
    revised_node_costs = {}

    for node in raw_nodes:
        if node_data[node].cost != float('inf'):
            nodes.append(node)
            node_costs[node] = node_data[node].cost

    if len(nodes) == 0:
        return False

    for node in nodes:
        if len(graph[node]) == 0:
            node_costs[node] = 0

    min_cost, max_cost, = minmax(node_costs)

    for node in nodes:
        if node_data[node].cost < zlevel:
            revised_node_costs[node] = math.floor(node_costs[node]
                * sigmoid(node_costs[node], max_cost))
        else:
            # Important so these nodes don't contribute to scaling
            revised_node_costs[node] = 0

    # recompute max and min cost
    min_cost, max_cost = minmax(revised_node_costs)

    # leaf nodes blanked when any other nodes are.
    suppress_leafs = False
    for node in nodes:
        if len(graph[node]) != 0:
              if node_data[node].cost > zlevel:
                suppress_leafs = True
                break

    clear()
    print(); print()
    print_adjacency_list(nodes, node_data, graph, revised_node_costs,
                         min_cost, max_cost, zlevel, suppress_leafs)

    print('\nzoom:\t' + f'{zlevel:.1E}')

    return True


COLUMNS = 80
def center_line(line, nodecount):
    slack = COLUMNS - (len(line) - (nodecount + nodecount * (len(black) + len(dim))))
    half = math.floor(slack / 2)
    if half < 2:
        return line
    else:
        c_line = half * ' ' + line + half * ' ';
    return c_line

NUM_ROOT_WORDS = 30260
def find_random_node(mincost, node_data):

    while(True):
        nodeid = random.randint(0, NUM_ROOT_WORDS - 1)
        if (GRAPH_REDUCE_FACTOR == 0) or (nodeid % GRAPH_REDUCE_FACTOR == 0):
            cost = node_data[nodeid].cost
            if (cost != float('inf')) and (cost > mincost):
                return nodeid


def print_info (data, graph, node_data):
    if len(data) == 5:

        start = nodeid_from_text(data[1], node_data)
        goal = nodeid_from_text(data[2], node_data)
        edge_weight = int(data[3])
        display_path = data[4]
        parent = dijkstra(graph, node_data, start, goal, edge_weight)
        cost, distance = get_cost_and_distance(parent, goal, node_data)
        path, nodes = make_path(parent, goal, node_data)
        print(f'\ncost: {cost:,}')
        print(f'jumps: {distance:,}')

        if display_path == 'y':
            print(path)

    elif len(data) == 2:
        nodeid = nodeid_from_text(data[1], node_data)
        cost = node_data[nodeid].cost
        print(f"\n{cost:,}\n")

def estimate_frequency_of_phrase(phrase, frequencies):

    # bug - doesn't catch the case of mixed hyphen/whitespace use
    delimiter = '-' if phrase.find(' ') == -1 else ' '
    parts = phrase.split(delimiter)
    total = 0; count = 0

    for word in parts:
        if len(word) > 3:
            freq = frequencies.get(word)
            freq = 0 if freq == None else freq
            total += freq
            count += 1

    count = 1 if count == 0 else count
    return math.floor(total/(count*count))


def nodeid_from_text(text, node_data):
    """

    This func is O(N), but it is rarely used and the
    the need for an auxiliary dictionary is avoided

    """
    li = list(filter(lambda i: node_data[i].text == text, node_data))
    if len(li) == 1:
        return li[0]
    else:
        return None



class Nav:
    def __init__(self, current, graph, node_data):

        # per process globals
        self.graph = graph
        self.node_data = node_data

        # general navigation
        self.current = current
        self.origin = current
        self.history = [current]
        self.travlog = {current}
        self.last_delta = 0

        # game specific
        self.target = None
        self.cost = 0

        # zoom levels
        self.zlevel = DEFAULT_ZOOM
        self.zin = zin
        self.zout = zout

        self.nodeid_from_text = nodeid_from_text

    def list(self):

        display_adjacency_list(self.graph[self.current], self.node_data,
                            self.graph, self.zlevel)

        print('curr:\t', self.node_data[self.current].text)
        if  self.target != None:
            print('goal\t', self.node_data[self.target].text)

            color = green if (self.last_delta <= 0 or self.current == self.origin) else red
            print(f'cost:\t' + color + f'{self.cost:,}' + reset,  end = '')


    def zoom(self, z):

        if (z == True) and (self.zlevel > MIN_ZOOM):
            self.zlevel = self.zin[self.zlevel]

        elif (z == False) and self.zlevel < MAX_ZOOM:
            self.zlevel = self.zout[self.zlevel]

        display_adjacency_list(self.graph[self.current], self.node_data,
                               self.graph, self.zlevel)

        print('curr:\t', self.node_data[self.current].text)
        if self.target != None:
            print('goal:\t', self.node_data[self.target].text)

            color = green if (self.last_delta <= 0 or self.current == self.origin) else red
            print(f'cost:\t' + color + f'{self.cost:,}' + reset,  end = '')


    def set_target(self, target):

        nodeid = self.nodeid_from_text(target, self.node_data)
        if nodeid == None or len(self.graph[nodeid]) == 0:
            return False

        self.origin = self.current
        self.target = nodeid
        self.history = [self.current]

        display_adjacency_list(self.graph[self.current],self.node_data,
                               self.graph, self.zlevel)

        print('curr:\t', self.node_data[self.current].text)
        print('goal:\t', self.node_data[self.target].text)

        parent = dijkstra(self.graph, self.node_data, self.current, self.target)
        cost, jumps = get_cost_and_distance(parent, self.target, self.node_data)
        print(f'\nmin cost:\t{cost:,} / {jumps:,}')

        self.cost = cost # current cost to target

        parent = dijkstra(self.graph, self.node_data, self.current, self.target, 10000000000)
        cost, jumps = get_cost_and_distance(parent, self.target, self.node_data)
        print(f'min jumps:\t{cost:,} / {jumps:,}')

        return True


    def next(self):

        if self.target == None:
            print('No target selected')
            return False

        if (self.current == self.target):
            return False

        # find min cost path from current node
        parent = dijkstra(self.graph, self.node_data, self.current, self.target)
        path, nodes = make_path(parent, self.target, self.node_data)

        if len(nodes) > 1:

            # get next node in path, calculate new cost and delta
            next_node = nodes[1]
            if next_node != self.target:
                cost, jumps = get_cost_and_distance(parent, self.target, self.node_data)
                new_cost = cost - self.node_data[next_node].cost
            else:
                new_cost = 0

            self.last_delta = (new_cost - self.cost) if next_node != self.target else 0

            self.current = next_node
            self.history.append(next_node)
            self.travlog.add(next_node)
            self.cost = new_cost

            display_adjacency_list(self.graph[self.current],self.node_data,
                                   self.graph, self.zlevel)

            print('curr:\t', self.node_data[self.current].text)
            print('goal:\t', self.node_data[self.target].text)

            color = green if self.last_delta <= 0 else red
            print(f'cost:\t' + color + f'{self.cost:,}' + reset,  end = '')


    def back(self):
        node = self.history.pop()
        if len(self.history) == 0:
            self.history.append(node)
            return

        self.current = self.history[-1]
        display_adjacency_list(self.graph[self.current], self.node_data,
                               self.graph, self.zlevel)
        print('curr:\t' + self.node_data[self.current].text)

        if self.target != None:

            # find min cost path from current node
            parent = dijkstra(self.graph, self.node_data, self.current, self.target)
            cost, jumps = get_cost_and_distance(parent, self.target, self.node_data)

            self.last_delta = cost - self.cost
            self.cost = cost

            print('goal:\t', self.node_data[self.target].text)

            color = green if (self.last_delta <= 0 or self.current == self.origin) else red
            print(f'cost:\t' + color + f'{self.cost:,}' + reset,  end = '')


    # need to fix random play bug
    def set_current(self, word):

        nodeid = self.nodeid_from_text(word, self.node_data)
        if nodeid == None or len(self.graph[nodeid]) == 0:
            return False

        self.current = nodeid
        self.history.append(self.current)

        return True

    # jump to a given word, possibly in nav session
    # bug cleanup random true false returns
    def goto(self, word):

        next_node = self.nodeid_from_text(word, self.node_data)
        if next_node == None or len(self.graph[next_node]) == 0:
            return False

        display_adjacency_list(self.graph[next_node], self.node_data,
                               self.graph, self.zlevel)

        print('curr:\t', self.node_data[next_node].text)

        # if tracking to a target
        if self.target != None:
            if (self.current == self.target):
                return False

            # find min cost path from current node
            parent = dijkstra(self.graph, self.node_data, next_node, self.target)
            new_cost, jumps = get_cost_and_distance(parent, self.target, self.node_data)

            self.last_delta = new_cost - self.cost
            self.cost = new_cost

            print('goal:\t', self.node_data[self.target].text)

            color = green if (self.last_delta <= 0 or next_node == self.origin) else red
            print(f'cost:\t' + color + f'{self.cost:,}' + reset,  end = '')


        self.current = next_node
        self.history.append(self.current)
        self.travlog.add(self.current)


        return True

    def print_path(self):

        path = ''
        if len(self.history) == 0:
            self.history.append(self.current)
        for node in self.history[::-1]:
            path += self.node_data[node].text + ' '
        print(path)

    def print_scale(self):

        color_scale = ''

        # Get max cost in current view
        node_costs = {}
        adj_list = self.graph[self.current]
        for node in adj_list:
            if len(self.graph[node]) > 1:
                node_costs[node] = self.node_data[node].cost

        min_cost, max_cost = minmax(node_costs)

        for i in range(len(colors)):
            color = colors[i]
            flat_level = i * max_cost/len(colors)
            scaled_level = flat_level # scaled_level = math.floor(flat_level * sigmoid(flat_level, max_cost))
            level = format(scaled_level, '.0E')
            color_scale += color + level + ' '

        print(color_scale)
        print(reset)


    def clear(self):
        self.target = None
        self.cost = 0
        self.last_delta = 0
        self.history.clear()
        self.history.append(self.current)
        self.zlevel = DEFAULT_ZOOM


# Dotifies whitespace delimited phrases like
# 'out of it' -> out.of.it and then back again.
# This is a hack for using .split
def process_cmdline(cmdline, pre_or_post_flag):
    res = ''
    p = pre_or_post_flag
    q = False # q flips on begin/end a quoted piece of text
    for c in cmdline:
        q = not q if c == '\'' else q
        c = '.' if (c == ' ' and q and p) else ' ' if (c == '.' and q and not p) else c
        res += c
    return res

def gogogadget():
    """
    Main run loop / method dispatcher

    """
    global g_1, g_c2
    graph, node_data = load_moby_graph()

    # Start off by displaying a random nodes
    _curnode = find_random_node(1e7, node_data)
    nav = Nav(_curnode, graph, node_data)
    nav.list()


    # Enter main loop
    while(True):

        data = []
        line = input("\nmoby> ")
        line = process_cmdline(line, True)
        li = line.split(' ')
        for ele in li:
            data.append(process_cmdline(ele, False))

        if (data[0] == ''):
            continue

        elif data[0] == 'q':
            break

        # Navigation/informational

        elif data[0] == 'l': # list
            nav.list()

        elif data[0] == 'i': # zome in
            nav.zoom(True)

        elif data[0] == 'o': # zoom out
            nav.zoom(False)

        elif data[0] == 'r': # random node
            _curnode = find_random_node(1e7, node_data)
            nav.goto(node_data[_curnode].text)

        elif data[0] == 'p': # path back to start
            nav.print_path()

        elif data[0] =='-t' : # test
            nav.test();

        elif data[0] == '-i': # node & path information
            print_info(data, graph, node_data)

        elif data[0] == '-scale': # print color scale
            nav.print_scale()

    # game mode functions

        elif data[0] == '-g': # 'game mode' on
            if nav.set_target(data[1]) != True:
                print('no synonyms')
            #else:
            #    nav.list()

        elif data[0] == '-c': # 'game mode' off
            nav.clear()
            print('cleared')

        elif data[0] == 'n': # go to next towards dest.
            nav.next()

        elif data[0] == 'b': # go back
            nav.back()

        elif data[0] == '-h': # help
            print(__doc__)

        elif data[0] == '-a': # auto play loop

            nav.clear()
            for i in range(10):
                nav.zlevel = DEFAULT_ZOOM
                nodeid = find_random_node(1e7, node_data)
                word = node_data[nodeid].text
                nav.set_current(word)
                nav.list()
                time.sleep(2)

        elif len(data) == 1:  # navigate to word directly
            if nav.goto(data[0]) != True:
                print('no synonyms')

        elif len(data) == 2: # navigate between words
            if (nav.set_current(data[0]) != True) or (nav.set_target(data[1]) != True):
                print('no synonyms')

    # end while(True)


# uncomment to create nodes.json and graph.json
create_moby_graph()
#gogogadget()
