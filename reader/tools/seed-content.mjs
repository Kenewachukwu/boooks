// The sample library: genres, generated creator profiles, and short original pieces that open in the real reader.
// Everything here is invented for the prototype (the profiles are not real people). The two real stories (Rejuvenating and Heart Break and
// Hot Chocolate) are added by build-library.mjs from the existing registry. Edit here, then run: node tools/build-library.mjs

export const GENRES = [
  { id: 'poetry', name: 'Poetry', color: '#ffc7c6', blurb: 'Short lines, long echoes.' },
  { id: 'love-heartbreak', name: 'Love & Heartbreak', color: '#e10600', blurb: 'The ones that sting, and stay.' },
  { id: 'fiction', name: 'Fiction', color: '#847dff', blurb: 'Invented people, true feelings.' },
  { id: 'memoir', name: 'Memoir', color: '#ffb23e', blurb: 'Real life, told slant.' },
  { id: 'fantasy', name: 'Fantasy', color: '#dd90d8', blurb: 'Doors that should not be there.' },
  { id: 'horror', name: 'Horror', color: '#c6ff5e', blurb: 'Read these with the lights on.' },
  { id: 'sci-fi', name: 'Sci-fi', color: '#00b3dd', blurb: 'Tomorrow, up close.' },
  { id: 'mystery', name: 'Mystery', color: '#d1c9ff', blurb: 'Everyone is hiding something.' },
  { id: 'faith', name: 'Faith & Spirit', color: '#ffd24a', blurb: 'Quiet prayers, loud mornings.' },
  { id: 'young-adult', name: 'Young Adult', color: '#62f0c2', blurb: 'First everything.' },
  { id: 'essays', name: 'Essays', color: '#90b8f0', blurb: 'One thought, thoroughly loved.' },
  { id: 'humour', name: 'Humour', color: '#ff7a59', blurb: 'Laugh first, think later.' },
];

export const PROFILES = [
  { handle: 'amara.writes', name: 'Amara Okafor', bio: 'Poet from Enugu, living in Lagos. Writes about weather, mothers and small mercies.', city: 'Lagos' },
  { handle: 'marisol.rain', name: 'Marisol Duarte', bio: 'Writes love poems and love letters, mostly the ones that never get sent.', city: 'Lisbon' },
  { handle: 'tobi.nights', name: 'Tobi Adeyemi', bio: 'Short stories about small towns, big feelings and people who notice the rain.', city: 'Ibadan' },
  { handle: 'sana.in.ink', name: 'Sana Qureshi', bio: 'Memoir in short pieces: markets, ferries and other places where strangers are kind.', city: 'Toronto' },
  { handle: 'lena.vale', name: 'Lena Vale', bio: 'Fantasy for people who check behind doors. Maps, ruins and orchards.', city: 'Bergen' },
  { handle: 'noor.hollow', name: 'Noor Hollow', bio: 'Horror in under two hundred words. Please do not answer the door.', city: 'Manchester' },
  { handle: 'kofi.quill', name: 'Kofi Mensah', bio: 'Science fiction with a grandmother in it. Kumasi by way of orbit.', city: 'Kumasi' },
  { handle: 'eli.fennick', name: 'Eli Fennick', bio: 'Mysteries solved by the people nobody asks: guards, clerks and clockmakers.', city: 'Leeds' },
  { handle: 'ngozi.afterdark', name: 'Ngozi Eze', bio: 'Psalms and small sermons for tired people. Tea first, then prayer.', city: 'Abuja' },
  { handle: 'jun.hartley', name: 'Jun Hartley', bio: 'Young adult stories about summers, lunch tables and almost saying it.', city: 'Vancouver' },
  { handle: 'bea.lindqvist', name: 'Bea Lindqvist', bio: 'Humour about being late, being wrong and being in the group chat.', city: 'Malmö' },
  { handle: 'dami.reads', name: 'Dami Balogun', bio: 'Essays on slowness, drawers and the quiet furniture of a life.', city: 'Accra' },
];

