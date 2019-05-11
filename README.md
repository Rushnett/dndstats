# DnD discordjs stats bot
DnD stats discordjs bot that allows you to display your character info from your DnD 5e character sheet directly in discord. It also allows you to perform different types of rolls based off those stats. I am not a DnD expert, and this bot was tailored for my beginner group. Some interpretations may be wrong because of that.

## Getting Started
### Setup
After cloning the repository, the only setup involved is creating a `config.json` file. The following is an example of how the file needs to look:
```
{
  "token": "token here",
  "prefix": "!dnd",
  "roll": "!r",
  "109645955911560922": {
    "pdf": "chars/naeris_altair.pdf"
  },
  "125090401121073869": {
    "pdf": "https://example.website/Ivor.pdf"
  }
}
```
**token:** the discord bot token you get from your discord [developer portal](https://discordapp.com/developers/applications/).

**prefix:** the prefix for the stats command. Using it will display your character stats. You can also mention other users (!dnd @Rushnett) who also have a character.

**roll:** the prefix for any dice roll commands (ex: !r attack 1).

Below these are the IDs of users who have a character sheet. `pdf` option within that is the path to the pdf. It supports local files and files over https. You can create as many users here as you want. Just be sure to follow the format.

### Running the Project
Use `npm install` to download dependencies. You can run the bot from `dnd.js`.

## Commands
- prefix (!dnd)
   - !dnd: displays your character stats.
   - !dnd @mention: displays the target's character stats.

- roll (!r)
   - !r #d#: rolls a number of dice ranging from 1 to a defined number. For example, 2d20 rolls two dice of 20 sides each.
   - !r init: rolls for initiative. Currently is 1d20 + initiative.
   - !r attack <weapon #>: rolls for damage on a weapon from your three weapon slots. For example, to roll for your first weapon slot, do !r attack 1.


## Notes
You can download the character sheet that works with this bot [here](https://rushnett.com/files/DD_Character_Sheet_5th_Edition_Fillable_1.pdf). You can find an example character sheet the code was tailored to [here](https://rushnett.com/files/naeris_altair.pdf).

Damage/type slot for weapons support many formats. You can type something like `1d8 pierce` or even `1d6+3+2 pierce`.

If you're getting `TypeError: Cannot read property 'V' of undefined` in discord, you may be using the wrong character sheet. Use the one listed above. Be sure to also save it so that the fields are still editable (something like adobe acrobat does the trick).

This bot was meant to make it more intuitive to do certain rolls within my personal group. It's not technically meant for production, but a bit of work was put into it so I wanted to share.

## License
This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details.
