const Discord = require('discord.js')
const client = new Discord.Client()
const https = require('https')
let fs = require('fs'),
  PDFParser = require('pdf2json')

// load config
try {
  settings = require('./config.json')
} catch (e) {
  console.log(`a config.json file has not been generated. ${e.stack}`)
  process.exit()
}

// create chars/
const dir = './chars'
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

function login () {
  if (settings.token) {
    console.log('Logging in with token...')
    client.login(settings.token)
  } else {
    console.log('Error logging in: There may be an issue with you config.json file')
  }
}

// getFile (character object, callback)
function getFile (char, cb) {
  // if file online
  if (char.pdf.startsWith('http')) {
    https.get(char.pdf)
      .on('response', function (res) {
        console.log('loading file: ' + char.pdf)
        var chunks = []
        res.on('data', function (data) {
          chunks.push(data)
        })
        res.on('end', function () {
          var file = Buffer.concat(chunks)
          cb(null, file)
        })

      })
      .on('error', function (err) {
        cb(err)
      })
  // if file local
  } else {
    fs.readFile(char.pdf, function (err, data) {
      if (err) cb(err)
      cb(null, data)
    })
  }
}

// loadCharacter (msg object, embed, character obj, roll type)
function loadCharacter (msg, sentEmbed, char, rollType = null) {
  getFile(char, function (err, file) {
    const linkList = char.pdf.split('/')
    const fileName = linkList[linkList.length-1].split('.')[0]
    // download pdf
    fs.writeFile(`${dir}/${fileName}.pdf`, file, err => {
      if (err) return console.log(err)

      console.log(`loaded file: ${dir}/${fileName}.pdf`)
      let pdfParser = new PDFParser()
      pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError))
      // pdf is loaded
      pdfParser.on('pdfParser_dataReady', pdfData => {
        const linkList = char.pdf.split('/')
        const fileName = linkList[linkList.length-1].split('.')[0]
        // write pdf to json
        fs.writeFile(`${dir}/${fileName}.json`, JSON.stringify(pdfData), () => {
          console.log(`processed json: ${dir}/${fileName}.json`)
        })
        // process character json
        processCharacter(msg, sentEmbed, pdfData, rollType).catch(err => {
          const embed = new Discord.RichEmbed()
            .setAuthor(err)
            .setColor(0xE74C3C)
          sentEmbed.edit({embed})
        })
      })
      // load pdf
      pdfParser.loadPDF(`${dir}/${fileName}.pdf`)
    })
  })
}

// processCharacter (msg object, embed, form data, roll type)
const processCharacter = (msg, sentEmbed, data, rollType) => {
  return new Promise((resolve, reject) => {
    const page1 = data.formImage.Pages['0']
    let stats = {
      'name': page1.Fields['3'].V,
      'class': page1.Fields['0'].V,
      'background': page1.Fields['1'].V,
      'race': page1.Fields['4'].V,
      'alignment': page1.Fields['5'].V,
      'proficiency': page1.Fields['9'].V,
      'armor': page1.Fields['10'].V,
      'initiative': page1.Fields['11'].V,
      'hp': page1.Fields['12'].V,
      'stats': {
        'strength': `${page1.Fields['8'].V} [${page1.Fields['14'].V}]`,
        'dexterity': `${page1.Fields['16'].V} [${page1.Fields['18'].V}]`,
        'constitution': `${page1.Fields['20'].V} [${page1.Fields['22'].V}]`,
        'intelligence': `${page1.Fields['25'].V} [${page1.Fields['45'].V}]`,
        'wisdom': `${page1.Fields['48'].V} [${page1.Fields['51'].V}]`,
        'charisma': `${page1.Fields['52'].V} [${data.formImage.Pages['0'].Fields['64'].V}]`
      },
      'traits': {
        'personality': null
      }

    }
    let className = `**Class:** ${stats.class}`
    let background = `**Background:** ${stats.background}`
    let race = `**Race:** ${stats.race}`
    let alignment = `**Alignment:** ${stats.alignment}`
    let proficiency = `**Proficiency:** ${stats.proficiency}`
    let armor = `**Armor:** ${stats.armor}`
    let initiative = `**Initiative:** ${stats.initiative}`
    let hp = `**HP:** ${stats.hp}`
    let strength = `**Strength:** ${stats.stats.strength}`
    let dexterity = `**Dexterity:** ${stats.stats.dexterity}`
    let constitution = `**Constitution:** ${stats.stats.constitution}`
    let intelligence = `**Intelligence:** ${stats.stats.intelligence}`
    let wisdom = `**Wisdom:** ${stats.stats.wisdom}`
    let charisma = `**Charisma:** ${stats.stats.charisma}`

    // roll?
    if (rollType) {
      roll(sentEmbed, data, stats, rollType).catch(err => {
        const embed = new Discord.RichEmbed()
          .setAuthor(err)
          .setColor(0xE74C3C)
        sentEmbed.edit({embed})
      })
    } else {
      const embed = new Discord.RichEmbed()
        .setAuthor(stats.name)
        .addField('Summary', `${className}\n${background}\n${race}\n${alignment}\n`, false)
        .addField('Stats', `${strength}\n${dexterity}\n${constitution}\n${intelligence}\n${wisdom}\n${charisma}`, false)
        .setColor(0xb19cd9)
        .setImage('')
      sentEmbed.edit({embed})
    }
  })
}

// get random int
function randomIntInc (low, high) {
  return Math.floor(Math.random() * (high - low + 1) + low)
}

