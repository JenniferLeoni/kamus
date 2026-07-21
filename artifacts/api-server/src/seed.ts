import { connectMongo } from "./lib/mongodb";
import { Vocab } from "./models/vocab";
import { Kanji } from "./models/kanji";
import { logger } from "./lib/logger";

const mockVocab = [
  // Section 1, Chapter 1 — N5 basics
  {
    word: "食べる",
    reading: "たべる",
    romaji: "taberu",
    meaning: "to eat",
    type: "verb",
    level: "N5" as const,
    section: 1,
    chapter: 1,
    example_sentences: [
      { japanese: "毎日ご飯を食べます。", romaji: "Mainichi gohan o tabemasu.", english: "I eat rice every day." },
      { japanese: "寿司を食べたいです。", romaji: "Sushi o tabetai desu.", english: "I want to eat sushi." },
    ],
    grammar_examples: [
      { grammar: "-tai", sentence: "寿司を食べたいです。", romaji: "Sushi o tabetai desu.", english: "I want to eat sushi." },
      { grammar: "-nai", sentence: "野菜を食べない子どもがいます。", romaji: "Yasai o tabenai kodomo ga imasu.", english: "There are children who don't eat vegetables." },
      { grammar: "-te kudasai", sentence: "全部食べてください。", romaji: "Zenbu tabete kudasai.", english: "Please eat everything." },
      { grammar: "-koto ga dekiru", sentence: "何でも食べることができます。", romaji: "Nandemo taberu koto ga dekimasu.", english: "I can eat anything." },
    ],
  },
  {
    word: "飲む",
    reading: "のむ",
    romaji: "nomu",
    meaning: "to drink",
    type: "verb",
    level: "N5" as const,
    section: 1,
    chapter: 1,
    example_sentences: [
      { japanese: "水を飲みます。", romaji: "Mizu o nomimasu.", english: "I drink water." },
      { japanese: "薬を飲んでください。", romaji: "Kusuri o nonde kudasai.", english: "Please take the medicine." },
    ],
    grammar_examples: [
      { grammar: "-tai", sentence: "コーヒーを飲みたいです。", romaji: "Koohii o nomitai desu.", english: "I want to drink coffee." },
      { grammar: "-nai", sentence: "お酒を飲まない人です。", romaji: "Osake o nomanai hito desu.", english: "I am a person who doesn't drink alcohol." },
      { grammar: "-te kudasai", sentence: "薬を飲んでください。", romaji: "Kusuri o nonde kudasai.", english: "Please take the medicine." },
    ],
  },
  {
    word: "行く",
    reading: "いく",
    romaji: "iku",
    meaning: "to go",
    type: "verb",
    level: "N5" as const,
    section: 1,
    chapter: 1,
    example_sentences: [
      { japanese: "学校に行きます。", romaji: "Gakkou ni ikimasu.", english: "I go to school." },
      { japanese: "どこへ行きますか？", romaji: "Doko e ikimasu ka?", english: "Where are you going?" },
    ],
    grammar_examples: [
      { grammar: "-tai", sentence: "日本に行きたいです。", romaji: "Nihon ni ikitai desu.", english: "I want to go to Japan." },
      { grammar: "-nai", sentence: "今日は学校に行かない。", romaji: "Kyou wa gakkou ni ikanai.", english: "I'm not going to school today." },
      { grammar: "-nagara", sentence: "音楽を聞きながら歩いていきます。", romaji: "Ongaku o kikinagara aruite ikimasu.", english: "I walk while listening to music." },
    ],
  },
  {
    word: "来る",
    reading: "くる",
    romaji: "kuru",
    meaning: "to come",
    type: "verb",
    level: "N5" as const,
    section: 1,
    chapter: 2,
    example_sentences: [
      { japanese: "友達が家に来ます。", romaji: "Tomodachi ga ie ni kimasu.", english: "My friend is coming to my house." },
      { japanese: "何時に来ますか？", romaji: "Nanji ni kimasu ka?", english: "What time will you come?" },
    ],
    grammar_examples: [
      { grammar: "-te kudasai", sentence: "早く来てください。", romaji: "Hayaku kite kudasai.", english: "Please come quickly." },
      { grammar: "-nai", sentence: "今日は来ない予定です。", romaji: "Kyou wa konai yotei desu.", english: "I'm not planning to come today." },
    ],
  },
  {
    word: "見る",
    reading: "みる",
    romaji: "miru",
    meaning: "to see, to watch, to look",
    type: "verb",
    level: "N5" as const,
    section: 1,
    chapter: 2,
    example_sentences: [
      { japanese: "テレビを見ます。", romaji: "Terebi o mimasu.", english: "I watch TV." },
      { japanese: "あの映画を見ましたか？", romaji: "Ano eiga o mimashita ka?", english: "Did you watch that movie?" },
    ],
    grammar_examples: [
      { grammar: "-tai", sentence: "その映画を見たいです。", romaji: "Sono eiga o mitai desu.", english: "I want to watch that movie." },
      { grammar: "-te kudasai", sentence: "黒板を見てください。", romaji: "Kokuban o mite kudasai.", english: "Please look at the blackboard." },
      { grammar: "-koto ga dekiru", sentence: "ここから富士山を見ることができます。", romaji: "Koko kara Fujisan o miru koto ga dekimasu.", english: "You can see Mt. Fuji from here." },
    ],
  },
  {
    word: "大きい",
    reading: "おおきい",
    romaji: "ookii",
    meaning: "big, large",
    type: "adjective",
    level: "N5" as const,
    section: 1,
    chapter: 2,
    example_sentences: [
      { japanese: "この犬は大きいです。", romaji: "Kono inu wa ookii desu.", english: "This dog is big." },
      { japanese: "大きい声で話してください。", romaji: "Ookii koe de hanashite kudasai.", english: "Please speak in a loud voice." },
    ],
    grammar_examples: [],
  },
  {
    word: "美味しい",
    reading: "おいしい",
    romaji: "oishii",
    meaning: "delicious, tasty",
    type: "adjective",
    level: "N5" as const,
    section: 1,
    chapter: 3,
    example_sentences: [
      { japanese: "このラーメンは美味しいです。", romaji: "Kono raamen wa oishii desu.", english: "This ramen is delicious." },
      { japanese: "日本料理は美味しい。", romaji: "Nihon ryouri wa oishii.", english: "Japanese cuisine is delicious." },
    ],
    grammar_examples: [],
  },
  {
    word: "学生",
    reading: "がくせい",
    romaji: "gakusei",
    meaning: "student",
    type: "noun",
    level: "N5" as const,
    section: 1,
    chapter: 3,
    example_sentences: [
      { japanese: "私は学生です。", romaji: "Watashi wa gakusei desu.", english: "I am a student." },
      { japanese: "学生は勉強します。", romaji: "Gakusei wa benkyou shimasu.", english: "Students study." },
    ],
    grammar_examples: [],
  },
  // Section 2, Chapter 4 — N4
  {
    word: "覚える",
    reading: "おぼえる",
    romaji: "oboeru",
    meaning: "to memorize, to remember",
    type: "verb",
    level: "N4" as const,
    section: 2,
    chapter: 4,
    example_sentences: [
      { japanese: "単語を覚えます。", romaji: "Tango o oboemasu.", english: "I memorize vocabulary." },
      { japanese: "この漢字を覚えてください。", romaji: "Kono kanji o oboete kudasai.", english: "Please memorize this kanji." },
    ],
    grammar_examples: [
      { grammar: "-tai", sentence: "全部の漢字を覚えたいです。", romaji: "Zenbu no kanji o oboetai desu.", english: "I want to memorize all the kanji." },
      { grammar: "-nai", sentence: "彼は名前を覚えない。", romaji: "Kare wa namae o oboenai.", english: "He doesn't remember names." },
    ],
  },
  {
    word: "練習",
    reading: "れんしゅう",
    romaji: "renshuu",
    meaning: "practice, exercise",
    type: "noun",
    level: "N4" as const,
    section: 2,
    chapter: 4,
    example_sentences: [
      { japanese: "毎日練習します。", romaji: "Mainichi renshuu shimasu.", english: "I practice every day." },
      { japanese: "練習は大事です。", romaji: "Renshuu wa daiji desu.", english: "Practice is important." },
    ],
    grammar_examples: [],
  },
  {
    word: "難しい",
    reading: "むずかしい",
    romaji: "muzukashii",
    meaning: "difficult, hard",
    type: "adjective",
    level: "N4" as const,
    section: 2,
    chapter: 5,
    example_sentences: [
      { japanese: "この問題は難しいです。", romaji: "Kono mondai wa muzukashii desu.", english: "This problem is difficult." },
      { japanese: "日本語は難しいですが、面白いです。", romaji: "Nihongo wa muzukashii desu ga, omoshiroi desu.", english: "Japanese is difficult but interesting." },
    ],
    grammar_examples: [],
  },
  {
    word: "薬",
    reading: "くすり",
    romaji: "kusuri",
    meaning: "medicine, drug",
    type: "noun",
    level: "N4" as const,
    section: 2,
    chapter: 5,
    example_sentences: [
      { japanese: "薬を飲んでください。", romaji: "Kusuri o nonde kudasai.", english: "Please take the medicine." },
      { japanese: "この薬は効きます。", romaji: "Kono kusuri wa kikimasu.", english: "This medicine is effective." },
    ],
    grammar_examples: [],
  },
  // Section 3, Chapter 6 — N3
  {
    word: "経験",
    reading: "けいけん",
    romaji: "keiken",
    meaning: "experience",
    type: "noun",
    level: "N3" as const,
    section: 3,
    chapter: 6,
    example_sentences: [
      { japanese: "良い経験になりました。", romaji: "Yoi keiken ni narimashita.", english: "It became a good experience." },
      { japanese: "経験が大切です。", romaji: "Keiken ga taisetsu desu.", english: "Experience is important." },
    ],
    grammar_examples: [],
  },
  {
    word: "考える",
    reading: "かんがえる",
    romaji: "kangaeru",
    meaning: "to think, to consider",
    type: "verb",
    level: "N3" as const,
    section: 3,
    chapter: 6,
    example_sentences: [
      { japanese: "よく考えてから決めます。", romaji: "Yoku kangaete kara kimemasu.", english: "I decide after thinking carefully." },
    ],
    grammar_examples: [
      { grammar: "-nagara", sentence: "散歩しながら考えます。", romaji: "Sanpo shinagara kangaemasu.", english: "I think while taking a walk." },
      { grammar: "-koto ga dekiru", sentence: "もっとうまく考えることができます。", romaji: "Motto umaku kangaeru koto ga dekimasu.", english: "I can think more cleverly." },
    ],
  },
];

