#!/usr/bin/env node
// Beheerders beheren vanaf de commandline.
//
//   node scripts/admin.ts add <email> [naam]
//   node scripts/admin.ts password <email>
//   node scripts/admin.ts remove <email>
//   node scripts/admin.ts list
//
// Gebruikt NUXT_DATA_DIR (standaard ".data") om de database te vinden.
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline'
import { openDatabase } from '../server/lib/database.ts'
import { hashPassword, MIN_PASSWORD_LENGTH } from '../server/lib/password.ts'

const db = openDatabase(process.env.NUXT_DATA_DIR || '.data')
const [command, email, ...nameParts] = process.argv.slice(2)

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true })
    if (hidden) {
      // Verberg het wachtwoord tijdens het typen
      ;(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
        if (s.startsWith(question)) stdout.write(question)
        else if (s.includes('\n')) stdout.write('\n')
      }
    }
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function askPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD
  const password = await ask('Wachtwoord: ', true)
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Het wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn.`)
  }
  const repeat = await ask('Herhaal wachtwoord: ', true)
  if (password !== repeat) throw new Error('De wachtwoorden komen niet overeen.')
  return password
}

function requireEmail(): string {
  if (!email) {
    console.error('Geef een e-mailadres op.')
    process.exit(1)
  }
  return email.trim()
}

try {
  switch (command) {
    case 'add': {
      const address = requireEmail()
      if (db.prepare('SELECT 1 FROM admins WHERE email = ?').get(address)) {
        throw new Error('Er bestaat al een beheerder met dit e-mailadres.')
      }
      const password = await askPassword()
      db.prepare(
        'INSERT INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)',
      ).run(address, nameParts.join(' '), await hashPassword(password), new Date().toISOString())
      console.log(`Beheerder ${address} toegevoegd.`)
      break
    }
    case 'password': {
      const address = requireEmail()
      const password = await askPassword()
      const result = db
        .prepare('UPDATE admins SET password_hash = ? WHERE email = ?')
        .run(await hashPassword(password), address)
      if (!result.changes) throw new Error('Beheerder niet gevonden.')
      console.log(`Wachtwoord van ${address} aangepast.`)
      break
    }
    case 'remove': {
      const address = requireEmail()
      const result = db.prepare('DELETE FROM admins WHERE email = ?').run(address)
      if (!result.changes) throw new Error('Beheerder niet gevonden.')
      console.log(`Beheerder ${address} verwijderd.`)
      break
    }
    case 'list': {
      const admins = db.prepare('SELECT email, name, created_at FROM admins ORDER BY email').all()
      if (!admins.length) console.log('Nog geen beheerders.')
      for (const { email, name, created_at } of admins) {
        console.log([email, name, created_at].map(String).join('\t'))
      }
      break
    }
    default:
      console.log(
        'Gebruik: node scripts/admin.ts <add|password|remove|list> [email] [naam]\n' +
          'Tip: zet ADMIN_PASSWORD om het wachtwoord niet interactief te vragen.',
      )
  }
} catch (error) {
  console.error((error as Error).message)
  process.exitCode = 1
} finally {
  db.close()
}
