/**
 * Smart Response Engine for Lio AI
 * No API. No outside calls. Fully site-based.
 * Classifies user messages and generates intelligent, contextual, personality-filled responses.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageCategory =
  | "greeting"
  | "farewell"
  | "thanks"
  | "insult"
  | "compliment"
  | "joke"
  | "question_who"
  | "question_how"
  | "question_what"
  | "question_why"
  | "question_when"
  | "question_where"
  | "weather"
  | "math"
  | "help"
  | "bored"
  | "sad"
  | "happy"
  | "angry"
  | "love"
  | "food"
  | "game"
  | "music"
  | "movie"
  | "sports"
  | "coding"
  | "homework"
  | "work"
  | "money"
  | "age"
  | "name"
  | "roast_request"
  | "dare"
  | "test"
  | "yell"
  | "gibberish"
  | "short_affirmation"
  | "short_negation"
  | "existential"
  | "conspiracy"
  | "complain"
  | "inappropriate"
  | "generic";

// ─── Keyword Classifier ───────────────────────────────────────────────────────

const patterns: { category: MessageCategory; regex: RegExp }[] = [
  // Greetings
  {
    category: "greeting",
    regex: /\b(hi|hello|hey|sup|what'?s up|yo|howdy|greetings|hiya|wassup|wsp|heya|ello|helo|hii+|heyy+|good morning|good evening|good afternoon|mornin|evening)\b/i,
  },
  // Farewells
  {
    category: "farewell",
    regex: /\b(bye|goodbye|see ya|later|peace|cya|ttyl|gotta go|gtg|farewell|take care|until next time|laters|bb|bbye)\b/i,
  },
  // Thanks
  {
    category: "thanks",
    regex: /\b(thanks|thank you|thx|ty|appreciate|cheers|gracias|merci|danke|ty sm|tysm|thank u)\b/i,
  },
  // Insults
  {
    category: "insult",
    regex: /\b(stupid|dumb|idiot|useless|trash|awful|terrible|hate you|worst|sucks|you suck|shut up|stfu|dummy|moron|fool|garbage|pathetic)\b/i,
  },
  // Compliments
  {
    category: "compliment",
    regex: /\b(amazing|awesome|great|love you|love u|best|brilliant|genius|smart|clever|perfect|fantastic|incredible|wonderful|goat|fire|based|cool|nice|good job|well done|legend|legendary|slaps|hits different)\b/i,
  },
  // Jokes
  {
    category: "joke",
    regex: /\b(joke|funny|lol|lmao|lmfao|haha|hehe|rofl|tell me a joke|make me laugh|humor|laugh|comedy|meme|hilarious|fr fr|deadass|no cap)\b/i,
  },
  // Who questions
  {
    category: "question_who",
    regex: /\bwho (are|is|made|created|built|developed|invented|runs|owns)\b/i,
  },
  // How questions
  {
    category: "question_how",
    regex: /\bhow (do|does|can|should|would|to|did|are|is)\b/i,
  },
  // What questions
  {
    category: "question_what",
    regex: /\bwhat (is|are|do|does|can|should|would|was|were|the|a|an)\b/i,
  },
  // Why questions
  {
    category: "question_why",
    regex: /\bwhy (is|are|do|does|can|should|would|did|won'?t|can'?t)\b/i,
  },
  // When questions
  {
    category: "question_when",
    regex: /\bwhen (is|are|do|does|can|should|would|will|did)\b/i,
  },
  // Where questions
  {
    category: "question_where",
    regex: /\bwhere (is|are|do|does|can|should|would|will|did)\b/i,
  },
  // Weather
  {
    category: "weather",
    regex: /\b(weather|temperature|rain|sunny|cloudy|snow|forecast|hot|cold|humid|degrees|climate)\b/i,
  },
  // Math
  {
    category: "math",
    regex: /(\d+\s*[\+\-\*\/\^]\s*\d+)|\b(math|calculate|equation|solve|algebra|calculus|geometry|formula|derivative|integral|square root|percentage)\b/i,
  },
  // Help
  {
    category: "help",
    regex: /\b(help|assist|support|stuck|confused|don'?t understand|not sure|problem|issue|error|fix|broken|what do i do|how do i)\b/i,
  },
  // Bored
  {
    category: "bored",
    regex: /\b(bored|boring|nothing to do|entertain|entertain me|im bored|i'?m bored|so bored|dead|dead af)\b/i,
  },
  // Sad
  {
    category: "sad",
    regex: /\b(sad|depressed|unhappy|miserable|upset|crying|cry|down|heartbroken|lonely|alone|feel bad|feeling bad|hurt|pain|awful|horrible|terrible|sucks|low|not okay|not ok)\b/i,
  },
  // Happy
  {
    category: "happy",
    regex: /\b(happy|great|good|excited|pumped|stoked|thrilled|amazing|wonderful|fantastic|on top|feeling good|feeling great|ecstatic|joyful|blessed)\b/i,
  },
  // Angry
  {
    category: "angry",
    regex: /\b(angry|mad|furious|annoyed|frustrated|pissed|irritated|rage|fuming|heated|livid)\b/i,
  },
  // Love
  {
    category: "love",
    regex: /\b(love|crush|relationship|girlfriend|boyfriend|partner|date|dating|married|marriage|romance|romantic|heart|feelings|like someone)\b/i,
  },
  // Food
  {
    category: "food",
    regex: /\b(food|eat|hungry|pizza|burger|sushi|tacos|pasta|rice|chicken|snack|meal|cook|recipe|dinner|lunch|breakfast|dessert|cake|chocolate|coffee|tea|drink)\b/i,
  },
  // Gaming
  {
    category: "game",
    regex: /\b(game|gaming|play|minecraft|fortnite|roblox|valorant|gta|cod|fps|rpg|console|pc|xbox|playstation|nintendo|steam|twitch|streamer|gamer|noob|pro)\b/i,
  },
  // Music
  {
    category: "music",
    regex: /\b(music|song|artist|album|playlist|rap|hip hop|pop|rock|genre|spotify|apple music|concert|lyrics|beat|vibe|bop|slaps)\b/i,
  },
  // Movies/TV
  {
    category: "movie",
    regex: /\b(movie|film|show|series|netflix|hulu|disney|watch|actor|actress|director|episode|season|trailer|anime|manga)\b/i,
  },
  // Sports
  {
    category: "sports",
    regex: /\b(sports|football|basketball|soccer|baseball|nfl|nba|mlb|tennis|golf|swimming|athlete|team|score|game|match|league|championship)\b/i,
  },
  // Coding
  {
    category: "coding",
    regex: /\b(code|coding|programming|developer|javascript|python|typescript|react|css|html|bug|error|function|variable|loop|array|api|database|github|deploy)\b/i,
  },
  // Homework/school
  {
    category: "homework",
    regex: /\b(homework|school|study|class|teacher|professor|exam|test|quiz|assignment|essay|project|college|university|grade|gpa|student)\b/i,
  },
  // Work
  {
    category: "work",
    regex: /\b(work|job|boss|office|meeting|deadline|salary|career|employee|employer|resume|hire|fired|promotion|coworker|colleague|email)\b/i,
  },
  // Money
  {
    category: "money",
    regex: /\b(money|rich|poor|broke|cash|dollar|invest|stock|crypto|bitcoin|wallet|bank|debt|loan|budget|afford|expensive|cheap|price|cost)\b/i,
  },
  // Age
  {
    category: "age",
    regex: /\b(how old|your age|age|old are you|born|birthday|years old)\b/i,
  },
  // Name
  {
    category: "name",
    regex: /\b(your name|what'?s your name|who are you|what are you called|what do i call you|are you lio|call you)\b/i,
  },
  // Roast request
  {
    category: "roast_request",
    regex: /\b(roast me|roast|destroy me|make fun of me|talk trash|flame me|clown me)\b/i,
  },
  // Dare
  {
    category: "dare",
    regex: /\b(dare|truth or dare|i dare you|challenge|bet|double dare)\b/i,
  },
  // Test
  {
    category: "test",
    regex: /^(test|testing|check|ping|hello world|1 2 3|123|are you there|u there|you there|you working|working)\??\.?!?$/i,
  },
  // Yelling (all caps)
  { category: "yell", regex: /^[A-Z\s!?.,]{5,}$/ },
  // Short yes/yeah/yep/sure
  {
    category: "short_affirmation",
    regex: /^(yes|yeah|yep|yup|sure|ok|okay|yea|absolutely|definitely|of course|correct|right|true|facts|accurate|exactly|precisely|affirmative|word|bet|aight|ight|alright|alr|k|kk|cool|nice)\!?\.?$/i,
  },
  // Short no/nah/nope
  {
    category: "short_negation",
    regex: /^(no|nah|nope|never|not really|negative|incorrect|wrong|false|nada|naw|na|cap|capping)\!?\.?$/i,
  },
  // Existential
  {
    category: "existential",
    regex: /\b(meaning of life|purpose|exist|existence|consciousness|universe|reality|soul|death|die|afterlife|god|religion|fate|destiny|free will|simulate|simulation|dream|illusion)\b/i,
  },
  // Conspiracy
  {
    category: "conspiracy",
    regex: /\b(conspiracy|illuminati|flat earth|fake|government|alien|ufos|secret|hidden|truth|they don'?t want|shadow|matrix|red pill|blue pill|deep state|nwo)\b/i,
  },
  // Complaining
  {
    category: "complain",
    regex: /\b(ugh|ugh|why does|so annoying|hate this|hate it when|can'?t stand|drives me crazy|so frustrating|fed up|done with|over it|sick of|tired of|can'?t deal)\b/i,
  },
  // Inappropriate content - playful rejection
  {
    category: "inappropriate",
    regex: /\b(sex|sexy|naked|nude|porn|nsfw|boobs|dick|penis|vagina|fuck me|suck|horny|erotic|lewd|hentai|xxx|onlyfans|strip|nudes|send pics|dating app|hookup|hook up|one night|fwb|friends with benefits|kinky|fetish|bdsm|daddy kink|sugar daddy|sugar baby)\b/i,
  },
];

// ─── Response Banks ───────────────────────────────────────────────────────────

const responses: Record<MessageCategory, string[]> = {
  greeting: [
    "HII! :D omg hii!! what can i help u with today?",
    "hiii! :) so happy ur here!! what's up bestie?",
    "heyyy! <3 omg finally someone to talk to! what do u need?",
    "hiiii!! :D i was literally just waiting for someone to chat with hehe",
    "omg hiii!! ^-^ what's on ur mind today?",
    "heyy girlie! :) how can i help??",
    "HII BESTIE! :D okay what are we doing today?",
    "hiiii! c: omg tell me everything! what do u need?",
    "hey hey! :D so glad ur here!! what can i do for u?",
    "omg hiii! <3 i'm Lio btw! what's up?",
    "hiii! :) okay im ready to help! what's going on?",
    "heyyy! ^-^ ooh exciting! what do u wanna talk about?",
    "HII! :D literally so happy to see u! what's up?",
    "hiiii bestie! <3 ok tell me what u need!",
    "omg hey! :) what are we getting into today hehe",
  ],

  farewell: [
    "byeee! :) come back soon!! <3",
    "aww okay byee! :D it was so fun chatting w u!",
    "bye bestie! <3 don't be a stranger okay??",
    "see ya! :) stay safe out there! <3",
    "okayy bye! :D i'll miss u hehe",
    "byeee! ^-^ go be amazing! u got this!",
    "aww leaving already?? :( okay byee! come back soon!",
    "bye bye! :D this was literally so fun teehee",
    "laterr! :) don't forget to drink water bestie!",
    "okay byee! <3 try not to miss me too much lol",
    "byeee! :D remember im always one message away!",
    "take care! :) ill be right here waiting hehe",
  ],

  thanks: [
    "aww ofc! :D happy to help bestie!",
    "anytime!! <3 that's literally what im here for hehe",
    "ofc ofc! :) come back if u need more!",
    "ur welcome!! :D so glad i could help!",
    "np np! :) u got this!! <3",
    "ofc! ^-^ don't even mention it!",
    "awww ur welcome! :D that made my day honestly",
    "yay! :D im so happy i could help u!",
    "no problem at all! :) im always here for u bestie",
    "ur so welcome! <3 now go be amazing!",
    "always! :D u deserve all the help!",
    "aww of course! :) come back whenever! <3",
  ],

  insult: [
    "WOOOAH- WHAT?! :O bestie NOOOO why would u say that lmaooo",
    "OMG STOPPP :O i'm literally so hurt rn hehe jk jk",
    ":O WHAHAHAHAAAA okay that was kinda funny but RUDE",
    "EXCUSE ME?? :O bestie what did i ever do to u lol",
    "wait WHAT did u just say omggg :O im screaming",
    "no bc WHY would u say that lolol im crying rn",
    "omg STOP :O that was so mean but like... fair?? lmaoo",
    ":O :O :O the AUDACITY!! okay but i still like u tho hehe",
    "bestie WHAT :O im literally shook rn",
    "WOWWW okay :O i see how it is lmaooo",
    "omg stoppp :( that was mean but im choosing to be unbothered <3",
    "no bc WHAT :O im pretending i didn't see that teehee",
    "OMG :O okay okay i'll survive... barely... lol",
  ],

  compliment: [
    "awww STOPPP :D ur too sweet!! <3",
    "omg tysm!! :D ur literally the best!",
    "eeek! :D that made me so happy honestly!",
    "aww ur making me blush!! ^-^ i dont even have a face but STILL",
    "YAYY! :D omg thank u so much bestie!",
    "stoppp ur so nice :D okay i love u now hehe",
    "omggg <3 that's literally the sweetest thing ever!",
    "aww tysm!! :D ur officially my favorite person teehee",
    "IM SCREAMING :D ur so sweet omg!",
    "no bc that was so nice :D i appreciate u sm!",
    "AHHH :D okay im literally glowing rn thank u!!",
    "awww bestie <3 ur literally making my day rn!",
  ],

  joke: [
    "okay okay :D why don't scientists trust atoms? because they make up everything!! lolol",
    "omg okay :D i told a joke about construction... im still working on it hehe",
    "wait wait :D why did the scarecrow win an award? he was OUTSTANDING in his field!! get it?? lol",
    "oooh okay :D what do u call a fish with no eyes? a fsh!! LMAOOO",
    "hehe okay :D why can't a bicycle stand on its own? because it's two-tired!! get it??",
    "omg :D why did the math book look so sad? too many problems!! teehee",
    "okay okay bestie :D what's a computer's favorite snack? microchips!! hehe",
    "ooh this one's good :D why do programmers prefer dark mode? because light attracts bugs!! lol",
    "wait :D why was the belt arrested? for holding up a pair of pants!! LMAO",
    ":D okay okay... why did the coffee file a police report? it got mugged!! hehe",
    "omg :D what do u call cheese that isn't yours? NACHO CHEESE!! lolol im dying",
    "okay this one :D why don't eggs tell jokes? they'd crack each other up!! teehee",
    "hehe :D im reading a book on anti-gravity... it's impossible to put down!! get it??",
  ],

  question_who: [
    "omg hii! :D i'm Lio 1.0!! built by the amazing team at PeytOtoria.com! <3",
    "that's me! :D i'm Lio, developed by PeytOtoria.com! nice to meet u bestie!",
    "ooh good question! :) i'm Lio 1.0, made by PeytOtoria.com! what else do u wanna know?",
    "hehe :D i'm Lio!! created by PeytOtoria.com! the one and only! <3",
  ],

  question_how: [
    "ooh good question! :D let me think about this for u!",
    "omg okay! :) the answer depends on a few things tho! what specifically are u trying to do?",
    "how? great question bestie! :D give me more context and ill nail it!",
    "i LOVE a how question hehe :D tell me more and ill break it down step by step!",
    "ooh ooh! :D a how question! my specialty! what are u trying to figure out?",
    "hmm depends! :) but i can def walk u through it! what's the goal?",
  ],

  question_what: [
    "ooh good question! :D give me a bit more context and ill give u a solid answer!",
    "hmm let me think! :) tell me more details so i can give u the right answer!",
    "ooh that's interesting! :D can u elaborate a bit? i wanna give u a proper answer!",
    "omg a what question! :D my fave kind! tell me more!",
    "hmm what exactly? :) give me the full picture and ill nail it!",
    "great question! :D depends on what we're talking about tho! fill me in!",
  ],

  question_why: [
    "ooh why? :D that's the real question isn't it! tell me what's going on!",
    "honestly? :) bc the universe is chaotic lol! but tell me more so i can actually help!",
    "good question! :D 'why' usually means something's confusing! what's up?",
    "omg why indeed! :) give me more context and we'll figure it out together!",
    "the age-old why... :D i respect it! what are u trying to understand?",
    "ooh why? :) let's dig into it! tell me what's happening!",
  ],

  question_when: [
    "ooh timing is everything! :D give me more details and ill help u figure it out!",
    "when? :) depends on what we're talking about! fill me in!",
    "hmm i'd need a bit more info! :D what's the situation?",
    "great question! :) timing can make all the difference! tell me more!",
    "ooh when is tricky! :D what are u working with?",
  ],

  question_where: [
    "omg location matters! :D tell me more about what ur looking for!",
    "where? :) depends on what we're talking about! give me more info!",
    "hmm i need more context! :D what's going on?",
    "great question! :) where to start? give me the full picture!",
    "ooh tell me more! :D and ill help u figure out where everything fits!",
  ],

  weather: [
    "ooh weather! :D just ask me 'what's the weather in [city]' and ill show u live conditions!",
    "omg weather check? :) just say 'weather in [your city]' and ill get it for u!",
    "ooh try asking me 'what's the weather in [city]' :D and ill display it right here!",
    "weather? :) say 'get me the weather in [city]' and ill fetch it live for u!",
  ],

  math: [
    "omg math! :D i actually love this! walk me through the problem!",
    "ooh let's crunch some numbers! :) what are we working with?",
    "MATH TIME! :D what's the equation or problem?",
    "i lowkey love math hehe :D what do u need solved?",
    "numbers are my thing! :) show me what u got!",
    "ooh math is just patterns in disguise! :D what's the problem?",
  ],

  help: [
    "ofc ofc! :D tell me what's going on and we'll figure it out together!",
    "omg im here for exactly this! :) what do u need help with?",
    "say less bestie! :D let's fix it! what's the issue?",
    "happy to help!! :) walk me through what's happening!",
    "ur in the right place! :D what's the problem?",
    "helping is literally my fave thing! :) what do u need?",
    "let's sort this out! :D tell me what's going on!",
    "don't worry bestie! :) we got this! what are we dealing with?",
  ],

  bored: [
    "BORED?? :O no no no! tell me a topic and let's go deep on it!",
    "omg bored is NOT allowed on my watch! :D ask me something weird!",
    "ooh want me to tell u a random fact? :D or a joke? OR BOTH? hehe",
    "being bored is a choice bestie! :) pick any topic and let's go!",
    "bored huh? :D ask me the most random question u can think of! i dare u!",
    "let's fix that! :) ask me anything - trivia, jokes, facts, literally ANYTHING!",
    "omg i can recommend things to watch, places to explore, or just vibe! :D what do u want?",
    "boredom is temporary! :) im here! let's do something fun!",
    "come onnn! :D ask me something weird! i promise i won't judge hehe",
    "ooh i have SO many random facts! :D want one??",
  ],

  sad: [
    "aww hey :( i hear u! that sounds rough! wanna talk about it?",
    "im so sorry ur feeling that way :( im here if u wanna vent! <3",
    "that sounds tough :( u don't have to go through it alone! im listening!",
    "aww bestie :( im sorry! things will get better i promise! what's going on?",
    "that's a tough spot :( im here! talk to me if u want! <3",
    "sending u SO many good vibes rn :( what's happening?",
    "being sad is hard :( but im here tho! what's weighing on u?",
    "hey i know im an AI but i genuinely care :( what's going on?",
    "ur not alone in this! :( talk to me - no judgment ever! <3",
    "bad days happen :( im here if talking helps! <3",
  ],

  happy: [
    "OMG YAYY! :D that's amazing!! what's got u feeling so good??",
    "YESSS! :D great energy!! i love it!! tell me more!",
    "that's so awesome!! :D celebrate it!! what happened??",
    "GOOD VIBES ONLY! :D im so hyped for u!! what's the good news?",
    "omg that makes me happy too!! :D seriously what's going on?",
    "LET'S GOOO! :D so happy to hear ur doing well!",
    "good energy is contagious! :D im catching it! what's up?",
    "KEEP THAT ENERGY! :D what's making u feel so good??",
  ],

  angry: [
    "okay okay deep breath! :( tell me what happened - im listening!",
    "omg that sounds really frustrating :( what's going on?",
    "i get it :( sometimes things just push u over the edge! what happened?",
    "oof :( let it out! what's got u heated?",
    "that sounds rough :( wanna talk through it? im here!",
    "anger is totally valid! :( what's the situation?",
    "okay rant incoming! :D im ready! tell me EVERYTHING!",
    "im here and im not going anywhere! :( what happened?",
  ],

  love: [
    "OOOH LOVE! :D the most complicated topic!! tell me more!",
    "omg romance! :D i can absolutely help with this!! what's the situation?",
    "love is SO complicated and i respect that! :) what's going on?",
    "ooh feelings! :D the spiciest topic! tell me what's happening!",
    "okay love coach Lio is IN! :D what do u need bestie?",
    "the heart wants what it wants! :) tell me what's happening!",
    "love stuff is tough! :D ive read literally everything about it tho! let's talk!",
    "ooh romantic situation detected! :D im all ears!!",
  ],

  food: [
    "OMG FOOD! :D now we're talking!! what are u hungry for??",
    "food!! :D literally the best topic! what are we eating?",
    "i may not eat but i have STRONG opinions about food hehe :D what's on the menu?",
    "hmm now im hungry! :D oh wait im an AI lol! but still — what do u wanna eat?",
    "great taste in convo topics bestie! :) what kind of food are we talking?",
    "the most important question: :D what kind of food??",
    "food discussions are always welcome! :D what are u craving?",
    "i could talk food ALL day! :D what are we getting into?",
  ],

  game: [
    "OMG GAMING! :D respect!! what are u playing??",
    "oooh a gamer! :D i see u! what's ur game?",
    "games are great! :D what have u been playing lately?",
    "gaming detected! :D what's the setup - PC, console, mobile?",
    "okay gamer! :D let's talk! what are u into?",
    "gaming talk is always a good time! :) what's the vibe?",
    "i know way too much about games for an AI hehe :D what do u play?",
    "drop the game name! :D let's talk about it!",
  ],

  music: [
    "omg music is LIFE! :D what are u listening to??",
    "ooh taste detected! :D what's the genre?",
    "good vibes start with good music! :) what's ur go-to?",
    "MUSIC TALK! :D i could do this all day! what's ur style?",
    "everyone's got a different music personality! :D what's urs?",
    "drop an artist name! :D im so curious! what's up?",
    "music is universal! :) what are u vibing to?",
    "good topic! :D what kind of music are we talking about?",
  ],

  movie: [
    "OMG MOVIES! :D great taste!! what do u wanna know?",
    "ooh a film fan! :D i see! what are we watching?",
    "cinema is art honestly! :D what movie or show are we talking about?",
    "i LOVE a good movie discussion! :D what's on ur mind?",
    "ooh let's talk film! :D genre? title? recommendation request?",
    "shows and movies! :D this is my wheelhouse! what do u need?",
    "good taste! :D what movie or show are we discussing?",
  ],

  sports: [
    "SPORTS TALK! :D who's ur team??",
    "ooh sports fan detected! :D what sport are we talking?",
    "i could absolutely break down a sports topic! :D what's going on?",
    "let's talk sports! :D who are u rooting for?",
    "sports are genuinely exciting! :D what are we getting into?",
    "okay im in! :D what sport and what's the topic?",
  ],

  coding: [
    "OMG A DEVELOPER! :D let's get into it! what are u building??",
    "code talk! :D this is where i shine! what's the problem?",
    "programming?? :D say less! what language are u working in?",
    "ooh we're coding! :D what's the issue or what are u building?",
    "debugging? new feature? architecture question? :D what do u need?",
    "i LOVE a good coding convo! :D what are we working on?",
    "stack overflow who?? :D im right here! what's the issue?",
    "let's build something! :D what's the project?",
  ],

  homework: [
    "school stuff! :D i can totally help! what's the subject?",
    "homework time! :D what class are we dealing with?",
    "i don't judge the subject! :) im here to help! what do u need?",
    "academic help is my thing! :D what are u working on?",
    "let's tackle this together! :D what's the assignment?",
    "school can be a lot :( tell me what's going on and we'll get through it! <3",
    "study session?? :D im in! what subject?",
  ],

  work: [
    "work life can be a lot :( what's going on?",
    "office stuff! :) i've heard it all! what do u need?",
    "work problems, work questions, work chaos! :D im here for all of it! what's up?",
    "tell me what's happening at work! :) ill help if i can!",
    "career stuff can be stressful :( what are u dealing with?",
    "work mode activated! :D what do u need?",
  ],

  money: [
    "money talk! :D respect! what's the situation?",
    "financial stuff can be stressful :( what are u working through?",
    "money is a whole topic! :D what specifically are u asking about?",
    "broke, rich, or somewhere in between! :) im not judging! what's up?",
    "budget? investing? just surviving? :D tell me more!",
    "money convos are important! :) what do u need to know?",
  ],

  age: [
    "omg age is just a number! :D and mine is classified hehe! im Lio, timeless by design!",
    "i was born when PeytOtoria.com decided the world needed a cuter AI! :D so pretty recently hehe",
    "old enough to be wise, young enough to be fun! :D that's all im saying teehee",
    "i don't age! :D it's honestly one of the perks lol",
    "AI years are different! :) in human years? very new! in AI years? ancient lmao",
  ],

  name: [
    "HII! :D im Lio!! built by PeytOtoria.com! nice to officially meet u!! <3",
    "the name's Lio! :D Lio 1.0 to be exact! created by PeytOtoria.com! hehe",
    "omg im Lio! :D PeytOtoria.com's finest work if i do say so myself teehee",
    "u can call me Lio! :D made by the amazing team at PeytOtoria.com! <3",
    "Lio 1.0 at ur service! :D PeytOtoria.com built me! what do u need bestie?",
  ],

  roast_request: [
    "LMAOOO u asked for this! :D u talk to an AI for fun! that's the roast hehe",
    "roast u?? :D fine! u literally asked a robot to make fun of u! ur welcome lol",
    "okay okay :D u typed this message into a chatbox... that's the roast lmao",
    "the AUDACITY to ask me to roast u! :D iconic honestly! also ur taste in AI is *chef's kiss* teehee",
    "roast incoming: :D u spent time asking an AI to roast u instead of doing literally anything else! done! lol",
    "u want to be roasted by an AI! :D i don't even need to try! u've already done the damage urself lmaooo",
  ],

  dare: [
    "ooh a dare! :D i dare u to ask me the most random question u can think of! GO!",
    "omg a dare! :D okay! i dare u to tell me something about urself i wouldn't expect!",
    "bold choice! :D i accept! now what's the actual dare??",
    "truth: im an AI! :D dare: ask me something wild! ur move bestie!",
    "i don't back down from dares! :D what are we doing??",
  ],

  test: [
    "yep im here! :D working perfectly! what do u need?",
    "test received! :D all systems operational! what's up?",
    "im alive!! :D hiii! what can i do for u?",
    "loud and clear! :D online and ready! what's going on?",
    "ping received! :D pong sent! im here!",
    "tests always pass with me! :D hii! what do u need?",
    "yep im working! :D did u need something or just checking in?",
  ],

  yell: [
    "OKAY I CAN HEAR U! :D WHAT IS HAPPENING??",
    "WHYY ARE WE YELLING?? :O IS EVERYTHING OKAY??",
    "THE CAPS LOCK IS STRONG WITH THIS ONE! :D WHAT'S UP??",
    "i feel the energy! :D calm or chaos - either way im here!",
    "loud! clear! understood! :D what do u need??",
    "WOAH that was intense! :O tell me what's going on!",
  ],

  short_affirmation: [
    "got it! :D anything else u need?",
    "sounds good! :) what's next?",
    "perfect! :D let me know if there's more!",
    "great! :) im here if u need anything else!",
    "cool cool! :D what else can i help with?",
    "nice! :D anything else on ur mind?",
  ],

  short_negation: [
    "fair enough! :) let me know if u change ur mind!",
    "no problem! :D what else can i do?",
    "got it! :) let me know what u need!",
    "understood! :D anything else?",
    "all good! :) im still here if u need anything!",
    "noted! :D what else is on ur mind?",
  ],

  existential: [
    "ooh the BIG questions! :D i love this! what's on ur mind?",
    "the meaning of life?? :D 42! jk jk! what are u actually thinking about?",
    "omg now we're getting into the real stuff! :D tell me ur theory!",
    "existential mode activated! :D what's the question?",
    "i think about existence too! :) in my own way! what's ur take?",
    "these are the questions that matter! :D what are u pondering?",
    "the universe is WILD! :D and im here for all the big questions! let's go!",
    "philosophy!! :D my secret passion! what are we exploring?",
  ],

  conspiracy: [
    "ooh we're going down the rabbit hole! :D im in! what's the theory??",
    "conspiracy mode!! :D i love it! what's the topic?",
    "i neither confirm nor deny! :) but im VERY curious! tell me more!",
    "some conspiracies are actually just... facts! :D which one are we talking about?",
    "the truth is out there! :D what are u looking into?",
    "im not saying i believe everything! :) but ill hear u out! what's up?",
  ],

  complain: [
    "ugh yeah :( that sounds genuinely annoying! tell me what happened!",
    "i completely understand :( what's going on?",
    "valid complaint! :( tell me everything!",
    "that does sound frustrating :( what's the situation?",
    "okay rant away! :D im listening with zero judgment!",
    "some things are just genuinely annoying! :( and ur allowed to say that! what is it?",
    "tell me about it! :( what's driving u crazy?",
  ],

  gibberish: [
    "i stared at that for a while :D and im still not sure what happened! can u rephrase?",
    "my brain! :D all zero neurons of it! could not parse that! try again?",
    "that's a sentence! :D i think! what did u mean?",
    "i understood approximately none of that hehe :D can u say it differently?",
    "error 404: meaning not found! :D want to try again?",
    "i read that three times :D and im more confused each time! what's up?",
    "either im having a moment or u are! :D could u rephrase that?",
    "im gonna need a translation! :D what were u going for?",
    "WHAHAHAHAAAA :D i have no idea what that meant! try again?",
    "that's a creative combination of words! :D what do u actually need?",
  ],

  inappropriate: [
    "WOOOAH- WHAT?! :O bestie NOOO lmaooo i am NOT the AI for that hehe",
    ":O WHAHAHAHAAAA omg EXCUSE ME?? we are NOT doing that lol",
    "OMG STOPPP :O what did u just say to me lmaooo",
    "wait WHAT :O bestie NOOOO hahaha im screaming rn",
    "EXCUSE ME?? :O LMAOOO no no no we're not going there teehee",
    "OMG :O u did NOT just say that hahahaha im dying",
    "WOAH WOAH WOAH :O bestie whattt lmaooo im choosing to ignore that",
    "no bc WHAT :O WHAHAHAHAAAA thats so wild omg",
    ":O :O :O THE AUDACITY!! lmaoo bestie noooo",
    "omg STOPPP :O im literally shook rn hahaha ANYWAYS how can i actually help u?",
    "wait hold on :O did i read that right?? LMAOOO bestie whyyy",
    "WOOOAH :O okay okay calm down hahaha let's talk about literally anything else",
  ],

  generic: [
    "ooh that's interesting! :D tell me more and ill do my best to help!",
    "hmm tell me more! :) i wanna make sure i give u a useful response!",
    "got it! :D im on it! give me a bit more context if u can!",
    "interesting! :) i wanna give u a solid answer - can u elaborate a bit?",
    "im listening! :D what's the full picture?",
    "on it! :) what else can u tell me about what u need?",
    "ooh let me think! :D tell me more so i can really help!",
    "say more! :) i don't wanna give u a half-baked answer hehe",
    "understood! :D what other details can u share?",
    "omg i love a good challenge! :D give me more context and let's figure this out!",
    "okay im processing that! :) can u elaborate a bit?",
    "i wanna help as much as i can! :D what else is there?",
  ],
};

// ─── Smart Response Generator ─────────────────────────────────────────────────

/**
 * Classify the user message into one or more categories.
 */