// roll (embed, form data, character obj data, roll type)
const roll = (sentEmbed, data=null, stats=null, rollType) => {
  return new Promise((resolve, reject) => {
    const page1 = data.formImage.Pages['0']

    // initiative
    if (rollType[1].toLowerCase().includes('init')) {
      if (!stats) reject('You do not have a character :(')
      let randInt = randomIntInc(1, 20)
      let rolledVal = randInt + parseInt(stats.initiative)
      const embed = new Discord.RichEmbed()
        .setAuthor(`${stats.name} rolled a ${rolledVal}!`)
        .setDescription(`Roll: ${randInt}\nInitiative: ${rolledVal - randInt}`)
        .setColor(0xb19cd9)
        .setImage('')
      sentEmbed.edit({embed})
      return
    }

    // weapon roll
    if (rollType[1].toLowerCase().includes('attack')) {
      if (!stats) reject('You do not have a character!')
      // weapon 1 === name ["36"] || bonus ["37"] || damage ["38"]
      // weapon 2 === name ["41"] || bonus ["42"] || damage ["46"]
      // weapon 3 === name ["43"] || bonus ["44"] || damage ["62"]
      let reg = /(\d+)\s*[D|d](\d+)(\+\d+)?(\+\d+)?\s*?(.*)/g
      let name, bonus, damage, match
      if (rollType[2] == 1) {
        name = page1.Fields['36'].V
        bonus = page1.Fields['37'].V
        dmg = page1.Fields['38'].V
        match = reg.exec(dmg)

      } else if (rollType[2] == 2) {
        name = page1.Fields['41'].V
        bonus = page1.Fields['42'].V
        dmg = page1.Fields['46'].V
        match = reg.exec(dmg)

      } else if (rollType[2] == 3) {
        name = page1.Fields['43'].V
        bonus = page1.Fields['44'].V
        dmg = page1.Fields['62'].V
        match = reg.exec(dmg)
      }

      // no weapon error
      if (!match) reject('You do not have a weapon in that slot!')

      // calculate
      let total = 0
      let desc = ''
      if (match[1] && match[2]) {
        for (let i = 0; i < match[1]; i++) {
          let randInt = randomIntInc(1, match[2])
          total += randInt
          desc += `Roll ${i + 1}: ${randInt}\n`
        }
      }

      if (match[3]) total += parseInt(match[3])
      if (match[4]) total += parseInt(match[4])

      total += parseInt(bonus)

      const embed = new Discord.RichEmbed()
        .setAuthor(`${stats.name} rolled a ${total}!`)
        .addField('Weapon Name', name, true)
        .addField('Bonus', bonus, true)
        .addField('Attack Rule', dmg, true)
        .setDescription(`\n${desc}`)
        .setColor(0xb19cd9)
        .setImage('')
      sentEmbed.edit({embed})

      return
    }

    let reg = /(\d+)d(\d+)/g
    let match = reg.exec(rollType[1])
    // dice roll
    if (match) {
      let total = 0
      let desc = ''
      for (let i = 0; i < match[1]; i++) {
        let randInt = randomIntInc(1, match[2])
        total += randInt
        desc += `Roll ${i + 1}: ${randInt}\n`
      }
      let charName
      if (stats) charName = stats.name
      else charName = 'You'
      const embed = new Discord.RichEmbed()
        .setAuthor(`${charName} rolled a ${total}!`)
        .setDescription(desc)
        .setColor(0xb19cd9)
        .setImage('')
      sentEmbed.edit({embed})
      return
    }
    reject('ERROR: Invalid input!')
  })
}

// on ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.username}!`)
})

// on message
client.on('message', msg => {
  // if prefix isnt stated
  if (!(msg.content.split(' ')[0] === settings.prefix) && !(msg.content.split(' ')[0] === settings.roll)) return

  // loading embed
  let desc
  if (msg.content.startsWith(settings.roll)) desc = 'Rolling...'
  else desc = 'Loading data...'
  let embed = new Discord.RichEmbed()
    .setAuthor(desc)
    .setColor(0xA3E4D7)
  msg.channel.send({embed}).then(sentEmbed => {

    // if roll
    if (msg.content.split(' ')[0] === settings.roll) {

      // if bad input
      if (msg.content.split(' ').length < 2) {
        const embed = new Discord.RichEmbed()
          .setAuthor('Error! bad input >:(')
          .addField('Examples', '!r 1d20\n!r init\n!r attack 1\n!r attack <weapon #>')
          .setColor(0xE74C3C)
        sentEmbed.edit({embed})
        return
      }

      if (settings[msg.author.id]) {
        loadCharacter(msg, sentEmbed, settings[msg.author.id], msg.content.split(' '))
      } else {
        roll(sentEmbed, null, null, msg.content.split(' ')).catch(err => {
          const embed = new Discord.RichEmbed()
            .setAuthor(err)
            .setColor(0xE74C3C)
          sentEmbed.edit({embed})
        })
      }
      return
    }

    // load other people by mention
    if (msg.mentions.users.first()) {
      if (settings[msg.mentions.users.first().id]) {
        loadCharacter(msg, sentEmbed, settings[msg.mentions.users.first().id])
      } else {
        const embed = new Discord.RichEmbed()
          .setAuthor('Error! that user does not have a character :(')
          .setColor(0xE74C3C)
        sentEmbed.edit({embed})
      }
      return
    }

    // load personal character
    if (settings[msg.author.id]) {
      loadCharacter(msg, sentEmbed, settings[msg.author.id])
    } else {
      const embed = new Discord.RichEmbed()
        .setAuthor('Error! You do not have a DnD character :(')
        .setColor(0xE74C3C)
      sentEmbed.edit({embed})
    }
  })
})

login()
