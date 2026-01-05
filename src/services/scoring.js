export const TESTS = {
  PHQ9: 'PHQ-9',
  GAD7: 'GAD-7',
  OCD: 'Y-BOCS'
}

export const OPTIONS_0_3 = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 }
]

export const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself'
]

export function phq9Severity(score) {
  if (score <= 4) return 'None'
  if (score <= 9) return 'Mild'
  if (score <= 14) return 'Moderate'
  if (score <= 19) return 'Moderately Severe'
  return 'Severe'
}

export const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid as if something awful might happen'
]

export function gad7Severity(score) {
  if (score <= 4) return 'Minimal'
  if (score <= 9) return 'Mild'
  if (score <= 14) return 'Moderate'
  return 'Severe'
}

export const OCD_QUESTIONS = [
  'Time occupied by obsessions',
  'Interference due to obsessions',
  'Distress associated with obsessions',
  'Resistance against obsessions',
  'Degree of control over obsessions',
  'Time spent performing compulsions',
  'Interference due to compulsions',
  'Distress associated with compulsions',
  'Resistance against compulsions',
  'Degree of control over compulsions'
]

export const OPTIONS_OCD_0_4 = [
  { label: 'None', value: 0 },
  { label: 'Mild', value: 1 },
  { label: 'Moderate', value: 2 },
  { label: 'Severe', value: 3 },
  { label: 'Extreme', value: 4 }
]

export function ocdSeverity(score) {
  if (score <= 7) return 'Mild'
  if (score <= 15) return 'Moderate'
  if (score <= 23) return 'Severe'
  return 'Extreme'
}
