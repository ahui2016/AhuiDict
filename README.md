# AhuiDict

A vocabulary book for Japanese, Chinese and English.


### 2016/10/11 (v0.2.1) ###

  - New feature: Add an `assist` field. This is a hidden field, and is automatically used when searching not exactly. By now, it is only used for Japanese.
    * When adding a Japanese word, an _assist-phrase_ will be added to the `assist` field automatically.
    * If a Japanese word has Kanji and Hiragana characters, an _assist-phrase_ will be created, which remains all Kanji characters but trims all Hiragana charcters out. (e.g. `締め付け` -> `締付`)
    * If a Japanese word has only Katakana charcters, an _assist-phrase_ will be created, which is changed into Hiragana characters and trims out all punctuation marks. (e.g. `シリンダー` -> `しりんだ`)
  - New feature: When adding a Japanese word which has halfwidth characters, they will be changed into fullwidth characters before adding to the database. And also, when searching, all characters will be changed into fullwidth first. (e.g. `ｼﾘﾝﾀﾞｰ` -> `シリンダー`)
  - New feature: When using _Begin-with_, _End-with_ or _Contain_ mode
    * Ignore case automatically.
    * Not only search with the original pattern (e.g. `締め付け`, `シリンダー`), and also search with the assist pattern too (e.g. `締付`, `しりんだ`).

### 2016/09/25 (v0.2.0 beta) ###


  - It's the first beta version, all basic functionalities are finished.
  - Every word is clickable, when clicked, show a `copy` button and a `delete` button.
  - Can add tags to an entry.
  - Can add images to an entry.
  - Many functionalities like _Delete Entry_, _Update Notes_, _Add Photos_, are hidden by default, thus it has a clear and simple interface. Click the `Edit` button to show these functionalities.
  - There are five categories: JP, CN, EN, Tags and Notes. User can choose one category or multiple categories to search.
  - There are five search modes: Excatly, Begin-with, End-with, Contain and Regular Expression.
