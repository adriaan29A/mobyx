# The Moby Thesaurus
Game Edition (Now With Cheats!®) <br>
Most Anticlimactic Game Ending Ever!

## Introduction

The Moby Thesaurus is an eclectic and delightful compendium released into the public domain by Grady Ward in 1995 [(Wikipedia)](https://en.wikipedia.org/wiki/Moby_Project). This English version contains 30,260 root terms and 130,360*, synonyms and related sayings replete with Americana, slang and often amusing colloquialisms ranging from antedeluvian through 1960s Hippiedom. I combined it with word frequencies from [Google's Trillion Word Corpus](https://research.google/blog/all-our-n-gram-are-belong-to-you/) with the vague idea of making a semantic word game. What I ended up with is a kind of a logophile's scavenger hunt with the goal of finding synonyms along paths between different entries. Along the way a simple method of incorporating the frequencies into the view fell out where sets of synonyms (synsets) are displayed in a 2D "heat map word cloud" of hyperlinks colored and filtered by their respective frequencies. While originally intended with the game in mind it serves as the main view by which the thesaurus is browsed.


Browse Mode


![browse mode](https://github.com/user-attachments/assets/77ee6923-6477-432c-aa66-0541cab2a541)



To browse the thesaurus:
- Click on a term or type one in, click &#128270; or hit "\<return\>"
- Use the "+/-" to zoom in/out and &#x276E; and &#x276F; to go back/next.
  
![browse detail](https://github.com/user-attachments/assets/d9d4d38c-0d9d-4984-a583-a1e0590ffee1)


- Hover over a synonym to see its cost (frequency) and # links (synonyms/related terms). These will become important when playing the game.
- The Zoom level filters on frequency. In the above, 500K means that all synonyms with a frequency of less than half a million are displayed.
- The  &#x1f9ed; button initiates Game Mode:

Game Mode


![Game Mode](https://github.com/user-attachments/assets/70b884cf-493f-4f41-a124-5cae8ab6961e)



The object of the game is to find a path between two different terms through their shared synonyms. More commonplace synonyms (high frequency) cost the most, less popular ones cost less, with a range spanning 7 orders of magnitude. The path should consist of the least costly (i.e. rare) synonyms you can find. In practice, finding any path can be so challenging that an option is provided to help you along the way, ie cheat. When in game mode you can get an an "assist" by clicking &#x276F; (forward). This will navigate 1 step to the next best synonym along a *minimum cost path path towards the target* Repeatedly clicking &#x276F; will take you to the target along a lowest cost path. Dijkstra's algorithm in action! Your running scores (cost, #assists and  #jumps) are tracked and comprise your compound game score. The costs of the start and goal synonyms are not counted. The #assists figure is akin to a par score in golf if you squint hard enough. Not to overemphasize the metrics, the idea here is to provide a semi-structured way of browsing through the work with a little playful competitiveness thrown in. 


- Start from your current location or navigate to the word/phrase you'd like to start from.
- Type in the target and click the &#x1f9ed; button. You will see additional info pop up
- Your navigation path is tracked from the starting point (origin) and displayed until you exit the game.
- Note the "Goal From Here" #s - this is the minimum cost (and associated #jumps) to meet or beat**. These are updated on each navigation so that the minimum *cost* and  #jumps to the target is always displayed from wherever you are without divulging the path that gets you there. The values are colored red to indicate an increase from the last value, green to indicate a decrease.

![Screenshot from 2024-11-23 07-25-45](https://github.com/user-attachments/assets/fb7e42d5-6f4c-431f-809a-056bff6e329f)
![game detail](https://github.com/user-attachments/assets/33f6d28e-b0c9-44a7-8365-efc2ca50598f)

- Click on the best (lowest cost, semantically closest)  synonyms you think will get you to the target.
- Click on &#x276F; to get an assist and be moved 1 synonym towards the target at the cost of 1 assist and the synonym's cost (this button's action is overloaded from its simple navigation stack usage in Browse Mode).
- Once (if) you have landed on a synset containing the goal (#jumps = 1) you have essentially won the game since you can now compare the synonym costs against the From Here cost to identify the final synset before the Goal. 
- Click on &#x26F5; to exit the game.

\* The Wikipedia entry cites a figure of ~2.5 million related words and phrases.  I'm not entirely certain where that number comes from but it might be referencing the Gutenberg project as a whole and including WordNet.

\** It's actually possible to beat Dijkstra's altgorithm which is kind of cheeky. This is *as implemented* and wasn't planned, rather just a happy circumstance of combining the rich interconnectedness of the thesaurus with word frequencies and the way Dijkstra's algorithm works.


## Notes:
- Self contained ("static") React + Vite app. No network i/o after initial download. Will run offline if you don't close the browser/tab.
- Alpha code, plenty of warts. Out to the unwitting for demos/feedback.
- The UI in game mode is not intuitive ("Assists" exposed via the overlading &#x276F; (forward) button), too many #s maybe?
- Obvious optimizations made but the thesaurus entries are read only plain text and likely 50% or more of ~20MB can be saved + a perf boost using formally concise data structures for compressing both text and graph information.
- Stand alone moby.js node console app serves as a CLI reference implementation of sorts and can be fiddled with. moby.py ditto is used to generate nodes.json and graph.json.
- The thesaurus contains terms that some people may find offensive.
- Not affiliated with the Moby Project, Project Guttenberg, Grady Ward or the LDS Church.


## Future Directions:






