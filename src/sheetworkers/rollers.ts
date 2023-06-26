/// <reference path="sheet.d.ts" />

// Documentation: https://wiki.roll20.net/Sheet_Worker_Scripts

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
  const tn = parseInt(tn_s) || 6

  // TODO: how many dice were at or under TN?

  const successes = dice.filter((die) => die <= tn).length
  const result = successes ? `Success vs TN ${tn}` : `Failure vs TN ${tn}`

  finishRoll(rollId, {
    roll: dice.map((s: any) => s.toString()).join(' '),
    result,
  })
}

function startSkillRoll(
  skillname: string,
  skillrank: string,
  qualities: string
) {
  // TODO: custom template
  const template = propsToRollTemplate('check', {
    name: skillname,
    roll: `[[${skillrank}d${qualities}+?{TN|6}]]`,
    result: '[[0]]',
  })
  startRoll(template, finishSkillRoll)
}

on('clicked:skill', (event) => {
  const attr = event.htmlAttributes['data-skillname']
  const qualities = event.htmlAttributes['data-qualities']

  // TODO: skills with multiple qualities is buggy

  getAttrs([attr], (v) => {
    startSkillRoll(attr, v[attr], qualities)
  })
})