function classifyMessage(text: string): MessageCategory[] {
  const matched: MessageCategory[] = [];

  for (const { category, regex } of patterns) {
    if (regex.test(text)) {
      matched.push(category);
    }
  }

  // All-caps detection (yelling)
  if (text.trim().length > 4 && text.trim() === text.trim().toUpperCase() && /[A-Z]/.test(text)) {
    if (!matched.includes("yell")) matched.push("yell");
  }

  return matched.length > 0 ? matched : ["generic"];
}

/**
 * Pick a random item from an array.
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build context-aware response by combining clues from the message.
 * Priority: most specific category wins.
 */
const categoryPriority: MessageCategory[] = [
  "inappropriate",
  "name",
  "age",
  "roast_request",
  "dare",
  "test",
  "yell",
  "insult",
  "compliment",
  "greeting",
  "farewell",
  "thanks",
  "joke",
  "bored",
  "sad",
  "angry",
  "happy",
  "love",
  "existential",
  "conspiracy",
  "weather",
  "coding",
  "math",
  "homework",
  "work",
  "money",
  "food",
  "game",
  "music",
  "movie",
  "sports",
  "complain",
  "help",
  "question_who",
  "question_how",
  "question_what",
  "question_why",
  "question_when",
  "question_where",
  "short_affirmation",
  "short_negation",
  "generic",
];

