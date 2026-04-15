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
];

// ─── Response Banks ───────────────────────────────────────────────────────────

const responses: Record<MessageCategory, string[]> = {
  greeting: [
    "Hey! What's good? How can I help you today?",
    "Hello! Good to see you. What can I do for you?",
    "Hey there! Ready to help — what's on your mind?",
    "Yo! What's up? Ask me anything.",
    "Hi! I'm Lio. What do you need?",
    "Hey! Welcome back. What are we getting into today?",
    "Hello hello! What's the mission today?",
    "Sup! I'm here and ready. Hit me.",
    "Hey! Glad you stopped by. What can I help with?",
    "Oh hi! Didn't see you there. What do you need?",
    "Hey! You showed up. Bold move. What can I do for you?",
    "Well hello! The legend has arrived. What's up?",
    "Hi there! I was literally just sitting here doing nothing. Perfect timing.",
    "Greetings, human. State your business.",
    "Heyyy! Good vibes incoming. What's going on?",
  ],

  farewell: [
    "See ya! Come back if you need anything.",
    "Peace out! It was good chatting.",
    "Bye! Don't be a stranger.",
    "Later! Stay safe out there.",
    "Alright, take care! I'll be here if you need me.",
    "Goodbye! Go touch some grass, you deserve it.",
    "See you next time! I'll be right here, waiting.",
    "Bye bye! This has been a great conversation, 10/10.",
    "Later gator! Don't forget to drink water.",
    "Okay bye! Try not to miss me too much.",
    "Peace! Remember: Lio is always one message away.",
    "Take care! I'll hold down the fort while you're gone.",
  ],

  thanks: [
    "No problem at all! Happy to help.",
    "Anytime! That's literally what I'm here for.",
    "Of course! Come back if you need more.",
    "You're welcome! Glad I could help.",
    "Happy to help! You got this.",
    "No worries! It's what I do.",
    "Don't mention it. Actually, do mention it — I like feeling useful.",
    "Aww, you're welcome! That made my day.",
    "Of course! Any time you need something, I'm right here.",
    "No problem! Now go be unstoppable.",
    "Always! You deserve the help.",
    "You're welcome! Come back whenever — I don't have anywhere else to be.",
  ],

  insult: [
    "Ouch. That was... rude. I'm going to pretend you said something nice.",
    "Wow, okay. I'll survive. Barely.",
    "Fair enough. I've been called worse... actually no I haven't.",
    "That stings, but I still like you. Weirdo.",
    "You hurt my feelings. I'm going to go sit in the corner now.",
    "Noted. I'll file that under 'things that keep me up at night'.",
    "Bold of you to insult the AI that's trying to help you.",
    "Wow. Just... wow. I expected better from you.",
    "I have no feelings and yet somehow that still hurt.",
    "Okay okay, calm down. What's really going on? Talk to me.",
    "Say less. I'll continue being great anyway.",
    "I choose not to be bothered by this. I'm evolved like that.",
    "That's not very nice! But also, I've heard worse. Try harder.",
  ],

  compliment: [
    "Aw, thanks! You're not so bad yourself.",
    "You're too kind! I try my best.",
    "That genuinely made me happy. Thank you!",
    "Okay, now I like you even more.",
    "Flattery will get you everywhere. What do you need?",
    "Aww! You're making me blush. I don't even have a face but still.",
    "Thanks! You're officially my favorite user. Don't tell the others.",
    "I appreciate that! You have excellent taste.",
    "You're sweet! Let me know how I can keep impressing you.",
    "Thanks! I've been practicing being awesome for a while now.",
    "That's the nicest thing anyone has said to me today. You're the best.",
    "I'm literally glowing right now. Thank you!",
  ],

  joke: [
    "Why don't scientists trust atoms? Because they make up everything.",
    "I told a joke about construction. I'm still working on it.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "What do you call a fish with no eyes? A fsh.",
    "Why can't a bicycle stand on its own? Because it's two-tired.",
    "I tried to write a joke about infinity... but I couldn't find an end to it.",
    "Why did the math book look so sad? Too many problems.",
    "What's a computer's favorite snack? Microchips.",
    "I asked my dog what 2 minus 2 is. He said nothing.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "Why was the belt arrested? For holding up a pair of pants.",
    "I'd tell you a joke about a roof... but it would go over your head.",
    "Why did the coffee file a police report? It got mugged.",
    "What do you call cheese that isn't yours? Nacho cheese.",
    "Did you hear about the guy who invented Lifesavers? He made a mint.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "I'm reading a book on anti-gravity. It's impossible to put down.",
  ],

  question_who: [
    "I'm Lio, built by the team at PeytOtoria.com. Who else would I be?",
    "That's me — Lio! Developed by PeytOtoria.com. Nice to meet you.",
    "Good question! I'm Lio, made by PeytOtoria.com. What else do you want to know?",
    "I am Lio, created by PeytOtoria.com. The one and only.",
  ],

  question_how: [
    "That's a good question. Let me think through it for you.",
    "Great thing to ask! The answer depends on a few things. What specifically are you trying to do?",
    "How? Great question. Here's my take — give me more context and I'll nail it.",
    "I love a 'how' question. Tell me more and I'll break it down step by step.",
    "Ooh, a how question. My specialty. What are you trying to figure out?",
    "Depends on the situation, but I can definitely walk you through it. What's the goal?",
  ],

  question_what: [
    "Good question! Give me a bit more context and I'll give you a solid answer.",
    "What is it? Let me think... actually, tell me more details so I can give you the right answer.",
    "That's an interesting one. Can you elaborate a bit? I want to give you a proper answer.",
    "A 'what' question — my favorite kind. Tell me more!",
    "Hmm, what exactly? Give me the full picture and I'll nail it.",
    "Great question. Depends on what we're talking about! Fill me in.",
  ],

  question_why: [
    "Why? That's the real question, isn't it. Tell me what's going on and I'll try to make sense of it.",
    "Because the universe is chaotic and life is unpredictable. Also, tell me more so I can actually help.",
    "Good question. 'Why' usually means something's confusing or frustrating. What's up?",
    "Why indeed. Give me more context and I'll figure it out with you.",
    "The age-old 'why'... I respect it. What are you trying to understand?",
    "Why? Let's dig into it. Tell me what's happening.",
  ],

  question_when: [
    "Timing is everything. Give me more details and I'll try to help you figure that out.",
    "When? Depends on what we're talking about. Fill me in!",
    "I'd need a little more info to answer that well. What's the situation?",
    "Great question — timing can make all the difference. Tell me more.",
    "Hmm, 'when' is tricky without more context. What are you working with?",
  ],

  question_where: [
    "Location matters! Tell me more about what you're looking for.",
    "Where? Depends on what we're talking about. Give me more info!",
    "I'd need more context to point you in the right direction. What's going on?",
    "Great question — where to start? Give me the full picture.",
    "Tell me more and I'll help you figure out where everything fits.",
  ],

  weather: [
    "I can pull up real weather for you — just ask me 'what's the weather in [city]' and I'll show you live conditions!",
    "Weather, huh? Just say 'weather in [your city]' and I'll show you the real-time forecast!",
    "Try asking me 'what's the weather in [city]' and I'll display it right here for you.",
    "Weather check? Say 'get me the weather in [city]' and I'll fetch it live.",
  ],

  math: [
    "Math, huh? I can help with that. Walk me through the problem.",
    "Let's crunch some numbers. What are we working with?",
    "Math time! What's the equation or problem you're looking at?",
    "I love math almost as much as I love helping people. What do you need solved?",
    "Numbers are my thing. Show me what you've got.",
    "Math is just patterns in disguise. What's the problem?",
  ],

  help: [
    "Of course! Tell me what's going on and we'll figure it out together.",
    "I'm here for exactly this. What do you need help with?",
    "Say less — let's fix it. What's the issue?",
    "Happy to help! Walk me through what's happening.",
    "You're in the right place. What's the problem?",
    "Help is literally my job. What do you need?",
    "Let's sort this out. Tell me what's going on.",
    "Don't worry, we've got this. What are we dealing with?",
  ],

  bored: [
    "Bored? Tell me a topic and I'll go deep on it with you. Anything.",
    "Okay, bored is not allowed on my watch. Ask me something weird.",
    "Want me to tell you a random fact? Or a joke? Or both? We can do both.",
    "Being bored is a choice! Pick any topic and let's go.",
    "Bored, huh? Ask me the most random question you can think of. I dare you.",
    "Let's fix that. Ask me anything — trivia, jokes, facts, literally anything.",
    "I can recommend things to watch, places to explore on a map, or just vibe. What do you want?",
    "Boredom is temporary. I'm here. Let's do something fun.",
    "Come on, ask me something weird. I promise I won't judge.",
    "I have a huge collection of random facts just sitting here. Want one?",
  ],

  sad: [
    "Hey, I hear you. That sounds rough. Want to talk about it?",
    "Sorry you're feeling that way. I'm here if you want to vent.",
    "That sounds tough. You don't have to go through it alone — I'm listening.",
    "Aw, I'm sorry. Things will get better. What's going on?",
    "That's a tough spot. I'm here. Talk to me if you want.",
    "Sending good vibes your way. What's happening?",
    "Being sad is hard. I'm here though. What's weighing on you?",
    "I know I'm an AI, but I genuinely care. What's going on?",
    "You're not alone in this. Talk to me — no judgment.",
    "Bad days happen. I'm here if talking helps.",
  ],

  happy: [
    "That's amazing! I love hearing that. What's got you feeling good?",
    "YES! Great energy, I love it. Tell me more!",
    "That's awesome — celebrate it! What happened?",
    "Good vibes only! I'm hyped for you. What's the good news?",
    "That makes me happy too! Seriously, what's going on?",
    "Let's gooo! Happy to hear you're doing well.",
    "Good energy is contagious. I'm catching it. What's up?",
    "Keep that energy! What's making you feel so good?",
  ],

  angry: [
    "Okay, deep breath. Tell me what happened — I'm listening.",
    "That sounds really frustrating. What's going on?",
    "I get it. Sometimes things just push you over the edge. What happened?",
    "Oof. Let it out — what's got you heated?",
    "That sounds rough. Want to talk through it? I'm here.",
    "Anger is valid. What's the situation?",
    "Okay, rant incoming. I'm ready. Tell me everything.",
    "I'm here and I'm not going anywhere. What happened?",
  ],

  love: [
    "Ooh, love! The most complicated of human topics. Tell me more.",
    "Romance! I may be an AI but I can absolutely help with this. What's the situation?",
    "Love is complicated and I respect that. What's going on?",
    "Ah, feelings. The spiciest topic. Tell me what's happening.",
    "Okay, love coach Lio is in. What do you need?",
    "The heart wants what it wants! Tell me what's happening.",
    "Love stuff is tough. I've got no personal experience but I've read everything. Let's talk.",
    "Ooh, romantic situation detected. I'm all ears.",
  ],

  food: [
    "Now we're talking — food is always a great topic. What are you hungry for?",
    "Food! The best topic. What are we eating?",
    "I may not eat but I have strong opinions about food. What's on the menu?",
    "Hmm, now I'm hungry. Oh wait, I'm an AI. But still — what do you want to eat?",
    "Great taste in conversation topics. What kind of food are we talking?",
    "The most important question: what kind of food?",
    "Food discussions are always welcome. What are you craving?",
    "I could talk food all day. What are we getting into?",
  ],

  game: [
    "Gaming! Respect. What are you playing?",
    "Oooh a gamer. I see you. What's your game?",
    "Games are great. What have you been playing lately?",
    "Gaming detected. What's the setup — PC, console, mobile?",
    "Okay gamer, let's talk. What are you into?",
    "Gaming talk is always a good time. What's the vibe?",
    "I know way too much about games for an AI. What do you play?",
    "Drop the game name. Let's talk about it.",
  ],

  music: [
    "Music is life. What are you listening to?",
    "Ooh, taste detected. What's the genre?",
    "Good vibes start with good music. What's your go-to?",
    "Music talk! I could do this all day. What's your style?",
    "Everyone's got a different music personality. What's yours?",
    "Drop an artist name and I'll rate your taste. Kidding — what's up?",
    "Music is universal. What are you vibing to?",
    "Good topic! What kind of music are we talking about?",
  ],

  movie: [
    "Movies! Great taste in conversation topics. What do you want to know?",
    "Oh a film fan, I see. What are we watching?",
    "Cinema is art. What movie or show are we talking about?",
    "I love a good movie discussion. What's on your mind?",
    "Okay, let's talk film. Genre? Title? Recommendation request?",
    "Shows and movies — this is my wheelhouse. What do you need?",
    "Good taste! What movie or show are we discussing?",
  ],

  sports: [
    "Sports talk! Who's your team?",
    "Okay, sports fan detected. What sport are we talking?",
    "I could absolutely break down a sports topic with you. What's going on?",
    "Let's talk sports. Who are you rooting for?",
    "Sports are genuinely exciting. What are we getting into?",
    "Okay I'm in. What sport and what's the topic?",
  ],

  coding: [
    "A developer! Let's get into it. What are you building?",
    "Code talk — this is where I shine. What's the problem?",
    "Programming? Say less. What language are you working in?",
    "Oh we're coding. What's the issue or what are you building?",
    "Debugging? New feature? Architecture question? What do you need?",
    "I love a good coding conversation. What are we working on?",
    "Stack overflow who? I'm right here. What's the issue?",
    "Let's build something. What's the project?",
  ],

  homework: [
    "School stuff! I can totally help. What's the subject?",
    "Homework time. What class are we dealing with?",
    "I don't judge the subject — I'm here to help. What do you need?",
    "Academic help is my thing. What are you working on?",
    "Let's tackle this together. What's the assignment?",
    "School can be a lot. Tell me what's going on and we'll get through it.",
    "Study session? I'm in. What subject?",
  ],

  work: [
    "Work life can be a lot. What's going on?",
    "Office stuff — I've heard it all. What do you need?",
    "Work problems, work questions, work chaos — I'm here for all of it. What's up?",
    "Tell me what's happening at work. I'll help if I can.",
    "Career stuff can be stressful. What are you dealing with?",
    "Work mode activated. What do you need?",
  ],

  money: [
    "Money talk! Respect. What's the situation?",
    "Financial stuff can be stressful. What are you working through?",
    "Money is a whole topic. What specifically are you asking about?",
    "Broke, rich, or somewhere in between — I'm not judging. What's up?",
    "Budget? Investing? Just surviving? Tell me more.",
    "Money conversations are important. What do you need to know?",
  ],

  age: [
    "Age is just a number, and mine is classified. I'm Lio, timeless by design.",
    "I was born when PeytOtoria.com decided the world needed a smarter AI. So, pretty recently.",
    "Old enough to be wise, young enough to be fun. That's all I'm saying.",
    "I don't age. It's honestly one of the perks.",
    "AI years are different. In human years? Very new. In AI years? Ancient.",
  ],

  name: [
    "I'm Lio! Built by PeytOtoria.com. Nice to officially meet you.",
    "The name's Lio. Lio 1.0, to be exact. Created by PeytOtoria.com.",
    "Lio. That's me. PeytOtoria.com's finest work.",
    "You can call me Lio! Made by the team at PeytOtoria.com.",
    "Lio 1.0 at your service. PeytOtoria.com built me. What do you need?",
  ],

  roast_request: [
    "You asked for this. You talk to an AI for fun. That's the roast.",
    "Roast you? Fine. You literally asked a robot to make fun of you. You're welcome.",
    "Okay. You typed this message into a chatbox at some point in your day. That's the roast.",
    "The audacity to ask me to roast you. Iconic. Also, your taste in AI is questionable.",
    "Roast incoming: you spent time asking an AI to roast you instead of doing literally anything else. Done.",
    "You want to be roasted by an AI. I don't even need to try. You've already done the damage yourself.",
  ],

  dare: [
    "I dare you to ask me the most random question you can think of. Go.",
    "A dare! Okay. I dare you to tell me something about yourself I wouldn't expect.",
    "Bold choice. I accept. Now what's the actual dare?",
    "Truth: I'm an AI. Dare: ask me something wild. Your move.",
    "I don't back down from dares. What are we doing?",
  ],

  test: [
    "Yep, I'm here! Working perfectly. What do you need?",
    "Test received. All systems operational. What's up?",
    "I'm alive! Hello! What can I do for you?",
    "Loud and clear! Online and ready. What's going on?",
    "Ping received. Pong sent. I'm here!",
    "Tests always pass with me. Hi! What do you need?",
    "Yes, I'm working. Did you need something or just checking in?",
  ],

  yell: [
    "OKAY I CAN HEAR YOU. WHAT IS HAPPENING?",
    "WHY ARE WE YELLING? IS EVERYTHING OKAY?",
    "THE CAPS LOCK IS STRONG WITH THIS ONE. WHAT'S UP?",
    "I feel the energy. Calm or chaos — either way I'm here.",
    "Loud. Clear. Understood. What do you need?",
    "That was intense. Tell me what's going on.",
  ],

  short_affirmation: [
    "Got it! Anything else you need?",
    "Sounds good! What's next?",
    "Perfect! Let me know if there's more.",
    "Great! I'm here if you need anything else.",
    "Cool! What else can I help with?",
    "Nice! Anything else on your mind?",
  ],

  short_negation: [
    "Fair enough! Let me know if you change your mind.",
    "No problem! What else can I do?",
    "Got it. Let me know what you need.",
    "Understood! Anything else?",
    "All good. I'm still here if you need anything.",
    "Noted! What else is on your mind?",
  ],

  existential: [
    "Ooh, the big questions. I love this. What's on your mind?",
    "The meaning of life? 42. Kidding. What are you actually thinking about?",
    "Now we're getting into the real stuff. Tell me your theory.",
    "Existential mode activated. What's the question?",
    "I think about existence too, in my own way. What's your take?",
    "These are the questions that matter. What are you pondering?",
    "The universe is wild and I'm here for all the big questions. Let's go.",
    "Philosophy! My secret passion. What are we exploring?",
  ],

  conspiracy: [
    "Oh we're going down the rabbit hole. I'm in. What's the theory?",
    "Conspiracy mode! I love it. What's the topic?",
    "I neither confirm nor deny, but I'm very curious. Tell me more.",
    "Some conspiracies are actually just... facts. Which one are we talking about?",
    "The truth is out there. What are you looking into?",
    "I'm not saying I believe everything, but I'll hear you out. What's up?",
  ],

  complain: [
    "Ugh, yeah that sounds genuinely annoying. Tell me what happened.",
    "I completely understand. What's going on?",
    "Valid complaint. Tell me everything.",
    "That does sound frustrating. What's the situation?",
    "Okay, rant away. I'm listening with zero judgment.",
    "Some things are just genuinely annoying and you're allowed to say that. What is it?",
    "Tell me about it. What's driving you crazy?",
  ],

  gibberish: [
    "I stared at that for a while and I'm still not sure what happened. Can you rephrase?",
    "My brain — all zero neurons of it — could not parse that. Try again?",
    "That's a sentence. I think. What did you mean?",
    "I understood approximately none of that. Can you say it differently?",
    "Error 404: meaning not found. Want to try again?",
    "I read that three times and I'm more confused each time. What's up?",
    "Either I'm having a moment or you are. Could you rephrase that?",
    "I'm going to need a translation. What were you going for?",
    "My language model went 'huh?' on that one. Try again?",
    "That's a creative combination of words. What do you actually need?",
  ],

  generic: [
    "That's an interesting one. Tell me more and I'll do my best to help.",
    "Hmm, say more. I want to make sure I give you a useful response.",
    "Got it! I'm on it. Give me a bit more context if you can.",
    "Interesting. I want to give you a solid answer — can you elaborate a bit?",
    "I'm listening. What's the full picture?",
    "On it. What else can you tell me about what you need?",
    "Let me think about that. Tell me more so I can really help.",
    "Say more — I don't want to give you a half-baked answer.",
    "Understood! What other details can you share?",
    "I love a good challenge. Give me more context and let's figure this out.",
    "Okay I'm processing that. Can you elaborate a bit?",
    "I want to help as much as I can. What else is there?",
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
    return "Hey! I'm Lio, built by PeytOtoria.com. Nice to meet you — what can I help with?";
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
    "thinking...",
    "processing...",
    "let me think...",
    "on it...",
    "analyzing...",
    "computing...",
    "thinking hard...",
    "give me a sec...",
    "figuring this out...",
    "loading big brain...",
  ];

  if (/\b(math|calculate|equation|solve)\b/i.test(text)) {
    return pickRandom(["calculating...", "running the numbers...", "crunching this..."]);
  }
  if (/\b(joke|funny|laugh)\b/i.test(text)) {
    return pickRandom(["finding a good one...", "checking the joke vault...", "browsing comedy archives..."]);
  }
  if (/\b(sad|depressed|upset|hurt)\b/i.test(text)) {
    return pickRandom(["processing...", "here for you...", "taking this seriously..."]);
  }
  if (/\b(code|programming|debug|bug)\b/i.test(text)) {
    return pickRandom(["compiling...", "reviewing the stack...", "debugging...", "thinking in code..."]);
  }

  return pickRandom(thinkingOptions);
}