// template ids: poster, newsprint, handwritten, quiet-serif. mood ids: dark-abstract, soft-pastel, warm-paper, ocean-calm, neon-night,
// forest-mist, golden-hour, mono-grain. kind: 'verse' (lines kept as written) or 'prose' (paragraphs).
export const BOOKS = [
  { slug: 'salt-and-small-mercies', title: 'Salt and Small Mercies', handle: 'amara.writes', genre: 'poetry', kind: 'verse', template: 'handwritten', mood: 'ocean-calm', date: '2026-09-02',
    blurb: 'A grandmother counts blessings in salt. A granddaughter learns what mercy looks like when it is small.', text: `
My grandmother counted blessings in salt,
a pinch for the harvest, a pinch for the road,
a pinch thrown over the shoulder
for whatever was walking behind us.

I did not understand it then.
I thought mercy was a large thing,
a door flung open, a sky split by light.
Nobody told me it comes folded small

like the note my mother left in my lunch,
like the stranger who held the bus,
like the tap that ran warm in January,
like waking and finding I had wanted to.

Now I carry a little salt in my pocket.
Not for luck. For counting.
One for the morning. One for the bread.
One for you, who stayed, and did not say so.` },

  { slug: 'harmattan-letters', title: 'Harmattan Letters', handle: 'amara.writes', genre: 'poetry', kind: 'verse', template: 'handwritten', mood: 'golden-hour', photo: 0.92, date: '2026-09-19',
    blurb: 'Dust on the leaves, a name on the windscreen, and the long dry wait for rain.', text: `
The dust arrives the way bad news does,
quietly, then everywhere.
It sits on the leaves, on the car,
on the sentences we start and cannot finish.

Dear you, the sky has gone the colour of milk tea.
The children write their names in the windscreens.
I wrote yours too, and the wind
read it back to me, letter by letter.

Dry season teaches the throat to be careful.
I ration my words like water,
and still the cracks come, the small ones,
across my lips, across my knuckles,
across the way I say your name.

When the rains return I will not remember
how long it lasted. I will only remember
that something in me kept asking
to be wet again.` },

  { slug: 'the-last-voicenote', title: 'The Last Voicenote', handle: 'marisol.rain', genre: 'love-heartbreak', kind: 'prose', template: 'quiet-serif', mood: 'neon-night', photo: 0.8, date: '2026-09-27',
    blurb: 'Forty-one seconds of a voice, played three hundred times.', text: `
You left me forty-one seconds of your voice and I have played it three hundred times.

It is not a goodbye. That is the cruel part. It is you asking whether I have seen your blue jacket, and saying you will pick up bread on the way home, and laughing at something off to the side that I will never know.

We always think the last thing will sound like the last thing. It will be a speech, a slammed door, a rain-streaked window. It is never that. It is a jacket. It is bread.

I have not found the jacket. I have stopped looking for it, in the way you stop looking for a word you are afraid you already know.

Tonight I played it again, and at second thirty-three you say my name the way you always did, as if it were the start of a joke only the two of us were allowed to finish.

I held my breath for the rest of it. I am still holding it. The recording ends, and I whisper, "Yes?" to the quiet. The quiet, being kind, does not answer.` },

  { slug: 'seven-days-of-not-texting', title: 'Seven Days of Not Texting', handle: 'marisol.rain', genre: 'love-heartbreak', kind: 'verse', template: 'handwritten', mood: 'dark-abstract', photo: 0.9, date: '2026-10-05',
    blurb: 'A week in the life of a phone lying face down.', text: `
Monday I am magnificent.
I clean the whole flat. I alphabetise the spices.
The phone lies face down like a prisoner.

Tuesday I am fine. Fine is a country
with very good weather and no one in it.

Wednesday I write you a message
so reasonable, so luminous with growth,
that I delete it letter by letter,
a small funeral for my dignity.

Thursday the phone lights up, and it is the pharmacy.
I have never hated a pharmacy so tenderly.

Friday I walk to the sea. The sea does not text.
Nobody has ever been left on read by a wave.

Saturday I am tired in a new way,
the way a house is tired when the party is over
and only the music is still stubbornly on.

Sunday I put the phone in a drawer
and I do not feel braver. I feel lighter,
the way you do when you finally put down a bag
you forgot you were carrying.` },

  { slug: 'the-weight-of-a-small-town', title: 'The Weight of a Small Town', handle: 'tobi.nights', genre: 'fiction', kind: 'prose', template: 'newsprint', mood: 'forest-mist', date: '2026-08-30',
    blurb: 'Everybody knew what you carried before you did. Then you came home.', text: `
In Okwe, everybody knew what you carried before you did. The baker knew your mother's cough. The mechanic knew your father's debts. And Mrs. Ibe, who sold phone credit under a faded umbrella at the junction, knew when you were in love, usually a week before you admitted it to yourself.

I left at nineteen with one bag and a confidence I had not earned. The city was wonderfully indifferent. Nobody knew my name or my mother's cough or whether I had eaten. For eleven years I called that freedom.

Then my father died, and I came back on a bus that smelled of onions and rain, and the first person I saw at the junction was Mrs. Ibe. She did not say she was sorry. She pressed a small cold bottle of Fanta into my hand, the way she had when I was seven, and said, "You are thinner."

I cried there, in front of everyone, over a bottle of orange soda, and no one looked away. That is the weight of a small town. It is heavy only until you are tired enough to set something down, and find forty pairs of hands already open.` },

  { slug: 'ledger-of-rain', title: 'Ledger of Rain', handle: 'tobi.nights', genre: 'fiction', kind: 'prose', template: 'quiet-serif', mood: 'forest-mist', date: '2026-09-11',
    blurb: 'Thirty-one years of numbers, and one margin that finally got a remark.', text: `
Every morning at six, Mr. Adisa walked to the roof of the meteorological office, read the rain gauge, and wrote the number in the ledger. Four millimetres. Zero. Twelve. For thirty-one years the ledger did not once ask him how he was.

The week his wife left, it rained every day, and he wrote the numbers more carefully than ever, as though accuracy were a kind of prayer. Nobody noticed that the handwriting had begun to shake.

On the ninth day a girl from the secretary pool climbed the stairs with two cups of tea. She looked at the ledger, then at him, then at the sky. "It's seventeen millimetres," she said.

"I know," he said. "I've written it."

"No," she said gently. "I mean today it's seventeen, and you've been writing it down as though it's yours."

He laughed for the first time in a month, a rusty, startled sound. Then he took the pen, and in the margin, where the ledger kept its remarks, he wrote beside the number: Two cups of tea, shared.` },

  { slug: 'my-mother-in-the-market', title: 'My Mother in the Market', handle: 'sana.in.ink', genre: 'memoir', kind: 'prose', template: 'newsprint', mood: 'dark-abstract', photo: 0.9, date: '2026-08-21',
    blurb: 'She haggled the way other people pray.', text: `
My mother haggled the way other people pray: with total concentration and a faint look of disappointment in everyone present. On Saturdays I trailed behind her through the vegetable market in Karachi, learning the grammar of a bargain. First, the insult, delivered with love. Then the walk-away. Then the vendor's cry, half pain, half applause.

I was ten and ashamed. I wanted to pay the price on the sign and go home, like the people in the television advertisements.

"Why do you do that?" I asked once, in the rickshaw, tomatoes in my lap.

She looked at me for a long time. "Because he expects it," she said. "And because when I stop, he will think I have stopped seeing him."

It took me twenty years to understand that she was never bargaining for the tomatoes. Last month I stood in a supermarket in Toronto, reading a price I could not argue with, and felt something close to grief. I put the tomatoes in the basket. I said a small rude word to them, tenderly, in my mother's voice.` },

  { slug: 'what-the-ferry-knew', title: 'What the Ferry Knew', handle: 'sana.in.ink', genre: 'memoir', kind: 'prose', template: 'quiet-serif', mood: 'ocean-calm', date: '2026-09-08',
    blurb: 'Forty minutes a day, with strangers who asked for nothing.', text: `
For two years I took the 7:40 ferry across the bay, and for two years I told no one on it anything true. We nodded. We shared the weather. A man in a green raincoat held the door whenever I was late, which was often.

The winter my sister was sick I stopped sleeping, and one morning I simply sat down on the wet deck steps and did not go inside. The man in the green raincoat sat down beside me. He did not ask. He took a flask from his pocket, poured something hot into its lid, and handed it over, and we watched the city come toward us through the fog like a slow, lit-up animal.

We never spoke of it. Years later I saw him on a platform and he lifted two fingers, the way you greet a person who has been inside your worst morning with you.

The ferry knew everything about us. That is the secret of a good boat. It holds you for forty minutes and asks for nothing but that you arrive.` },

  { slug: 'the-cartographer-of-ash', title: 'The Cartographer of Ash', handle: 'lena.vale', genre: 'fantasy', kind: 'prose', template: 'poster', mood: 'dark-abstract', photo: 0.9, date: '2026-07-29',
    blurb: 'After the fire, a mapmaker draws a kingdom back into being.', text: `
After the fire took the Kingdom of Vael, a mapmaker named Isolde walked into the ruin with a pot of ink and no one to sell a map to. The roads were gone. The rivers had moved. The mountains, being proud, had only changed their minds about where to stand.

She drew anyway. She drew a bridge where a bridge had been, and the next morning the bridge was there, thin as a held breath, trembling over the dry bed of a stream. She drew a village, a lamp in its window, a dog asleep on a step, and by evening the dog had shaken itself awake and begun to bark at her.

The ash, it turned out, was only listening. It had been waiting for someone brave enough to say where things went.

Isolde mapped for forty days. On the last night she drew herself, small, at the edge of the page, and hesitated, her pen shaking above the empty paper.

Then, because every good map needs a place to come home to, she added a door.` },

  { slug: 'a-door-in-the-orchard', title: 'A Door in the Orchard', handle: 'lena.vale', genre: 'fantasy', kind: 'prose', template: 'quiet-serif', mood: 'forest-mist', date: '2026-09-15',
    blurb: 'A doorframe between two apple trees. Children are forbidden to walk through it.', text: `
In the orchard behind my grandfather's house there was a door that opened onto nothing. Just a doorframe, silvered with age, standing between the third and fourth apple trees. Children were forbidden to walk through it, which is the same as being invited.

I was eleven when I went through. Nothing happened, and that was the first magic: the grass on the other side was exactly the same green. It took me a week to notice that the apples on that side ripened a day earlier, and that the birds sang a half-note flatter, as if from further away.

Each day I went through, I was a little more of the other side. By midsummer my shadow had begun to arrive a few seconds after me.

My grandfather found me in the orchard that evening, watched my shadow catch up, and sighed. "Your grandmother did the same," he said. "She came back, in the end. She said it was only a matter of choosing which apples you wanted to taste first."` },

  { slug: 'the-house-keeps-counting', title: 'The House Keeps Counting', handle: 'noor.hollow', genre: 'horror', kind: 'prose', template: 'poster', mood: 'dark-abstract', photo: 0.92, date: '2026-10-01',
    blurb: 'It counted the windows, then the spoons, then the children.', text: `
We moved in on a Tuesday. On Wednesday I noticed the stairs had thirteen steps, and on Thursday they had twelve. I told myself I had miscounted. I am a person who tells herself things.

By the second week the number had stopped changing, but the house had begun to count other things. The windows, first, then the spoons in the drawer, then my children asleep in their beds, each night a soft, patient "one, two" from somewhere inside the walls, the way a shepherd counts at a gate.

Last night it got to three. I have two children.

I stood in the hallway in my socks, listening to the quiet arithmetic move from room to room. Then it reached the kitchen, where I was standing, and I understood with perfect calm that the house had not been counting what we had.

It had been counting what it was still missing. "Three," it said, kindly, from just behind my left shoulder, and a door that had never been there before began, very slowly, to open.` },

  { slug: 'do-not-answer-the-third-knock', title: 'Do Not Answer the Third Knock', handle: 'noor.hollow', genre: 'horror', kind: 'prose', template: 'newsprint', mood: 'dark-abstract', photo: 0.9, date: '2026-10-09',
    blurb: 'Grandma had rules for the village. The last one was the important one.', text: `
Grandma's rules for the village were simple. Never whistle after dark. Never step over a sleeping dog. And when someone knocks three times at night, answer the first, ignore the second, and never, ever answer the third.

"Why?" I asked her once.

"The first is the neighbour," she said, not looking up from her beads. "The second is the wind, wanting company. The third is whatever has learned how to knock like the neighbour."

Last night, in the city, in my own flat, someone knocked. I opened the door. Nobody. Then a second knock, softer, from inside the wardrobe: the wind, I told myself, though there is no wind in a wardrobe.

I have not slept. I am sitting on the kitchen floor with my back against the fridge, my grandmother's beads wound round my wrist, counting. It is the quietest I have ever heard a house.

And there, from the front door, patient and exactly in the voice of my own mother, comes the third.` },

  { slug: 'signal-from-kepler', title: 'Signal from Kepler', handle: 'kofi.quill', genre: 'sci-fi', kind: 'prose', template: 'poster', mood: 'neon-night', photo: 0.8, date: '2026-08-12',
    blurb: 'A pulse every eleven seconds, and a rhythm Abena already knew.', text: `
The message arrived in the middle of a Tuesday, which is how the biggest things always arrive. Dr. Abena Osei was eating cold jollof at her desk when the array in Chile flagged an anomaly in the data from Kepler-442b: a pulse, regular, every eleven seconds, for forty-one minutes.

She sent it to the team. Four of them wrote back "artefact." One wrote "oh," and nothing else.

Abena played the pulse through a pair of old headphones and realised what had been bothering her. It was not a code. It was a rhythm. A particular, familiar, human rhythm: the three-two clave her grandfather used to tap on the dashboard of his taxi.

Twelve hundred light years away, nobody could have heard it from us. Whatever was out there had arrived at the same heartbeat by itself. And it was not answering with mathematics, or warnings, or demands. It was simply keeping time, the way you do with a stranger at a party when a song comes on that you both love, and you tap along, and neither of you says a word.` },

  { slug: 'the-last-gardener-on-mars', title: 'The Last Gardener on Mars', handle: 'kofi.quill', genre: 'sci-fi', kind: 'prose', template: 'newsprint', mood: 'golden-hour', photo: 0.92, date: '2026-09-23',
    blurb: 'The supply ship is cancelled. The tomato, meanwhile, is ripe.', text: `
By Sol 1,847 the colony had stopped asking Imani why she wasted water on tomatoes. The hydroponics were enough. The ration packs were enough. But every evening, when the dust storms painted the dome orange, she walked the rows of the little greenhouse with a watering can older than the settlement, and talked to the plants.

Command called it morale. The children called it Imani's church. She called it nothing; it was only that she had grown up in Kumasi, where her grandmother greeted every tree by name, and she could not imagine a garden with nobody to say hello.

On Sol 1,848 the last supply ship was cancelled. On Sol 1,849 the first tomato ripened, red as a small, defiant heart.

Imani did not eat it. She carried it, with both hands, to the airlock where the children were pressed against the glass, watching the storm, and put it in the smallest hand she could find.

"Say thank you," she said.

"To whom?" the child asked.

Imani smiled. "Start with the tomato."` },

  { slug: 'the-clockmakers-alibi', title: "The Clockmaker's Alibi", handle: 'eli.fennick', genre: 'mystery', kind: 'prose', template: 'newsprint', mood: 'ocean-calm', date: '2026-08-04',
    blurb: 'Forty clocks, one that was right, and a witness who was not there.', text: `
At 9:14 p.m., according to every clock in the shop, Matthias Brandt was winding the grandfather clock in the window. At 9:14 p.m., according to the coroner, the landlord was dying in the room above. The two facts sat together like an unlit match and a barrel of oil.

Inspector Reyes had been in the shop for an hour. The clocks, forty of them, ticked at slightly different speeds, so that the room seemed to be whispering.

"You were here all evening," she said. "Every clock will tell you so."

"Every clock will tell you something," said Brandt, with a clockmaker's gentle melancholy.

She stopped in front of the grandfather clock. It was the only one in the room running perfectly on time, which is what bothered her. A man who loves clocks does not keep one honest and let thirty-nine drift.

"The clock says you were here," she said. "But it's the only one that's right. You corrected it tonight, Mr. Brandt, and a man doesn't correct a clock for himself. He corrects it for a witness."` },

  { slug: 'missing-in-plain-sight', title: 'Missing in Plain Sight', handle: 'eli.fennick', genre: 'mystery', kind: 'prose', template: 'quiet-serif', mood: 'forest-mist', date: '2026-09-30',
    blurb: 'The painting was never stolen. It was just replaced, and the sky knew.', text: `
The painting had not been stolen. That was the part the museum could not forgive. Nobody had cut it from its frame, or smashed a case, or cut a wire. At closing time the Dutch landscape was on the third-floor wall. At opening time a different Dutch landscape was, and no one had told the paint.

It took the night guard, an old man named Folarin who had counted the same wall for twenty years, to notice the sky.

"The clouds are wrong," he said. "They were hurrying. Now they're just standing about."

The curator laughed, then stopped. The forger had been brilliant: the brushwork, the varnish, the cracks. What he had not understood, because he had never stood in front of it at four in the morning, as Folarin had, was that the original had a small, private weather, a storm that was always about to break and never did.

The copy had only ever been told what the sky looked like. The old man knew what it felt like.` },

  { slug: 'psalm-for-a-tired-heart', title: 'Psalm for a Tired Heart', handle: 'ngozi.afterdark', genre: 'faith', kind: 'verse', template: 'handwritten', mood: 'ocean-calm', date: '2026-08-17',
    blurb: 'A prayer for the places nobody sees.', text: `
Lord, I am tired in the places
nobody sees. The soles of my prayers
are worn through. I have walked
this same circle of asking so many times
that the grass has gone.

You do not require me to be grand.
You do not need me to arrive
with my arguments in order,
my hands clean, my voice steady.

Let me come as I am today:
a woman with a kettle and a long week,
a sentence left unfinished,
a window that wants opening.

And if the answer is only morning,
if the answer is only the small bird
on the wire doing his ordinary work,
let that be enough. Let that be

a table in the wilderness.
Let that be a hand.
Let me lay down my heavy
and be, for one slow breath, carried.` },

  { slug: 'what-the-rooster-taught-me', title: 'What the Rooster Taught Me', handle: 'ngozi.afterdark', genre: 'faith', kind: 'prose', template: 'quiet-serif', mood: 'golden-hour', photo: 0.92, date: '2026-09-04',
    blurb: 'He crowed into the dark with no evidence at all.', text: `
My uncle kept a rooster named Pastor, who woke the whole compound at four every morning, regardless of the weather, the hour, or our feelings on the matter. I hated him with the pure, uncomplicated hatred of a teenager denied sleep.

Years later, in a season when nothing was working, a friend asked me what I was waiting for before I began again. I said I was waiting for it to be light. And I thought of Pastor.

The rooster does not wait for the sun. He crows into the dark, with no evidence whatsoever, because he knows something the dark has not been told: that morning is already on its way.

I have begun to think faith is mostly that. Not certainty. Not even hope in the large and shining sense. Just a stubborn, ordinary voice, lifted at four a.m., declaring to the unlit yard that this, too, will turn.

I still do not forgive him for the sleep. But I have forgiven him for everything else.` },

  { slug: 'the-summer-i-learned-to-swim', title: 'The Summer I Learned to Swim', handle: 'jun.hartley', genre: 'young-adult', kind: 'prose', template: 'quiet-serif', mood: 'ocean-calm', date: '2026-08-26',
    blurb: 'Everyone in the family could swim. Except her.', text: `
Everyone in my family could swim except me. My cousins launched themselves off the dock like cannonballs with opinions. My dad could float for an hour, hands folded behind his head, like a man resting on an invisible couch. I stood at the edge in my too-big goggles and negotiated with the lake.

That summer, the new girl next door, Mai, offered to teach me, and I said yes before my fear could speak. She did not tell me it was easy.

"It's not about being brave," she said. "It's about letting the water hold you. It's very, very rude of you not to trust it."

The first time my feet left the bottom, I screamed. The second time, I laughed. By August I could cross the shallow end, and on the last night of the holidays I was floating on my back, ears under, listening to the lake hum like a refrigerator the size of the world.

I could see Mai's shape on the dock against the first stars. For one second I understood that being held by something does not mean you have stopped being yourself.` },

  { slug: 'the-girl-who-sat-alone-at-lunch', title: 'The Girl Who Sat Alone at Lunch', handle: 'jun.hartley', genre: 'young-adult', kind: 'prose', template: 'poster', mood: 'forest-mist', date: '2026-10-07',
    blurb: 'Being alone is only a waiting room.', text: `
Day one at the new school, I ate my sandwich in the library bathroom stall, like a spy who had lost the plot. Day two, I tried the bench by the football field and was nearly knocked out by a ball and a boy shouting "sorry!" in a voice that sounded suspiciously like "serves you right."

On day three I found the empty music room on the third floor, and a piano with a sticky E. I played for the whole lunch with the sandwich propped on top.

The next day I heard someone breathing at the door. A girl with a clarinet case and enormous earrings.

"You're doing the second bar wrong," she said.

"Come in," I said.

Nobody tells you that being alone is only a waiting room. That the day comes when someone opens the door and says you're doing the second bar wrong, and it's the nicest thing anyone has said to you all term.` },

  { slug: 'on-being-late-to-everything', title: 'On Being Late to Everything', handle: 'bea.lindqvist', genre: 'humour', kind: 'prose', template: 'poster', mood: 'golden-hour', photo: 0.92, date: '2026-07-18',
    blurb: 'Two weeks late to her own birth, and still not sorry.', text: `
I have been late to my own birth (two weeks), my own wedding (forty minutes, a record I am proud of), and the funeral of a clock, which is the sort of irony the universe pays for in cash.

People say, "Just leave earlier." I want to meet these people and ask them how. Leaving earlier is not a plan. It is a rumour. The truth is that time and I have an arrangement in which it takes the shape of a long corridor, and I stop to admire every door. Did you know that a drawer can be organised? I did not, until 8:14 this morning.

Last week I finally arrived early to a dentist appointment, and I sat in the waiting room in a daze of unfamiliar virtue. I looked at the other patients. They were all calm. They had all, I realised, done this before. I felt like a tourist in the country of the punctual.

A woman smiled at me. I wanted to ask her how the weather was in the future, but my name was called, and I was, as usual, in the middle of something.` },

  { slug: 'the-group-chat-has-gone-quiet', title: 'The Group Chat Has Gone Quiet', handle: 'bea.lindqvist', genre: 'humour', kind: 'prose', template: 'newsprint', mood: 'dark-abstract', photo: 0.9, date: '2026-09-25',
    blurb: 'A missing-persons report, filed at 8 a.m.', text: `
At 7:02 a.m. the group chat, which has a name I am not allowed to repeat, is silent. This has not happened since 2019, when someone was foolish enough to ask whether pineapple belongs on pizza and four people had to be physically separated.

At 7:15 I send a tentative "hello?" Nothing. At 7:30 I send a photograph of my breakfast, which in this chat is a legally binding invitation to discourse. Nothing. By eight o'clock I have drafted three versions of a missing-persons announcement and eaten the bread I was saving for later.

At 8:20 a message appears from Chidi. It simply says: "we're all in the other chat."

I stare at the phone. There is an other chat. There has always been an other chat. And somewhere in it, I now understand, a woman named Tola is describing my breakfast to everybody.

I type "who made the other chat" and hover over the send button, and feel, for the first time since primary school, entirely and magnificently unchosen.` },

  { slug: 'in-praise-of-slow-mornings', title: 'In Praise of Slow Mornings', handle: 'dami.reads', genre: 'essays', kind: 'prose', template: 'quiet-serif', mood: 'golden-hour', photo: 0.92, date: '2026-08-08',
    blurb: 'An hour defended like a small, ridiculous country.', text: `
There is a particular kind of hour, somewhere between waking and being useful, that I have come to defend like a small, ridiculous country. It has one law: nothing is allowed to be accomplished.

For years I treated mornings as a launch window. I rose, I optimised, I answered. The day arrived pre-packaged with demands, and I marched through them like a person assembling furniture in the dark. I was efficient, and I was nobody.

Now I make tea in the same chipped cup. I stand at the window and watch the neighbour's lemon tree do absolutely nothing, magnificently. I let the first thought arrive and sit down, uninvited, like a cat, before I decide whether I want it on my lap.

This is not laziness. It is a kind of tuning. You cannot play an instrument you have not listened to. The slow hour is where I find out what key I am in today. And only then, humming, do I open the door.` },

  { slug: 'what-we-keep-in-drawers', title: 'What We Keep in Drawers', handle: 'dami.reads', genre: 'essays', kind: 'prose', template: 'newsprint', mood: 'forest-mist', date: '2026-09-17',
    blurb: 'A diary written by objects.', text: `
Every house has a drawer. The one by the kitchen door, where everything unclassifiable goes to wait: a stamp, a key to nothing, three dead batteries, a recipe for a cake nobody remembers eating, a button that was clearly important to someone, once.

I have started to think of the drawer as a diary written by objects. When my father died I opened his, and found forty years of small decisions: spare fuses (he was a cautious man), a photograph of a goat (he was not), and a note in his handwriting that said only: Ask Dami about the tap.

I still do not know what the tap was, or what I was meant to say. But I read that note aloud, in the empty kitchen, and the house seemed to lean in to listen.

We are all, in the end, a drawer. A little untidy, mostly harmless, holding on to things in case they turn out to be necessary. The tap, I have decided, was him, still keeping an eye on the house.` },
];
