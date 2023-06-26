/// <reference path="sheet.d.ts" />

// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

function attrname(prefix: string, name: string) {
  return `${prefix}_${name.toLowerCase().replace(' ', '_')}`
}

function propsToRollTemplate(
  template: string,
  props: Record<string, string>
): string {
  const props_s = Object.keys(props).map((prop) => `{{${prop}=${props[prop]}}}`)
  return `&{template:${template}} ${props_s.join(' ')}`
}

function finishSkillRoll(outcome: StartRollCallbackValues) {
  const {
    rollId,
    results: {
      roll: { dice, expression },
    },
  } = outcome

  const [_dieroll, tn_s] = expression.split('+')

  // Count successes
  const tn = parseInt(tn_s) || 6
  const successes = dice.filter((die) => die <= tn)
  const result = `${successes.length ? 'Success' : 'Failure'} vs TN ${tn}`

  finishRoll(rollId, {
    roll: dice.map((s: any) => s.toString()).join(' '),
    result,
  })
}

function startSkillRoll(
  skillname: string,
  skillrank: number,
  qualities: string[]
) {
  let quality_query
  if (qualities.length == 1) {
    quality_query = `@{${attrname('quality', qualities[0])}}`
  } else {
    const options = qualities.map(
      (name) => `${name},@{${attrname('quality', name)}}`
    )
    quality_query = `?{Quality|${options.join('|')}}`
  }
  const roll_s = `[[${skillrank}d${quality_query}+?{TN|6}]]`

  const template = propsToRollTemplate('check', {
    name: skillname,
    roll: roll_s,
    result: '[[0]]',
  })
  startRoll(template, finishSkillRoll)
}

function startWeaponRoll(weapon: string, accuracy: number, shooting: number) {
  const roll_s = `[[${accuracy}d${shooting}+?{TN|6}]]`

  // TODO: offer to replace one die with Grace

  const template = propsToRollTemplate('check', {
    name: weapon,
    roll: roll_s,
    result: '[[0]]',
  })
  startRoll(template, finishSkillRoll)
}

on('clicked:quality', (event) => {
  const quality: string = event.htmlAttributes['data-quality'] || ''

  startSkillRoll(quality, 1, [quality])
})

on('clicked:skill', (event) => {
  const skillname: string = event.htmlAttributes['data-skillname'] || ''
  const attr = attrname('skill', skillname)
  const qualities: string[] = event.htmlAttributes['data-qualities'].split('|')

  getAttrs([attr], (v) => {
    startSkillRoll(skillname, parseInt(v[attr]) || 1, qualities)
  })
})

on('clicked:repeating_weapons:weapon', (event) => {
  const attr_prefix = event.sourceAttribute || ''
  getAttrs(
    [
      `${attr_prefix}_name`,
      `${attr_prefix}_acc`,
      `${attr_prefix}_ap`,
      'shooting',
    ],
    (v) => {
      startWeaponRoll(
        v[`${attr_prefix}_name`],
        parseInt(v[`${attr_prefix}_acc`]),
        parseInt(v['shooting']) || 1
      )
    }
  )
})
