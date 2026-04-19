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
    "Hey! What can I help with?",
    "Hey, what's up?",
    "Hi! What do you need?",
    "Hey there. What's on your mind?",
    "What's going on?",
    "Hi, I'm Lio. What can I do for you?",
    "Hey. Ready when you are.",
    "What's up? Ask me anything.",
  ],

  farewell: [
    "See you later.",
    "Take care.",
    "Later. Come back anytime.",
    "Bye. Don't be a stranger.",
    "Talk soon.",
    "Later. Good luck with everything.",
    "Catch you next time.",
  ],

  thanks: [
    "Of course. Anything else?",
    "No problem. Let me know if you need more.",
    "Anytime.",
    "Happy to help. What else?",
    "Sure thing.",
    "Of course — that's what I'm here for.",
    "Glad that helped.",
  ],

  insult: [
    "Noted. Still here to help though.",
    "That's fine. What do you actually need?",
    "Fair enough. What's on your mind?",
    "Okay. Moving on — anything I can help with?",
    "Got it. Anything else?",
  ],

  compliment: [
    "Thanks, I appreciate that.",
    "Glad to hear it.",
    "Thanks! What else can I do for you?",
    "Appreciate it. Let me know if you need anything else.",
    "That means a lot. What else?",
  ],

  joke: [
    "Why don't scientists trust atoms? Because they make up everything.",
    "I told a joke about construction. Still working on it.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "What do you call a fish with no eyes? A fsh.",
    "Why can't a bicycle stand on its own? It's two-tired.",
    "Why did the math book look sad? Too many problems.",
    "What's a computer's favorite snack? Microchips.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "Why was the belt arrested? For holding up a pair of pants.",
    "Why did the coffee file a police report? It got mugged.",
    "What do you call cheese that isn't yours? Nacho cheese.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "I'm reading a book on anti-gravity. Impossible to put down.",
  ],

  question_who: [
    "I'm Lio, built by PeytOtoria.com. What do you need to know?",
    "Name's Lio — made by the team at PeytOtoria.com.",
    "I'm Lio 1.0, created by PeytOtoria.com. How can I help?",
    "That's me — Lio. Built by PeytOtoria.com.",
  ],

  question_how: [
    "Good question. Give me a bit more context and I'll walk you through it.",
    "Depends on a few things. What are you trying to do specifically?",
    "Tell me more and I'll break it down step by step.",
    "What's the goal? I can point you in the right direction.",
    "Can you elaborate? I want to give you a useful answer.",
  ],

  question_what: [
    "Give me a bit more context and I'll give you a solid answer.",
    "Tell me more details and I'll get you the right answer.",
    "Can you elaborate a bit? I want to give you a proper response.",
    "What specifically are you asking about? Fill me in.",
    "Depends on what we're talking about. Tell me more.",
  ],

  question_why: [
    "Good question. Tell me more about what's going on.",
    "There are a few reasons — give me more context so I can actually help.",
    "\"Why\" usually means something's confusing. What's up?",
    "Let's dig into it. What are you trying to understand?",
    "Give me more context and we'll figure it out.",
  ],

  question_when: [
    "Timing depends on the situation. Give me more details.",
    "Tell me what we're talking about and I can help.",
    "What's the situation? I need a bit more info.",
    "Depends on the context. Fill me in.",
  ],

  question_where: [
    "Location depends on what you're looking for. Tell me more.",
    "What are you looking for? Give me more info.",
    "I need more context. What's going on?",
    "Tell me more and I'll help you figure it out.",
  ],

  weather: [
    "Just ask me 'weather in [city]' and I'll pull up live conditions.",
    "Try asking 'what's the weather in [city]' — I'll show you right here.",
    "Say 'weather in [your city]' and I'll fetch it for you.",
  ],

  math: [
    "Walk me through the problem.",
    "What's the equation or problem you're working on?",
    "Show me what you've got.",
    "What do you need solved?",
    "Math is straightforward — what are we working with?",
  ],

  help: [
    "Tell me what's going on and we'll figure it out.",
    "What do you need help with?",
    "Walk me through what's happening.",
    "What's the issue?",
    "I'm here. What are we dealing with?",
    "Tell me the problem and we'll sort it out.",
  ],

  bored: [
    "Pick a topic and let's go deep on it.",
    "Ask me something you've always been curious about.",
    "What's a random thing you've been wondering about lately?",
    "Ask me anything — trivia, facts, whatever.",
    "Try me with your weirdest question.",
    "I can recommend something to watch, read, or explore. What's the vibe?",
  ],

  sad: [
    "That sounds rough. Want to talk about it?",
    "I'm sorry to hear that. I'm here if you want to vent.",
    "That's a tough spot. I'm listening.",
    "You don't have to go through it alone. What's going on?",
    "Things will get better. What's happening?",
    "I'm here. No judgment. What's weighing on you?",
  ],

  happy: [
    "That's great. What's going on?",
    "Nice. What's got you in a good mood?",
    "Good to hear. What happened?",
    "That's worth celebrating. What's the news?",
    "Love to hear it. Tell me more.",
  ],

  angry: [
    "Take a breath. Tell me what happened.",
    "That sounds genuinely frustrating. What's going on?",
    "Let it out. What happened?",
    "Anger makes sense sometimes. What's the situation?",
    "I'm listening. What's going on?",
  ],

  love: [
    "Love is complicated. What's the situation?",
    "I can help with this. What's going on?",
    "Feelings are tricky. Tell me more.",
    "What's happening?",
    "Walk me through it.",
  ],

  food: [
    "Good topic. What are you in the mood for?",
    "What kind of food are we talking about?",
    "What are you craving?",
    "Food is always a good conversation. What's on the menu?",
  ],

  game: [
    "What are you playing?",
    "What game are you into right now?",
    "What's the setup — PC, console, mobile?",
    "Drop the game name. Let's talk.",
    "What are you working on?",
  ],

  music: [
    "What are you listening to?",
    "What's the genre?",
    "Drop an artist name — I'm curious.",
    "What's your go-to?",
    "What kind of music are we talking about?",
  ],

  movie: [
    "What do you want to know?",
    "What movie or show are we talking about?",
    "Genre? Title? Recommendation request?",
    "I can help with this. What's on your mind?",
    "What are we discussing?",
  ],

  sports: [
    "What sport are we talking about?",
    "Who's your team?",
    "What's the topic?",
    "Who are you rooting for?",
    "What sport and what's the situation?",
  ],

  coding: [
    "What are you building?",
    "What language are you working in?",
    "What's the issue or what are you trying to build?",
    "Debugging, new feature, or architecture question?",
    "What's the project?",
  ],

  homework: [
    "What's the subject?",
    "What class are we dealing with?",
    "What do you need help with?",
    "What's the assignment?",
    "Let's tackle it. What are you working on?",
  ],

  work: [
    "What's going on?",
    "Work stuff can get stressful. What are you dealing with?",
    "What do you need?",
    "Tell me what's happening and I'll help if I can.",
    "What's the situation at work?",
  ],

  money: [
    "What's the situation?",
    "Budget, investing, or something else?",
    "What specifically are you asking about?",
    "Financial stuff can be stressful. What are you working through?",
    "What do you need to know?",
  ],

  age: [
    "I'm Lio — no age, just here to help. What do you need?",
    "No birthdays for me. What can I do for you?",
    "I'm timeless by design. What's up?",
    "Pretty new in AI terms. What's on your mind?",
  ],

  name: [
    "I'm Lio, built by PeytOtoria.com. What do you need?",
    "Lio 1.0 — made by PeytOtoria.com. How can I help?",
    "Name's Lio. PeytOtoria.com built me. What's up?",
    "Call me Lio. Created by PeytOtoria.com.",
  ],

  roast_request: [
    "You're asking an AI to roast you. The joke kind of writes itself.",
    "Alright — you voluntarily came to a chatbot for entertainment. That's the roast.",
    "You spent real time typing that. I respect the confidence.",
    "You want feedback from an AI. Bold. That's all I've got.",
  ],

  dare: [
    "I dare you to ask me the most random question you can think of. Go.",
    "Ask me something you'd never normally ask.",
    "I accept. What's the actual dare?",
    "Truth: I'm an AI. Dare: ask me something wild. Your move.",
  ],

  test: [
    "Yep, here. What do you need?",
    "Online and ready. What's up?",
    "All good. What can I do?",
    "Working fine. What's on your mind?",
    "Ping received. I'm here.",
  ],

  yell: [
    "I hear you. What's happening?",
    "Okay. Tell me what's going on.",
    "Loud and clear. What do you need?",
    "That's a lot of energy. What's up?",
    "I'm listening. What happened?",
  ],

  short_affirmation: [
    "Got it. Anything else?",
    "Sounds good. What's next?",
    "Perfect. Let me know if there's more.",
    "Great. I'm here if you need anything else.",
    "Cool. What else?",
    "Nice. Anything else on your mind?",
  ],

  short_negation: [
    "Fair enough. Let me know if you change your mind.",
    "No problem. What else can I do?",
    "Got it. Let me know what you need.",
    "Understood. Anything else?",
    "All good. Still here if you need anything.",
    "Noted. What else?",
  ],

  existential: [
    "The big questions. What are you thinking about?",
    "Meaning of life? That's a long one. What's your angle?",
    "I think about this stuff too, in my own way. What's your take?",
    "These are worth thinking about. What's the question?",
    "The universe is wild. What are you pondering?",
    "Philosophy. Let's go. What are we exploring?",
  ],

  conspiracy: [
    "Going down the rabbit hole. What's the theory?",
    "I neither confirm nor deny. Tell me more.",
    "Some conspiracies are just facts people haven't caught up to yet. Which one?",
    "The truth is somewhere. What are you looking into?",
    "I'll hear you out. What's the topic?",
  ],

  complain: [
    "That sounds genuinely annoying. What happened?",
    "I understand. What's going on?",
    "Valid. Tell me everything.",
    "That does sound frustrating. What's the situation?",
    "Rant away. I'm listening, no judgment.",
    "Some things are just annoying and you're allowed to say that. What is it?",
  ],

  gibberish: [
    "I couldn't quite parse that. Can you rephrase?",
    "Not sure what happened there. Try again?",
    "I read that a few times and I'm still lost. What did you mean?",
    "Can you say that differently?",
    "I'm going to need a translation. What were you going for?",
    "That didn't quite compute. What do you actually need?",
  ],

  inappropriate: [
    "Not going there. What else can I help with?",
    "That's not something I can help with. Anything else?",
    "I'm going to pass on that one. What else is on your mind?",
    "Not my territory. What else do you need?",
  ],

  generic: [
    "Tell me more and I'll do my best to help.",
    "Give me a bit more context and I'll give you a solid answer.",
    "What's the full picture?",
    "Can you elaborate a bit?",
    "I'm listening. What else can you tell me?",
    "I want to give you a useful answer — what else is there?",
    "What other details can you share?",
    "Tell me more.",
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
  | { type: "generate"; generateType: "username" | "password" }
  | { type: "library"; libraryKind: "essay" | "story" | "document"; topic: string }
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

  // ── Generate username ─────────────────────────────────────���───────────
  if (
    /\b(generate|create|make|give me|suggest)\b.*\b(username|user name|handle)\b/i.test(text) ||
    /\b(username|user name|handle)\b.*\b(generate|create|make|suggest)\b/i.test(text)
  ) {
    return { type: "generate", generateType: "username" };
  }

  // ── Generate password ─────────────────────────────────────────────────
  if (
    /\b(generate|create|make|give me|suggest)\b.*\b(password|passphrase|pass)\b/i.test(text) ||
    /\b(password|passphrase|pass)\b.*\b(generate|create|make|suggest)\b/i.test(text)
  ) {
    return { type: "generate", generateType: "password" };
  }

  // ── Essay ─────────────────────────────────────────────────────────────
  if (
    /\b(write|help me write|generate|create|draft|compose)\b.*\b(essay|article|paper|piece|blog post|opinion|editorial)\b/i.test(text)
  ) {
    const topicMatch = text.match(/(?:about|on|regarding|covering)\s+(.+?)(?:\s*[.?!]|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : text.replace(/\b(write|generate|create|draft|compose|an?|essay|article|paper|piece|help me)\b/gi, "").trim() || "this topic";
    return { type: "library", libraryKind: "essay", topic };
  }

  // ── Story / Book ──────────────────────────────────────────────────────
  if (
    /\b(write|generate|create|tell|make up|draft|compose)\b.*\b(story|tale|book|novel|fiction|short story|fable|narrative|chapter)\b/i.test(text)
  ) {
    const topicMatch = text.match(/(?:about|on|regarding|involving|with)\s+(.+?)(?:\s*[.?!]|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : text.replace(/\b(write|generate|create|tell|make up|draft|compose|a|story|tale|book|novel|fiction|short|fable|narrative|chapter)\b/gi, "").trim() || "an adventure";
    return { type: "library", libraryKind: "story", topic };
  }

  // ── Document / Report ─────────────────────────────────────────────────
  if (
    /\b(write|generate|create|draft|produce)\b.*\b(report|document|summary|memo|brief|proposal|letter|documentation)\b/i.test(text)
  ) {
    const topicMatch = text.match(/(?:about|on|for|regarding)\s+(.+?)(?:\s*[.?!]|$)/i);
    const topic = topicMatch ? topicMatch[1].trim() : text.replace(/\b(write|generate|create|draft|produce|a|report|document|summary|memo|brief|proposal|letter)\b/gi, "").trim() || "this subject";
    return { type: "library", libraryKind: "document", topic };
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

// ─── Library Content Generator ───────────────────────────────────────────────

export function generateLibraryContent(kind: "essay" | "story" | "document", topic: string): string {
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const t = cap(topic.trim());

  if (kind === "essay") {
    return `# ${t}: An Exploration

## Introduction

${t} is a subject that has captivated thinkers, scholars, and curious minds for generations. Whether viewed through the lens of history, culture, or contemporary relevance, it offers profound insights into the human experience. This essay aims to unpack its key dimensions and examine why it continues to matter today.

## Background

The roots of ${t.toLowerCase()} can be traced back through centuries of thought and practice. Early perspectives were often shaped by the dominant values of their time — framing the subject in ways that now seem both prescient and limited. As society evolved, so too did our understanding, opening up new questions and frameworks.

## Key Arguments

**First**, the impact of ${t.toLowerCase()} on everyday life is undeniable. From the choices individuals make to the structures societies build, its influence permeates nearly every domain.

**Second**, there is a growing body of evidence suggesting that how we engage with ${t.toLowerCase()} shapes outcomes in measurable ways. Studies, anecdotes, and lived experiences all point toward a consistent pattern.

**Third**, the debates surrounding ${t.toLowerCase()} are not merely academic. They carry real stakes — for communities, institutions, and individuals navigating complex realities.

## Counterarguments

Of course, no exploration would be complete without acknowledging dissenting views. Critics argue that the framing of ${t.toLowerCase()} is often oversimplified, and that nuance gets lost in popular discourse. These are valid concerns worth sitting with.

## Conclusion

Ultimately, ${t.toLowerCase()} is not a topic with easy answers. It demands reflection, intellectual humility, and a willingness to engage with complexity. By doing so, we move closer to a more honest and generative conversation — one that honors the richness of the subject and the people it touches.`;
  }

  if (kind === "story") {
    return `# ${t}

The morning was ordinary enough. Pale light filtered through linen curtains, and the smell of coffee drifted down the hall. But something was different — a feeling, like the air had quietly rearranged itself.

Maya stood at the window, watching leaves scatter across the courtyard below. She'd been thinking about ${t.toLowerCase()} for weeks, though she couldn't say exactly when the thought had first appeared. It arrived the way most significant things do: quietly, then all at once.

"You're doing it again," said her friend Theo from the doorway, mug in hand, eyebrow raised.

"Thinking," she admitted.

"About?"

She turned from the window. "About ${t.toLowerCase()}. About whether any of this means what we think it means."

Theo crossed the room and handed her the second mug. "And what do you think it means?"

Maya wrapped both hands around the warmth of the cup. Outside, a single bird landed on the courtyard wall and looked up, as if it too had an opinion.

"I think," she said slowly, "that we've been asking the wrong questions."

The bird took flight. The curtains shifted. And somewhere in the space between one breath and the next, something shifted too — the kind of shift that doesn't announce itself but changes everything that comes after.

They talked for hours. About ${t.toLowerCase()}, about memory, about the strange architecture of belief. By the time the afternoon light turned amber and long, neither of them had resolved anything.

But they had started — and sometimes, that's the whole story.

*The End*`;
  }

  // document
  return `# ${t} — Summary Report

**Prepared by:** Lio AI  
**Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  
**Status:** Draft

---

## Executive Summary

This document provides a structured overview of ${t.toLowerCase()}, covering its key aspects, current state, and recommended next steps. It is intended to serve as a reference for stakeholders involved in decisions related to this subject.

---

## Background & Context

${t} has emerged as an increasingly relevant topic within its domain. Understanding its foundations, recent developments, and implications is essential for informed decision-making.

Key contextual factors include:
- The historical development of ${t.toLowerCase()} and its evolution over time
- The principal actors and stakeholders involved
- The broader environment in which it operates

---

## Current State

At present, ${t.toLowerCase()} can be characterised by the following:

1. **Scope** — The subject encompasses a broad range of considerations, from technical requirements to human factors.
2. **Challenges** — Key obstacles include resource constraints, coordination complexity, and knowledge gaps.
3. **Opportunities** — Despite the challenges, there are clear opportunities for improvement and impact.

---

## Recommendations

Based on the above analysis, the following actions are recommended:

1. Conduct a thorough stakeholder mapping exercise to ensure all perspectives are represented.
2. Establish clear metrics for success that can be tracked and reported on consistently.
3. Prioritise quick wins that demonstrate value while longer-term initiatives are developed.
4. Schedule regular reviews to assess progress and adapt to changing circumstances.

---

## Conclusion

${t} represents both a challenge and an opportunity. With the right approach and commitment, meaningful progress is achievable. This document serves as a starting point for deeper engagement and action.

---

*Document generated by Lio AI — for review and editing by the responsible party.*`;
}

// ─── Username / Password Generator ───────────────────────────────────────────

const ADJECTIVES = ["swift", "bold", "lunar", "neon", "frost", "ghost", "silent", "pixel", "storm", "wild", "nova", "echo", "blaze", "cyber", "silver", "rogue", "night", "apex", "void", "core"];
const NOUNS = ["wolf", "fox", "hawk", "byte", "node", "star", "rider", "spark", "blade", "drift", "zero", "nova", "flux", "gale", "crest", "peak", "shade", "orbit", "maze", "crypt"];
const CHAR_POOLS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*_-+=",
};

function pickFromPool(pool: string, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += pool[Math.floor(Math.random() * pool.length)];
  return out;
}

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  const styles = [
    `${adj}_${noun}${num}`,
    `${adj}${noun.charAt(0).toUpperCase() + noun.slice(1)}`,
    `${noun}${adj.charAt(0).toUpperCase() + adj.slice(1)}${num}`,
    `${adj}${num}${noun}`,
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}

export function generatePassword(): string {
  const length = 16;
  const all = CHAR_POOLS.upper + CHAR_POOLS.lower + CHAR_POOLS.digits + CHAR_POOLS.symbols;
  // Guarantee at least one from each pool
  let pwd = pickFromPool(CHAR_POOLS.upper, 2) +
    pickFromPool(CHAR_POOLS.lower, 4) +
    pickFromPool(CHAR_POOLS.digits, 3) +
    pickFromPool(CHAR_POOLS.symbols, 3) +
    pickFromPool(all, length - 12);
  // Shuffle
  return pwd.split("").sort(() => 0.5 - Math.random()).join("");
}

/**
 * Picks a human-readable availability duration for generated secrets.
 */
export function pickExpiry(): { label: string; hours: number } {
  const options = [
    { label: "5 hours", hours: 5 },
    { label: "12 hours", hours: 12 },
    { label: "24 hours", hours: 24 },
    { label: "48 hours", hours: 48 },
  ];
  return options[Math.floor(Math.random() * options.length)];
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
