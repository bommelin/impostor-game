const PREDEFINED_TEMPLATE_ENTRIES = [

  { name: "Famous cities", words: [
    "Berlin","Vancouver","Phuket","Brasília","Canberra","Copenhagen","Helsinki","London","Madrid","Oslo","Ottawa","Paris","Rome","Stockholm","Tokyo","Washington D.C.","Beijing",
    "Reykjavik","Dublin","Warsaw","Prague","Vienna","Budapest","Athens","Lisbon","Bern","Brussels",
    "Ankara","Cairo","Bangkok","Seoul","New Delhi","Mexico City","Buenos Aires",
    "Milano","Göteborg","Malmö","Uppsala","Åre",
    "Barcelona","Amsterdam","Zurich","Munich","Hamburg","Frankfurt",
    "New York","Los Angeles","Miami","Las Vegas","Chicago","San Francisco","Boston","Toronto",
    "Dubai","Abu Dhabi","Doha","Singapore","Hong Kong",
    "Sydney","Rio de Janeiro","Cape Town","Marrakech",
    "Shanghai","Kyoto","Osaka",
    "Bali","Maldives",
    "Istanbul","Ibiza","Monaco","Nice",
    "Edinburgh","Manchester",
    "Val d'Isere","Zermatt","Chamonix"
  ]},

  { name: "Famous landmarks", words: [
    "Eiffel Tower","Big Ben","Colosseum","Statue of Liberty","Golden Gate Bridge","Mount Rushmore","Great Wall of China","Taj Mahal",
    "Petra","Angkor Wat","Machu Picchu","Christ the Redeemer","Sydney Opera House","Burj Khalifa","Stonehenge",
    "Turning Torso","Vasa Museum","Gamla Stan","Stockholm City Hall","Öresund Bridge","Icehotel Jukkasjärvi",
    "Kalmar Castle","Uppsala Cathedral","Brandenburg Gate","Empire State Building","Sagrada Família","Acropolis","Niagara Falls"
  ]},

  { name: "Swedish celebrities", words: [
    "Felix Herngren","JLC","Loreen","Avicii","Zlatan Ibrahimovic","Björn Borg","Ingemar Stenmark","Henrik Lundqvist","Sarah Sjöström","Armand Duplantis",
    "Max Martin","Robyn","Håkan Hellström","Veronica Maggio","Carola Häggkvist","Petter","Måns Zelmerlöw",
    "Alicia Vikander","Alexander Skarsgård","Stellan Skarsgård", "Felix Herngren", "Carl XVI Gustav",
    "Tove Lo","Lykke Li","PewDiePie","Notch", "Markoolio", "Truls Möregårdh",
    "Stefan Löfven","Jimmie Åkesson","Magdalena Andersson","Ulf Kristersson", "Fredrik Reinfeldt",
    "Benjamin Ingrosso","Cornelia Jakobs","David Batra","Petra Mede",
    "Zara Larsson","HOV1","Bolaget","Messiah Hallberg","Tony Irving",
    "David Hellenius","Pernilla Wahlgren","Henrik Dorsin","Tusse",
    "Jonas Andersson (RMM)","Johan Rheborg","Robert Gustafsson", "Bianca Ingrosso",
    "Ebba Busch", "Yung Lean","Samir Badran", "Viktor Frisk","Paow","Peter Stormare",
    "Arga snickaren","John Lundvik","Eric Saade","Lotta Schelin","Anis Don Demina", "Dermot Clemenger", "Alexander Ernstberger", "Gunilla Persson",
    "Fröken Snusk", "Pontus Rasmusson", "Edvin Törnblom", "Johanna Nordström",
    "Rickard Olsson","Isabella Löwengrip","Paolo Roberto","Maria Montazami","Leif GW Persson","Jan Emanuel",
  ]},

  { name: "Swedish influencers", words: [
    "Bianca Ingrosso","Therese Lindgren","Johanna Nordström","Joakim Lundell","Jonna Lundell",
    "Matilda Djerf","Alice Stenlöf","Margaux Dietz","Clara Henry",
    "Anis Don Demina","Keyyo","Jon Olsson","Lovisa Barkman", "Lovisa Worge",
    "Hanna Schönberg","Hanna Friberg","Wilma Holmqvist","Isa Östling",
    "Antonija Mandir","IJustWantToBeCool","Edvin Törnblom",
    "JLC","Random Making Movies","STHLM Panda","Filip Dikmen","Hampus Hedström",
    "Tan by Klara","Emelie Lindmark","Sofie Karlstad",
    "Amilia Stapelfeldt","Christofer Westerlund",
    "Isabella Löwengrip","Kenza Zouiten","Sofie Fahrman"
  ]},

  { name: "Places in Sweden", words: [
    "Stockholm","Boden","Lidingö","Visby", "Nacka","Bromma","Rinkeby","Tensta","Södertälje",
    "Täby","Sollentuna","Upplands Väsby","Huddinge","Nynäshamn",
    "Västerås","Uppsala","Strängnäs","Enköping","Norrtälje",
    "Örebro","Eskilstuna","Linköping","Nyköping","Västervik",
    "Kalmar","Karlskrona","Halmstad","Helsingborg","Lund","Malmö",
    "Ystad","Trelleborg","Göteborg","Båstad","Falsterbo","Örkeljunga", 
  ]},

  { name: "Stranger Things", words: [
    "Eleven","Mike Wheeler","Dustin Henderson","Lucas Sinclair","Will Byers","Max Mayfield",
    "Hopper","Joyce Byers","Vecna","Mind Flayer","Demogorgon", "Demodog",
    "Upside Down","Hawkins","Starcourt Mall","Eggo waffles","Hellfire Club","Eddie Munson","Season 1","Christmas lights", "Season 2", "Season 3", "Final Season"
  ]},

  { name: "The Office", words: [
    "Michael Scott","Dwight Schrute","Jim Halpert","Pam Beesly","Andy Bernard","Stanley Hudson",
    "Kevin Malone","Angela Martin","Oscar Martinez","Creed Bratton", "Toby Flenderson", "Todd Packer", "Jan Levinson",
    "Dunder Mifflin","Scranton","World’s Best Boss","Pranks","Beets", "Fun run", "Phyllis Vance", "Bob Vance", "Ryan the temp", "Kelly Kapoor", "Prison Mike",
    "That’s what she said","Office Olympics","Pretzel Day","Conference Room", "Dinner Party", "The warehouse", "Pranks"
  ]},

  { name: "Friends", words: [
    "Rachel Green","Ross Geller","Monica Geller","Chandler Bing","Joey Tribbiani","Phoebe Buffay",
    "Janice","Central Perk","Smelly Cat","Pivot","We were on a break",
    "Apartment","Thanksgiving","Coffee","New York",
    "Gunther","The Couch","Wedding in London","Holiday Armadillo"
  ]},

  { name: "Breaking Bad", words: [
    "Walter White","Jesse Pinkman","Saul Goodman","Skyler White","Hank Schrader","Gus Fring",
    "Mike Ehrmantraut","Heisenberg","Los Pollos Hermanos","Blue meth",
    "RV","DEA","Chemistry","Albuquerque","Say my name",
    "Better Call Saul","Money barrel","Car wash"
  ]},

  { name: "Game of Thrones", words: [
    "Jon Snow","Daenerys Targaryen","Tyrion Lannister","Arya Stark","Sansa Stark","Cersei Lannister",
    "Jaime Lannister","Night King","White Walkers","Dragons",
    "Winterfell","King’s Landing","Iron Throne","House Stark","House Lannister",
    "The Wall","Red Wedding","Mother of Dragons"
  ]},

  { name: "Disney", words: [
    "Mickey Mouse","Donald Duck","Goofy","Elsa","Anna","Simba","Ariel","Belle",
    "Aladdin","Genie","Buzz Lightyear","Woody","Cinderella","Snow White","Stitch",
    "Moana","Mulan","Rapunzel","Olaf","Peter Pan","Tinker Bell"
  ]},

  { name: "Harry Potter", words: [
    "Harry Potter","Hermione Granger","Ron Weasley","Albus Dumbledore","Severus Snape","Voldemort",
    "Draco Malfoy","Hagrid","Sirius Black","Hogwarts", "Dudley", "Cedric Diggory", "Cho Chang",
    "Gryffindor","Slytherin","Hufflepuff","Ravenclaw","Quidditch", "Remus Lupin", "Hedwig",
    "Dobby","Azkaban","The Sorting Hat","Expelliarmus", "The half blood prine", "Triwizard tournament"
  ]},

  { name: "Marvel Cinematic Universe", words: [
    "Iron Man","Captain America","Thor","Hulk","Black Widow","Hawkeye","Spider-Man",
    "Doctor Strange","Black Panther","Scarlet Witch","Loki","Ant-Man",
    "Guardians of the Galaxy","Avengers","Thanos",
    "Infinity Stones","Wakanda","Nick Fury","Deadpool"
  ]},

  { name: "Animals", words: [
    "Dog","Cat","Horse","Rabbit","Bear","Wolf","Lion","Tiger","Elephant","Giraffe","Zebra",
    "Panda","Kangaroo","Dolphin","Eagle","Shark","Whale","Penguin","Fox","Owl","Monkey","Moose"
  ]},

  { name: "School subjects", words: [
    "Mathematics","English","History","Geography","Biology","Chemistry","Physics",
    "Computer Science","Economics","Civics","Psychology","Philosophy",
    "Art","Music","Physical Education","Drama","Religion","French","Spanish"
  ]},

  { name: "Sports", words: [
    "Football","Basketball","Tennis","Hockey","Ice hockey","Baseball","Cricket","Rugby","Golf",
    "Athletics","Running","Swimming","Volleyball","Badminton","Boxing","Martial arts",
    "Cycling","Skiing","Snowboarding","Ice skating","Figure skating","Roller skating",
    "Motorsport","Disc golf","Bowling","Handball","Padel",
    "Ping pong","Pool","Darts","Surfing","Wind surfing","Water skiing","Jet skiing",
    "Karate","Taekwondo","Judo","Kickboxing","Sumo wrestling","Fencing",
    "Gymnastics","Weight lifting","Archery","Fishing","Horse racing",
    "Rock climbing","Scuba diving","Skateboarding","Street hockey",
    "Sky diving","Hang gliding","Bungee jumping","Chess","E-sports",
  ]},

  { name: "Athletes", words: [
    "Lionel Messi","Sarah Sjöström","Shaquille O'Neal","Cristiano Ronaldo","Neymar","Diego Maradona","Pelé","Ronaldinho","David Beckham",
    "LeBron James","Michael Jordan","Kobe Bryant","Kevin Durant",
    "Tom Brady","Babe Ruth",
    "Roger Federer","Serena Williams","Naomi Osaka",
    "Tiger Woods",
    "Muhammad Ali","Mike Tyson","Floyd Mayweather","Anthony Joshua","Conor McGregor","Khabib Nurmagomedov",
    "Jon Jones","Georges St-Pierre","Ronda Rousey","Amanda Nunes",
    "Usain Bolt","Michael Phelps",
    "Lewis Hamilton","Max Verstappen","Michael Schumacher",
    "Arnold Schwarzenegger","The Rock",
    "Zlatan Ibrahimović","Björn Borg","Armand Duplantis","Henrik Lundqvist","Ingemar Stenmark", "Truls Möregårdh"
  ]},

  { name: "Allsvenskan teams", words: [
    "AIK","Djurgårdens IF","Hammarby IF","IFK Göteborg","Malmö FF",
    "IF Elfsborg","BK Häcken","IFK Norrköping","Kalmar FF","IK Sirius",
    "Halmstads BK","Degerfors IF","Mjällby AIF","Varbergs BoIS","IF Brommapojkarna","Örebro SK"
  ]},

  { name: "Premier League teams", words: [
    "Manchester United","Manchester City","Liverpool","Arsenal","Chelsea",
    "Tottenham Hotspur","Newcastle United","Aston Villa","West Ham United",
    "Everton","Brighton","Wolverhampton","Crystal Palace","Brentford",
    "Nottingham Forest","Leicester City"
  ]},

  { name: "Tennis players", words: [
    "Roger Federer","Rafael Nadal","Novak Djokovic","Andy Murray",
    "Carlos Alcaraz","Daniil Medvedev","Jannik Sinner","Alexander Zverev",
    "Stefanos Tsitsipas","Casper Ruud","Serena Williams","Venus Williams",
    "Iga Świątek","Naomi Osaka","Maria Sharapova","Björn Borg"
  ]},

  { name: "Beer brands", words: [
    "Heineken","Corona","Mariestads","Budweiser","Guinness","Carlsberg","Stella Artois","Peroni","Asahi",
    "Modelo","Kronenbourg","Beck’s","Coors","Miller","Samuel Adams",
    "Pripps Blå","Norrlands Guld","Falcon","Spendrups","Åbro","Sofiero","Eriksberg","Lapin Kulta"
  ]},

  { name: "Car brands", words: [
    "Toyota","Volkswagen","Porsche","BMW","Mercedes-Benz","Audi","Volvo","Ford","Chevrolet",
    "Honda","Hyundai","Kia","Nissan","Mazda","Tesla","Ferrari","Lamborghini", "Koenigsegg"
  ]},

  { name: "Clothing brands", words: [
    "Nike","Armani","New Balance","Adidas","Puma","H&M","Zara","Uniqlo","Levi’s","Ralph Lauren","Tommy Hilfiger",
    "Calvin Klein","Patagonia","Supreme","Gucci","Prada","Balenciaga"
  ]},

  { name: "Melodifestivalen", words: [
    "Carola","Loreen","Måns Zelmerlöw","Charlotte Perrelli","The Ark",
    "Robin Bengtsson","Benjamin Ingrosso","Anna Bergendahl","Eric Saade",
    "Sanna Nielsen","John Lundvik","Cornelia Jakobs","Tusse","Arvingarna",
    "Anders Bagge","Danny Saucedo","Alcazar","The Mamas","Jill Johnson",
    "Lisa Ajax","Nano","Anna Book","Jessica Andersson","Jon Henrik Fjällgren"
  ]},

  { name: "Popular artists", words: [
    "Taylor Swift","Ed Sheeran","Beyoncé","Drake","Ariana Grande","Billie Eilish","The Weeknd","Justin Bieber",
    "Rihanna","Adele","Bruno Mars","Dua Lipa","Post Malone","Lady Gaga","Harry Styles",
    "Olivia Rodrigo","Shakira","Katy Perry","SZA","Travis Scott","Doja Cat","Nicki Minaj",
    "Shawn Mendes","Miley Cyrus","Elton John","Michael Jackson","Madonna","Bad Bunny"
  ]},

  { name: "Popular bands", words: [
    "Coldplay","Imagine Dragons","Maroon 5","OneRepublic","Red Hot Chili Peppers",
    "ABBA","Queen","Linkin Park","Green Day","U2","The Rolling Stones","Metallica",
    "Arctic Monkeys","Foo Fighters","Nirvana","The Beatles","Oasis",
    "Blink-182","The Killers","Kings of Leon","Bon Jovi","Guns N’ Roses","The Police"
  ]},

  { name: "Pre 2000’s Hits", words: [
    "Dancing Queen (ABBA)","Bohemian Rhapsody (Queen)","Billie Jean (Michael Jackson)","Like a Prayer (Madonna)","Smells Like Teen Spirit (Nirvana)",
    "Livin’ on a Prayer (Bon Jovi)","Take On Me (a-ha)","Sweet Child O’ Mine (Guns N’ Roses)","I Will Survive (Gloria Gaynor)","Every Breath You Take (The Police)",
    "Thriller (Michael Jackson)","Hotel California (Eagles)","Don’t Stop Believin’ (Journey)","Girls Just Want to Have Fun (Cyndi Lauper)",
    "Beat It (Michael Jackson)","Eye of the Tiger (Survivor)","Summer of ’69 (Bryan Adams)","Another Brick in the Wall (Pink Floyd)",
    "Sweet Dreams (Are Made of This) (Eurythmics)","With or Without You (U2)","Careless Whisper (George Michael)"
  ]},

  { name: "2000’s Hits", words: [
    "Poker Face (Lady Gaga)","Umbrella (Rihanna)","Crazy in Love (Beyoncé)","Hey Ya! (Outkast)","Mr. Brightside (The Killers)","Hips Don’t Lie (Shakira)",
    "Yeah! (Usher)","Since U Been Gone (Kelly Clarkson)","Rolling in the Deep (Adele)","Single Ladies (Beyoncé)",
    "Viva La Vida (Coldplay)","Apologize (OneRepublic)","Firework (Katy Perry)","Tik Tok (Kesha)","Clocks (Coldplay)",
    "Toxic (Britney Spears)","In the End (Linkin Park)","Seven Nation Army (The White Stripes)","Complicated (Avril Lavigne)","Low (Flo Rida)",
    "Empire State of Mind (Jay-Z)","Disturbia (Rihanna)","Grenade (Bruno Mars)","SexyBack (Justin Timberlake)","Lose Yourself (Eminem)"
  ]},

  { name: "Recent hits", words: [
    "Blinding Lights (The Weeknd)","Shape of You (Ed Sheeran)","Dance Monkey (Tones and I)","As It Was (Harry Styles)","Levitating (Dua Lipa)","Someone You Loved (Lewis Capaldi)",
    "Bad Guy (Billie Eilish)","Shallow (Lady Gaga)","Old Town Road (Lil Nas X)","Despacito (Luis Fonsi)","Sunflower (Post Malone)",
    "Drivers License (Olivia Rodrigo)","Stay (The Kid LAROI)","Watermelon Sugar (Harry Styles)","Rockstar (Post Malone)",
    "Anti-Hero (Taylor Swift)","Flowers (Miley Cyrus)","Industry Baby (Lil Nas X)","Montero (Lil Nas X)","Heat Waves (Glass Animals)","Unholy (Sam Smith)"
  ]},

  { name: "Video games", words: [
    "Mario","Luigi","Princess Peach","Bowser","Yoshi","Donkey Kong","Link","Zelda",
    "Pikachu","Kirby","Samus","Wario",
    "Super Mario Bros","The Legend of Zelda","Pokémon","Tetris","Pac-Man",
    "Sonic the Hedgehog","Street Fighter","Mortal Kombat","Minecraft","The Sims",
    "Grand Theft Auto","Call of Duty","Halo","FIFA","Fortnite",
    "Counter-Strike","League of Legends","World of Warcraft","Overwatch","Valorant",
    "Red Dead Redemption","The Last of Us","God of War","Assassin’s Creed","Skyrim",
    "Elden Ring","Cyberpunk 2077","Among Us","Roblox","Clash of Clans",
    "Brawl Stars","Animal Crossing","Super Smash Bros",
    "Kratos","Lara Croft","Steve (Minecraft)","Creeper","Solid Snake"
  ]},

  { name: "Alcoholic Beverages", words: [
    "Beer","Wine","Red wine","White wine","Rosé","Whiskey","Vodka","Rum","Gin","Tequila",
    "Cider","Champagne","Cognac","Brandy","Liqueur","Absinthe","Sake","Mead","Akvavit","Snaps","Brännvin","Glögg","Aperol"
  ]},

  { name: "Food & snacks", words: [
    "Pizza","Hamburger","Cheeseburger","Hot Dog","Kebab","Tacos","Burrito","Nachos","Fries","Chicken Nuggets",
    "Meatballs","Kanelbulle","Semla","Smörgåstårta","Prinsesstårta","Gravlax","Raggmunk","Surströmming","Knäckebröd","Lussekatt",
    "Sushi","Pasta","Spaghetti Bolognese","Lasagna","Ramen","Pad Thai","Butter Chicken","Falafel","Paella","Dumplings",
    "Chips","Popcorn","Candy","Chocolate","Marabou","Salted Peanuts","Protein Bar","Energy Drink","Ice Cream","Ben & Jerry’s",
    "Brownie","Cheesecake","Cupcake","Pancakes","Waffles","Donut","Macaron","Tiramisu","Apple Pie","Chokladboll",
    "Avocado","Banana","Strawberries","Watermelon","Salmon","Steak","Egg","Toast","Sandwich","Yoghurt",
    "Coffee","Cappuccino","Latte","Milkshake","Smoothie","Cola","Fanta","Red Bull","Beer","Wine"
  ]}
];