const mockKanji = [
  {
    character: "日",
    on_readings: ["ニチ", "ジツ"],
    kun_readings: ["ひ", "か"],
    meanings: ["sun", "day"],
    strokes: 4,
    level: "N5" as const,
    section: 1,
    chapter: 1,
    examples: [
      { word: "日本", reading: "にほん", meaning: "Japan" },
      { word: "毎日", reading: "まいにち", meaning: "every day" },
      { word: "日曜日", reading: "にちようび", meaning: "Sunday" },
    ],
  },
  {
    character: "月",
    on_readings: ["ゲツ", "ガツ"],
    kun_readings: ["つき"],
    meanings: ["moon", "month"],
    strokes: 4,
    level: "N5" as const,
    section: 1,
    chapter: 1,
    examples: [
      { word: "月曜日", reading: "げつようび", meaning: "Monday" },
      { word: "来月", reading: "らいげつ", meaning: "next month" },
    ],
  },
  {
    character: "山",
    on_readings: ["サン"],
    kun_readings: ["やま"],
    meanings: ["mountain"],
    strokes: 3,
    level: "N5" as const,
    section: 1,
    chapter: 1,
    examples: [
      { word: "富士山", reading: "ふじさん", meaning: "Mt. Fuji" },
      { word: "山田", reading: "やまだ", meaning: "Yamada (surname)" },
    ],
  },
  {
    character: "水",
    on_readings: ["スイ"],
    kun_readings: ["みず"],
    meanings: ["water"],
    strokes: 4,
    level: "N5" as const,
    section: 1,
    chapter: 2,
    examples: [
      { word: "水曜日", reading: "すいようび", meaning: "Wednesday" },
      { word: "水泳", reading: "すいえい", meaning: "swimming" },
    ],
  },
  {
    character: "火",
    on_readings: ["カ"],
    kun_readings: ["ひ"],
    meanings: ["fire"],
    strokes: 4,
    level: "N5" as const,
    section: 1,
    chapter: 2,
    examples: [
      { word: "火曜日", reading: "かようび", meaning: "Tuesday" },
      { word: "花火", reading: "はなび", meaning: "fireworks" },
    ],
  },
  {
    character: "人",
    on_readings: ["ジン", "ニン"],
    kun_readings: ["ひと"],
    meanings: ["person", "people"],
    strokes: 2,
    level: "N5" as const,
    section: 1,
    chapter: 2,
    examples: [
      { word: "日本人", reading: "にほんじん", meaning: "Japanese person" },
      { word: "人気", reading: "にんき", meaning: "popularity" },
    ],
  },
  {
    character: "食",
    on_readings: ["ショク", "ジキ"],
    kun_readings: ["た.べる", "く.う"],
    meanings: ["eat", "food", "meal"],
    strokes: 9,
    level: "N5" as const,
    section: 1,
    chapter: 3,
    examples: [
      { word: "食べ物", reading: "たべもの", meaning: "food" },
      { word: "食堂", reading: "しょくどう", meaning: "cafeteria" },
      { word: "朝食", reading: "ちょうしょく", meaning: "breakfast" },
    ],
  },
  {
    character: "語",
    on_readings: ["ゴ"],
    kun_readings: ["かた.る"],
    meanings: ["language", "word", "to speak"],
    strokes: 14,
    level: "N4" as const,
    section: 2,
    chapter: 4,
    examples: [
      { word: "日本語", reading: "にほんご", meaning: "Japanese language" },
      { word: "英語", reading: "えいご", meaning: "English language" },
      { word: "語学", reading: "ごがく", meaning: "language study" },
    ],
  },
  {
    character: "学",
    on_readings: ["ガク"],
    kun_readings: ["まな.ぶ"],
    meanings: ["study", "learning", "school"],
    strokes: 8,
    level: "N5" as const,
    section: 2,
    chapter: 4,
    examples: [
      { word: "学校", reading: "がっこう", meaning: "school" },
      { word: "大学", reading: "だいがく", meaning: "university" },
      { word: "学生", reading: "がくせい", meaning: "student" },
    ],
  },
  {
    character: "薬",
    on_readings: ["ヤク"],
    kun_readings: ["くすり"],
    meanings: ["medicine", "drug"],
    strokes: 16,
    level: "N4" as const,
    section: 2,
    chapter: 5,
    examples: [
      { word: "薬局", reading: "やっきょく", meaning: "pharmacy" },
      { word: "薬品", reading: "やくひん", meaning: "chemical, drug" },
    ],
  },
];

async function seed() {
  await connectMongo();

  const existingVocab = await Vocab.countDocuments();
  const existingKanji = await Kanji.countDocuments();

  if (existingVocab === 0) {
    await Vocab.insertMany(mockVocab);
    logger.info({ count: mockVocab.length }, "Seeded vocab");
  } else {
    logger.info({ count: existingVocab }, "Vocab already seeded, skipping");
  }

  if (existingKanji === 0) {
    // Insert one by one to handle unique constraint on character gracefully
    for (const k of mockKanji) {
      await Kanji.findOneAndUpdate({ character: k.character }, k, {
        upsert: true,
        new: true,
      });
    }
    logger.info({ count: mockKanji.length }, "Seeded kanji");
  } else {
    logger.info({ count: existingKanji }, "Kanji already seeded, skipping");
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