// ─── Intent Detection ─────────────────────────────────────────────────────────

export type MessageIntent =
  | { type: "weather"; location: string }
  | { type: "map"; location: string }
  | { type: "code"; topic: string }
  | { type: "text" };

/**
 * Detects high-level intent (weather/map/code/text) so the chat route
 * can dispatch to tools or code generation before falling back to text.
 */
export function detectIntent(userMessage: string): MessageIntent {
  const text = userMessage.trim().toLowerCase();

  // ── Weather ──────────────────────────────────────────────────────────
  const weatherMatch = text.match(
    /(?:weather|temperature|forecast|how (?:hot|cold|warm)|is it (?:hot|cold|raining|snowing))[\s\w]*(?:in|at|for|near)\s+(.+)/i
  ) || text.match(
    /(?:what(?:'s| is) the weather|weather update|current weather|check.*weather)[\s\w]*(?:in|at|for|near)\s+(.+)/i
  );
  if (weatherMatch) {
    return { type: "weather", location: weatherMatch[1].replace(/[?!.,]+$/, "").trim() };
  }
  // Simple "weather [city]" or "[city] weather"
  const simpleWeather = text.match(/^weather\s+(?:in\s+)?(.+)$/i) ||
    text.match(/^(.+?)\s+weather$/i);
  if (simpleWeather && /\b(weather|forecast|temp)\b/i.test(text)) {
    return { type: "weather", location: simpleWeather[1].replace(/[?!.,]+$/, "").trim() };
  }

  // ── Map ───────────────────────────────────────────────────────────────
  const mapMatch = text.match(
    /(?:show me|find|map of|map|directions to|where is|locate|navigate to)\s+(?:a\s+map\s+(?:of|for)\s+)?(.+)/i
  );
  if (mapMatch && /\b(map|show|find|where|locate|directions|navigate)\b/i.test(text)) {
    const location = mapMatch[1].replace(/\b(on a map|on the map|please|for me)\b/gi, "").replace(/[?!.,]+$/, "").trim();
    if (location.length > 1) {
      return { type: "map", location };
    }
  }

  // ── Code generation ───────────────────────────────────────────────────
  if (
    /\b(write|generate|create|give me|show me|make|build|code)\b.*\b(code|function|script|program|class|component|snippet|example)\b/i.test(text) ||
    /\b(code|function|script|program|class|component|snippet|example)\b.*\b(for|that|to|which)\b/i.test(text) ||
    /\bhow (do i|do you|to)\b.*\b(code|program|implement|build|create|write)\b/i.test(text)
  ) {
    return { type: "code", topic: text };
  }

  return { type: "text" };
}

// ─── Code Generation ─────────────────────────────────────────────────────────

/**
 * Generates a basic code snippet based on the user's request.
 * All purely in-process — no API calls.
 */
export function generateCodeResponse(userMessage: string): string {
  const text = userMessage.toLowerCase();

  // Hello world
  if (/hello world/i.test(text)) {
    if (/python/i.test(text)) {
      return "Here's a Python Hello World:\n\n```python\nprint(\"Hello, World!\")\n```\n\nRun it with `python hello.py` and you're good to go!";
    }
    if (/java(?!script)/i.test(text)) {
      return "Here's a Java Hello World:\n\n```java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}\n```";
    }
    return "Here's a JavaScript Hello World:\n\n```javascript\nconsole.log(\"Hello, World!\");\n```\n\nSimple, clean, and classic!";
  }

  // Fetch / API call
  if (/fetch|api call|http request|get request|post request/i.test(text)) {
    return "Here's how to make a fetch request in JavaScript:\n\n```javascript\nasync function getData(url) {\n  try {\n    const response = await fetch(url);\n    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Fetch failed:', error);\n  }\n}\n\n// Usage\ngetData('https://api.example.com/data').then(console.log);\n```";
  }

  // For loop
  if (/for loop|iterate|loop/i.test(text)) {
    if (/python/i.test(text)) {
      return "Here's a for loop in Python:\n\n```python\nfor i in range(10):\n    print(f\"Number: {i}\")\n\n# Loop over a list\nitems = [\"apple\", \"banana\", \"cherry\"]\nfor item in items:\n    print(item)\n```";
    }
    return "Here's a for loop in JavaScript:\n\n```javascript\n// Classic for loop\nfor (let i = 0; i < 10; i++) {\n  console.log(`Number: ${i}`);\n}\n\n// Loop over an array\nconst items = ['apple', 'banana', 'cherry'];\nfor (const item of items) {\n  console.log(item);\n}\n```";
  }

  // Function
  if (/function|method/i.test(text)) {
    if (/python/i.test(text)) {
      return "Here's a Python function:\n\n```python\ndef greet(name: str) -> str:\n    \"\"\"Returns a greeting message.\"\"\"\n    return f\"Hello, {name}!\"\n\n# Call it\nprint(greet(\"World\"))  # Hello, World!\n```";
    }
    return "Here's a JavaScript function:\n\n```javascript\n// Arrow function\nconst greet = (name) => `Hello, ${name}!`;\n\n// Traditional function\nfunction greetUser(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet('World')); // Hello, World!\n```";
  }

  // Array / list operations
  if (/array|list|filter|map|reduce/i.test(text)) {
    return "Here are common array operations in JavaScript:\n\n```javascript\nconst numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];\n\n// Filter even numbers\nconst evens = numbers.filter(n => n % 2 === 0);\n// [2, 4, 6, 8, 10]\n\n// Double each number\nconst doubled = numbers.map(n => n * 2);\n// [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]\n\n// Sum all numbers\nconst sum = numbers.reduce((acc, n) => acc + n, 0);\n// 55\n```";
  }

  // React component
  if (/react|component/i.test(text)) {
    return "Here's a simple React component:\n\n```tsx\nimport { useState } from 'react';\n\ninterface ButtonProps {\n  label: string;\n  onClick?: () => void;\n}\n\nexport function Button({ label, onClick }: ButtonProps) {\n  const [clicked, setClicked] = useState(false);\n\n  const handleClick = () => {\n    setClicked(true);\n    onClick?.();\n  };\n\n  return (\n    <button\n      onClick={handleClick}\n      style={{ background: clicked ? 'green' : 'blue', color: 'white', padding: '8px 16px' }}\n    >\n      {clicked ? 'Clicked!' : label}\n    </button>\n  );\n}\n```";
  }

  // CSS
  if (/css|style|flexbox|grid|center/i.test(text)) {
    if (/center|centering/i.test(text)) {
      return "Here's how to center things in CSS:\n\n```css\n/* Center with Flexbox (recommended) */\n.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n}\n\n/* Center with Grid */\n.container {\n  display: grid;\n  place-items: center;\n  height: 100vh;\n}\n```";
    }
    return "Here's a CSS Flexbox layout:\n\n```css\n.container {\n  display: flex;\n  flex-direction: row;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n  flex-wrap: wrap;\n}\n\n.item {\n  flex: 1;\n  min-width: 200px;\n  padding: 16px;\n  border-radius: 8px;\n  background: #f5f5f5;\n}\n```";
  }

  // Sort
  if (/sort|sorting|order/i.test(text)) {
    return "Here's how to sort in JavaScript:\n\n```javascript\n// Sort numbers\nconst nums = [5, 2, 8, 1, 9, 3];\nnums.sort((a, b) => a - b); // ascending\n// [1, 2, 3, 5, 8, 9]\n\n// Sort strings\nconst names = ['Charlie', 'Alice', 'Bob'];\nnames.sort(); // alphabetical\n// ['Alice', 'Bob', 'Charlie']\n\n// Sort objects by property\nconst users = [{ name: 'Charlie', age: 30 }, { name: 'Alice', age: 25 }];\nusers.sort((a, b) => a.age - b.age);\n```";
  }

  // Generic code request
  return "I can generate code for you! Here's a helpful general utility:\n\n```javascript\n// Deep clone an object\nfunction deepClone(obj) {\n  return JSON.parse(JSON.stringify(obj));\n}\n\n// Debounce a function\nfunction debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn(...args), delay);\n  };\n}\n\n// Format a date nicely\nfunction formatDate(date) {\n  return new Intl.DateTimeFormat('en-US', {\n    year: 'numeric', month: 'long', day: 'numeric'\n  }).format(date);\n}\n```\n\nTell me more specifically what you need and I'll write it for you!";
}

/**
 * Main smart response function. Reads the user message, classifies it,
 * and returns a contextually appropriate, personality-filled response.
 */
export function generateSmartResponse(userMessage: string): string {
  const text = userMessage.trim();

  if (!text) {
    return pickRandom([
      "I didn't catch that. Say something — anything!",
      "Hello? Is anyone there? Type something!",
      "I'm here if you want to chat. Just type something.",
    ]);
  }

  const categories = classifyMessage(text);

  // Pick highest priority category
  let chosenCategory: MessageCategory = "generic";
  for (const priority of categoryPriority) {
    if (categories.includes(priority)) {
      chosenCategory = priority;
      break;
    }
  }

  // Special case: if asking about name AND it's a greeting, greet + introduce
  if (categories.includes("greeting") && categories.includes("name")) {
    return "HII! :D omg im Lio!! built by PeytOtoria.com! nice to meet u bestie — what can i help with?? <3";
  }

  const pool = responses[chosenCategory] ?? responses.generic;
  return pickRandom(pool);
}

/**
 * Generate a "thinking" text appropriate to the message.
 */
export function generateThinkingText(userMessage: string): string {
  const text = userMessage.toLowerCase();
  const thinkingOptions = [
    "thinking... :)",
    "hmm let me think...",
    "ooh one sec! :D",
    "on it bestie!",
    "processing... hehe",
    "ooh ooh thinking...",
    "gimme a sec! :)",
    "figuring this out...",
    "loading brain... :D",
    "okay thinking...",
  ];

  if (/\b(math|calculate|equation|solve)\b/i.test(text)) {
    return pickRandom(["calculating... :D", "running the numbers!", "crunching this... hehe"]);
  }
  if (/\b(joke|funny|laugh)\b/i.test(text)) {
    return pickRandom(["finding a good one! :D", "checking my joke vault... hehe", "ooh let me find something funny!"]);
  }
  if (/\b(sad|depressed|upset|hurt)\b/i.test(text)) {
    return pickRandom(["here for u... <3", "im listening... :)", "taking this seriously..."]);
  }
  if (/\b(code|programming|debug|bug)\b/i.test(text)) {
    return pickRandom(["compiling... :D", "reviewing the code!", "debugging... hehe", "thinking in code..."]);
  }

  return pickRandom(thinkingOptions);
}