const FIXED_PREDEFINED_THEME_DEFINITIONS = [
  {
    id: "general",
    label: "🎲 General",
    itemNames: ["Animals", "School subjects"],
  },
  {
    id: "geography",
    label: "🌍 Geography",
    itemNames: ["Famous cities", "Famous landmarks"],
  },
  {
    id: "sweden",
    label: "🇸🇪 Sweden",
    itemNames: ["Swedish celebrities", "Swedish influencers", "Places in Sweden"],
  },
  {
    id: "movies-and-tv",
    label: "🎬 Movies and TV",
    itemNames: ["Stranger Things", "The Office", "Friends", "Breaking Bad", "Game of Thrones", "Disney", "Harry Potter", "Marvel Cinematic Universe"],
  },
  {
    id: "music",
    label: "🎵 Music",
    itemNames: ["Melodifestivalen", "Popular artists", "Popular bands", "Recent hits","Pre 2000’s Hits", "2000’s Hits"],
  },
  {
    id: "sports",
    label: "🏅 Sports",
    itemNames: ["Sports", "Athletes","Allsvenskan teams", "Premier League teams", "Tennis players"],
  },
  {
    id: "brands",
    label: "🏷️ Brands",
    itemNames: ["Car brands", "Clothing brands", "Beer brands"]
  },
];

