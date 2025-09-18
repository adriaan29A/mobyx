export var  HelpText = " \
\
\n\
Navigate the Moby thesaurus \n\
\n\
1) Type in a single term (a word or phrase) to see a list of its synonyms\n\
   colored and filtered by word frequency\n\
\n\
moby> splendiferous\n\
moby> 'transcendental meditation'\n\
\n\
2) Type in two terms to navigate between the two:\n\
\n\
moby> luxury poverty\n\
moby> dregs 'upper crust'\n\
\n\
This will set up a navigation session between the two: The first term is set to current\n\
and the second is made the target. The object is to walk your way to the target: You can do\n\
this by guessing the next best synonym from the list (hard) or just enter 'n' (next) to let\n\
Moby compute it, and follow along or guess at each turn.\n\
\n\
3) Commands:\n\
\n\
Zoom in and out on a set of synonyms, view/clear history, etc.\n\
\n\
'l' - lists the current word/phrase and its synonyms\n\
'i' - zoom in  (filter out higher frequency terms)\n\
'o' - zoom out (filter in higher frequency terms)\n\
'n' - jumps to the next best* term in a navigation session\n\
'b' - jump back to the previous term in the history\n\
'r' - navigate to a random term and list its synonyms\n\
'q' - quit\n\
\n\
'-g' <target> - starts a navigation session to the target term\n\
'-p' - print history\n\
'-c' - clear history and ends the current navigation session if one exists\n\
'-a' - play loop 10 random terms.\n\
'-s' - prints word frequency color scale\n\
'-h' - prints this help\n\
\n\
*best - the next best word/phrase from the current to the target is\n\
computed via minimum cost (frequency) path using Dijkstra's algorithm";