const templateByName = new Map(PREDEFINED_TEMPLATE_ENTRIES.map((entry) => [entry.name, entry]));
const assignedTemplateNames = new Set();

const getTemplateByNameOrThrow = (name) => {
  const template = templateByName.get(name);
  if (!template) {
    throw new Error(`Unknown predefined template name: ${name}`);
  }
  return template;
};

const getThemeItems = (itemNames) => itemNames.map((name) => {
  if (assignedTemplateNames.has(name)) {
    throw new Error(`Predefined template is assigned to multiple themes: ${name}`);
  }
  assignedTemplateNames.add(name);
  return getTemplateByNameOrThrow(name);
});

export const PREDEFINED_CUSTOM_WORD_BANK_THEMES = [
  ...FIXED_PREDEFINED_THEME_DEFINITIONS.map((theme) => ({
    id: theme.id,
    label: theme.label,
    items: getThemeItems(theme.itemNames),
  })),
  {
    id: "other",
    label: "🧩 Other",
    items: PREDEFINED_TEMPLATE_ENTRIES.filter((entry) => !assignedTemplateNames.has(entry.name)),
  },
];

export const PREDEFINED_CUSTOM_WORD_BANK = Object.fromEntries(
  PREDEFINED_TEMPLATE_ENTRIES.map((entry) => [entry.name, entry.words]),
);