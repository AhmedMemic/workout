/**
 * Stick-figure drawings for every exercise: a start and end frame (or a single "hold" frame).
 * Coordinates live in a 180 × 130 box, floor at y = 121. Figures face right unless noted.
 * Body = light lines + head; gear (dumbbells, ball, chair, band…) = accent colour.
 */

export type Pt = [number, number]

export type Gear =
  | { t: 'rect'; x: number; y: number; w: number; h: number; outline?: boolean }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { t: 'line'; pts: Pt[]; env?: boolean; thin?: boolean }

export interface Pose {
  lines: Pt[][]
  head?: Pt
  /** Drawn behind the body: chair, ball, wall, bar, band. */
  under?: Gear[]
  /** Drawn on top of the body: dumbbells, backpack. */
  over?: Gear[]
  arrows?: [number, number, number, number][]
}

export type FrameCaption = 'start' | 'end' | 'hold' | 'left' | 'right'

export interface Figure {
  frames: [FrameCaption, Pose][]
}

// ── Gear helpers ────────────────────────────────────────────────

/** Dumbbell held upright (goblet) or seen end-on. */
const dbV = (x: number, y: number): Gear => ({ t: 'rect', x: x - 4, y: y - 9, w: 8, h: 18 })
/** Dumbbell seen from the side, handle horizontal. */
const dbH = (x: number, y: number): Gear => ({ t: 'rect', x: x - 8, y: y - 3.5, w: 16, h: 7 })
const ball = (cx: number, r = 15): Gear => ({ t: 'circle', cx, cy: 121 - r - 1, r })
const wall = (x: number): Gear => ({ t: 'line', pts: [[x, 6], [x, 121]], env: true })
const bar: Gear = { t: 'line', pts: [[56, 16], [124, 16]] }
const band = (...pts: Pt[]): Gear => ({ t: 'line', pts, thin: true })

/** Chair seen from the side; `back` is the side its backrest is on. */
function chair(x: number, back: 'left' | 'right', seat = 92): Gear[] {
  const bx = back === 'left' ? x : x + 28
  return [
    { t: 'line', pts: [[x, seat], [x + 28, seat]] },
    { t: 'line', pts: [[x + 2, seat], [x + 2, 121]] },
    { t: 'line', pts: [[x + 26, seat], [x + 26, 121]] },
    { t: 'line', pts: [[bx, seat], [bx, seat - 34]] },
  ]
}

const mirror = (p: Pose): Pose => {
  const m = ([x, y]: Pt): Pt => [180 - x, y]
  const mg = (g: Gear): Gear =>
    g.t === 'rect' ? { ...g, x: 180 - g.x - g.w } : g.t === 'circle' ? { ...g, cx: 180 - g.cx } : { ...g, pts: g.pts.map(m) }
  return {
    lines: p.lines.map((l) => l.map(m)),
    head: p.head && m(p.head),
    under: p.under?.map(mg),
    over: p.over?.map(mg),
    arrows: p.arrows?.map(([x1, y1, x2, y2]) => [180 - x1, y1, 180 - x2, y2]),
  }
}

const withGear = (p: Pose, extra: Partial<Pose>): Pose => ({
  ...p,
  under: [...(p.under ?? []), ...(extra.under ?? [])],
  over: [...(p.over ?? []), ...(extra.over ?? [])],
  arrows: extra.arrows ?? p.arrows,
  lines: [...p.lines, ...(extra.lines ?? [])],
})

// ── Shared poses ────────────────────────────────────────────────

const LEGS_STAND: Pt[] = [[112, 118], [100, 118], [101, 94], [100, 70], [101, 40]]
const HEAD_STAND: Pt = [103, 28]

const standArmsDown: Pose = { lines: [LEGS_STAND, [[101, 42], [101, 58], [102, 74]]], head: HEAD_STAND }
const standArmsFwd: Pose = { lines: [LEGS_STAND, [[101, 42], [126, 46]]], head: HEAD_STAND }
const squatArmsFwd: Pose = {
  lines: [[[116, 118], [102, 118], [124, 98], [90, 96], [104, 64]], [[104, 66], [132, 66]]],
  head: [109, 52],
  arrows: [[70, 62, 70, 90]],
}

const pushUp: Pose = { lines: [[[42, 118], [92, 94], [140, 74]], [[140, 74], [140, 118]]], head: [153, 68] }
const pushDown: Pose = {
  lines: [[[42, 118], [92, 110], [140, 104]], [[140, 104], [122, 98], [140, 118]]],
  head: [154, 101],
  arrows: [[118, 72, 118, 92]],
}

const highPlank: Pose = { lines: [[[42, 117], [92, 95], [140, 74]], [[140, 74], [140, 118]]], head: [153, 68] }
const forearmPlank: Pose = { lines: [[[40, 118], [90, 104], [138, 92]], [[138, 92], [136, 118], [158, 118]]], head: [151, 88] }

const sidePlank: Pose = {
  lines: [[[168, 119], [160, 116], [106, 104], [52, 92]], [[52, 92], [52, 118]], [[52, 92], [58, 60]]],
  head: [38, 86],
}

/** Lying on the back, knees bent, feet flat (head left). */
const LIE_KNEES: Pt[] = [[52, 113], [100, 114], [122, 88], [140, 116], [152, 118]]
const LIE_HEAD: Pt = [40, 109]
const lieArms: Pt[] = [[58, 115], [92, 118]]

const bridgeDown: Pose = { lines: [LIE_KNEES, lieArms], head: LIE_HEAD }
const bridgeUp: Pose = {
  lines: [[[54, 113], [98, 91], [130, 80], [140, 116], [152, 118]], lieArms],
  head: LIE_HEAD,
  arrows: [[98, 114, 98, 100]],
}

const rdlStand: Pose = { lines: [[[110, 118], [100, 118], [100, 94], [100, 70], [100, 40]], [[100, 42], [102, 72]]], head: [101, 28] }
const rdlHinge: Pose = {
  lines: [[[110, 118], [100, 118], [103, 95], [86, 72], [114, 60]], [[114, 61], [115, 92]]],
  head: [126, 56],
  arrows: [[86, 52, 66, 52]],
}

/** Bent-over row hinge, both arms hanging / rowing. */
const rowHang: Pose = {
  lines: [[[112, 118], [100, 118], [104, 95], [88, 74], [124, 62]], [[124, 63], [125, 94]]],
  head: [136, 58],
  over: [dbH(125, 96)],
}
const rowPull: Pose = {
  lines: [[[112, 118], [100, 118], [104, 95], [88, 74], [124, 62]], [[124, 63], [108, 56], [112, 76]]],
  head: [136, 58],
  over: [dbH(112, 78)],
  arrows: [[146, 98, 146, 78]],
}

/** One hand and knee on a chair, other arm rows. */
const oneArmRowBase: Pt[][] = [
  [[60, 118], [70, 96], [72, 70], [112, 66]],
  [[72, 70], [76, 89], [56, 89]],
  [[112, 66], [114, 89]],
]
const oneArmRowDown: Pose = {
  lines: [...oneArmRowBase, [[110, 67], [104, 84], [106, 102]]],
  head: [124, 62],
  under: [
    { t: 'line', pts: [[48, 92], [120, 92]] },
    { t: 'line', pts: [[52, 92], [52, 121]] },
    { t: 'line', pts: [[116, 92], [116, 121]] },
  ],
  over: [dbH(106, 104)],
}
const oneArmRowUp: Pose = {
  ...oneArmRowDown,
  lines: [...oneArmRowBase, [[110, 67], [96, 58], [100, 76]]],
  over: [dbH(100, 78)],
  arrows: [[140, 104, 140, 82]],
}

/** Hanging from the bar, front view. */
const hang: Pose = {
  lines: [
    [[80, 16], [82, 44]], [[100, 16], [98, 44]],
    [[82, 44], [98, 44]], [[90, 44], [90, 76]],
    [[90, 76], [86, 112]], [[90, 76], [94, 112]],
  ],
  head: [90, 34],
  under: [bar],
}
const hangTop: Pose = {
  lines: [
    [[80, 16], [68, 26], [82, 32]], [[100, 16], [112, 26], [98, 32]],
    [[82, 32], [98, 32]], [[90, 32], [90, 64]],
    [[90, 64], [86, 100]], [[90, 64], [94, 100]],
  ],
  head: [90, 10],
  under: [bar],
}

/** Lying on the back with heels on the ball (head left). */
const ballBridgeStraight: Pose = {
  lines: [[[50, 113], [96, 98], [136, 91]], lieArms],
  head: LIE_HEAD,
  under: [ball(142)],
}
const ballCurlIn: Pose = {
  lines: [[[50, 113], [88, 90], [116, 74], [120, 92]], lieArms],
  head: LIE_HEAD,
  under: [ball(124)],
  arrows: [[150, 96, 134, 96]],
}

const quadLegs: Pt[] = [[52, 118], [84, 118], [84, 84]]
const quadArm: Pt[] = [[134, 84], [134, 118]]

/** Standing front view, arms out to the sides. */
const frontLegs: Pt[][] = [[[90, 54], [90, 84]], [[90, 84], [84, 118]], [[90, 84], [96, 118]]]

// ── Exercises ───────────────────────────────────────────────────

const goblet: Figure = {
  frames: [
    ['start', { lines: [LEGS_STAND, [[101, 42], [111, 60], [113, 48]]], head: HEAD_STAND, over: [dbV(116, 46)] }],
    [
      'end',
      {
        lines: [[[116, 118], [102, 118], [124, 98], [90, 96], [104, 64]], [[104, 66], [116, 80], [118, 68]]],
        head: [109, 52],
        over: [dbV(121, 67)],
        arrows: [[70, 62, 70, 90]],
      },
    ],
  ],
}

const bulgarianTop: Pose = {
  lines: [[[130, 118], [118, 118], [116, 94], [100, 72], [102, 42]], [[100, 72], [84, 98], [58, 90]], [[102, 44], [104, 74]]],
  head: [104, 30],
  under: chair(32, 'left', 92),
}
const bulgarianBottom: Pose = {
  lines: [[[130, 118], [118, 118], [128, 96], [98, 96], [104, 66]], [[98, 96], [80, 115], [58, 90]], [[104, 68], [106, 96]]],
  head: [107, 54],
  under: chair(32, 'left', 92),
  arrows: [[150, 70, 150, 94]],
}

const pikeUp: Pose = { lines: [[[50, 118], [90, 58], [124, 88]], [[124, 88], [134, 118]]], head: [134, 97] }
const pikeDown: Pose = {
  lines: [[[50, 118], [88, 60], [122, 100]], [[122, 100], [112, 98], [134, 118]]],
  head: [131, 110],
  arrows: [[150, 84, 150, 104]],
}

const marchA: Pose = {
  lines: [LEGS_STAND, [[100, 70], [122, 74], [118, 98]], [[101, 42], [112, 56], [124, 48]], [[101, 42], [92, 58], [88, 72]]],
  head: HEAD_STAND,
}
const marchB: Pose = {
  lines: [LEGS_STAND, [[100, 70], [118, 82], [108, 104]], [[101, 42], [92, 56], [84, 48]], [[101, 42], [110, 58], [116, 72]]],
  head: HEAD_STAND,
}

export const figures: Record<string, Figure> = {
  // ── Squat family
  'bodyweight-squat': { frames: [['start', standArmsFwd], ['end', squatArmsFwd]] },
  'goblet-squat': goblet,
  'goblet-squat-pause': { frames: [goblet.frames[0], ['hold', goblet.frames[1][1]]] },
  'bulgarian-split-squat': { frames: [['start', bulgarianTop], ['end', bulgarianBottom]] },
  'bulgarian-split-squat-weighted': {
    frames: [
      ['start', withGear(bulgarianTop, { over: [dbH(104, 76)] })],
      ['end', withGear(bulgarianBottom, { over: [dbH(106, 98)] })],
    ],
  },
  'reverse-lunge': {
    frames: [
      ['start', withGear(standArmsDown, { over: [dbH(102, 76)] })],
      [
        'end',
        {
          lines: [[[134, 118], [122, 118], [124, 94], [100, 94], [101, 64]], [[100, 94], [86, 116], [62, 116]], [[101, 66], [102, 94]]],
          head: [102, 52],
          over: [dbH(102, 96)],
          arrows: [[80, 40, 58, 40]],
        },
      ],
    ],
  },

  // ── Push family
  'incline-pushup': {
    frames: [
      ['start', { lines: [[[40, 118], [85, 90], [130, 62]], [[130, 62], [134, 90]]], head: [142, 55], under: chair(124, 'right', 92) }],
      [
        'end',
        {
          lines: [[[40, 118], [83, 99], [126, 80]], [[126, 80], [112, 78], [134, 90]]],
          head: [139, 74],
          under: chair(124, 'right', 92),
          arrows: [[100, 66, 100, 84]],
        },
      ],
    ],
  },
  pushup: { frames: [['start', pushUp], ['end', pushDown]] },
  'tempo-pushup': { frames: [['start', pushUp], ['end', pushDown]] },
  'decline-pushup': {
    frames: [
      ['start', { lines: [[[40, 90], [90, 82], [140, 74]], [[140, 74], [140, 118]]], head: [153, 71], under: chair(16, 'left', 94) }],
      [
        'end',
        {
          lines: [[[40, 90], [90, 97], [140, 104]], [[140, 104], [122, 98], [140, 118]]],
          head: [154, 105],
          under: chair(16, 'left', 94),
          arrows: [[118, 66, 118, 86]],
        },
      ],
    ],
  },
  'archer-pushup': {
    frames: [
      ['start', { lines: [[[70, 80], [110, 80]], [[70, 80], [40, 118]], [[110, 80], [140, 118]], [[90, 80], [90, 98]]], head: [90, 68] }],
      [
        'end',
        {
          lines: [[[50, 100], [90, 100]], [[50, 100], [34, 96], [40, 118]], [[90, 100], [140, 118]], [[70, 100], [74, 112]]],
          head: [70, 89],
          arrows: [[96, 70, 70, 70]],
        },
      ],
    ],
  },
  'floor-press': {
    frames: [
      ['start', { lines: [LIE_KNEES, [[52, 112], [52, 72]]], head: LIE_HEAD, over: [dbH(52, 68)] }],
      ['end', { lines: [LIE_KNEES, [[52, 112], [66, 116], [66, 92]]], head: LIE_HEAD, over: [dbH(66, 88)], arrows: [[90, 64, 90, 84]] }],
    ],
  },
  'overhead-triceps-extension': {
    frames: [
      ['start', { lines: [LEGS_STAND, [[101, 42], [102, 14]]], head: HEAD_STAND, over: [{ t: 'rect', x: 97, y: 2, w: 10, h: 12 }] }],
      [
        'end',
        {
          lines: [LEGS_STAND, [[101, 42], [106, 16], [88, 34]]],
          head: HEAD_STAND,
          over: [dbV(84, 34)],
          arrows: [[130, 18, 130, 38]],
        },
      ],
    ],
  },

  // ── Overhead family
  'seated-db-press': {
    frames: [
      [
        'start',
        {
          lines: [[[132, 118], [122, 118], [122, 84], [92, 84], [94, 52]], [[94, 54], [102, 70], [104, 50]]],
          head: [96, 40],
          under: chair(78, 'left', 88),
          over: [dbH(104, 46)],
        },
      ],
      [
        'end',
        {
          lines: [[[132, 118], [122, 118], [122, 84], [92, 84], [94, 52]], [[94, 54], [96, 20]]],
          head: [96, 40],
          under: chair(78, 'left', 88),
          over: [dbH(96, 16)],
          arrows: [[130, 52, 130, 30]],
        },
      ],
    ],
  },
  'standing-db-press': {
    frames: [
      ['start', { lines: [LEGS_STAND, [[101, 42], [110, 58], [108, 40]]], head: HEAD_STAND, over: [dbH(108, 36)] }],
      ['end', { lines: [LEGS_STAND, [[101, 42], [102, 12]]], head: HEAD_STAND, over: [dbH(102, 8)], arrows: [[134, 40, 134, 18]] }],
    ],
  },
  'pike-pushup': { frames: [['start', pikeUp], ['end', pikeDown]] },
  'pike-pushup-elevated': {
    frames: [
      ['start', { lines: [[[44, 90], [92, 52], [124, 86]], [[124, 86], [132, 118]]], head: [132, 96], under: chair(20, 'left', 92) }],
      [
        'end',
        {
          lines: [[[44, 90], [90, 54], [122, 98]], [[122, 98], [112, 96], [132, 118]]],
          head: [130, 109],
          under: chair(20, 'left', 92),
          arrows: [[150, 84, 150, 104]],
        },
      ],
    ],
  },
  'wall-handstand': {
    frames: [
      ['hold', { lines: [[[62, 118], [62, 86]], [[62, 86], [52, 52], [46, 16]], [[46, 16], [42, 12]]], head: [68, 98], under: [wall(38)] }],
    ],
  },

  // ── Row / pull family
  'band-row': {
    frames: [
      [
        'start',
        {
          lines: [[[60, 113], [130, 115]], [[130, 115], [134, 102]], [[60, 113], [64, 82]], [[64, 84], [112, 98]]],
          head: [66, 70],
          under: [band([112, 98], [132, 108])],
        },
      ],
      [
        'end',
        {
          lines: [[[60, 113], [130, 115]], [[130, 115], [134, 102]], [[60, 113], [64, 82]], [[64, 84], [48, 100], [72, 100]]],
          head: [66, 70],
          under: [band([72, 100], [132, 108])],
          arrows: [[110, 82, 90, 82]],
        },
      ],
    ],
  },
  'one-arm-db-row': { frames: [['start', oneArmRowDown], ['end', oneArmRowUp]] },
  'tempo-one-arm-row': { frames: [['start', oneArmRowDown], ['end', oneArmRowUp]] },
  'bent-over-row': { frames: [['start', rowHang], ['end', rowPull]] },
  'dead-hang': { frames: [['hold', hang]] },
  'scapular-pull': {
    frames: [
      ['start', hang],
      ['end', { ...hang, lines: hang.lines.map((l) => l.map(([x, y]) => [x, y === 16 ? 16 : y - 6] as Pt)), head: [90, 28], arrows: [[130, 70, 130, 52]] }],
    ],
  },
  'negative-pullup': { frames: [['start', hangTop], ['end', { ...hang, arrows: [[130, 40, 130, 70]] }]] },
  pullup: { frames: [['start', hang], ['end', { ...hangTop, arrows: [[130, 70, 130, 40]] }]] },

  // ── Hinge family
  'glute-bridge': {
    frames: [
      ['start', withGear(bridgeDown, { over: [dbH(100, 107)] })],
      ['end', withGear(bridgeUp, { over: [dbH(98, 84)] })],
    ],
  },
  'single-leg-glute-bridge': {
    frames: [
      ['start', { lines: [LIE_KNEES, lieArms, [[100, 114], [148, 98]]], head: LIE_HEAD }],
      ['end', withGear(bridgeUp, { lines: [[[130, 80], [164, 68]]] })],
    ],
  },
  'db-rdl': {
    frames: [
      ['start', withGear(rdlStand, { over: [dbH(102, 75)] })],
      ['end', withGear(rdlHinge, { over: [dbH(115, 95)] })],
    ],
  },
  'single-leg-rdl': {
    frames: [
      ['start', withGear(rdlStand, { over: [dbH(102, 75)] })],
      [
        'end',
        {
          lines: [[[110, 118], [100, 118], [102, 95], [96, 72], [128, 70]], [[96, 72], [56, 74]], [[127, 71], [128, 98]]],
          head: [141, 68],
          over: [dbH(128, 101)],
        },
      ],
    ],
  },
  'backpack-rdl': {
    frames: [
      ['start', withGear(rdlStand, { over: [{ t: 'rect', x: 94, y: 70, w: 16, h: 20 }] })],
      ['end', withGear(rdlHinge, { over: [{ t: 'rect', x: 107, y: 90, w: 16, h: 20 }] })],
    ],
  },

  // ── Hamstrings (ball)
  'ball-bridge-hold': { frames: [['hold', ballBridgeStraight]] },
  'ball-hamstring-curl': { frames: [['start', ballBridgeStraight], ['end', ballCurlIn]] },
  'ball-curl-eccentric': { frames: [['start', ballCurlIn], ['end', { ...ballBridgeStraight, arrows: [[124, 70, 144, 70]] }]] },
  'single-leg-ball-curl': {
    frames: [
      ['start', withGear(ballBridgeStraight, { lines: [[[96, 98], [124, 64]]] })],
      ['end', withGear(ballCurlIn, { lines: [[[88, 90], [104, 52]]] })],
    ],
  },
  'single-leg-ball-curl-pause': {
    frames: [
      ['start', withGear(ballBridgeStraight, { lines: [[[96, 98], [124, 64]]] })],
      ['hold', withGear(ballCurlIn, { lines: [[[88, 90], [104, 52]]], arrows: [] })],
    ],
  },

  // ── Core
  'dead-bug': {
    frames: [
      ['start', { lines: [[[52, 113], [98, 114]], [[98, 114], [98, 82], [126, 82]], [[52, 112], [54, 72]]], head: LIE_HEAD }],
      [
        'end',
        {
          lines: [
            [[52, 113], [98, 114]],
            [[98, 114], [98, 82], [126, 82]],
            [[52, 112], [54, 72]],
            [[98, 114], [150, 106]],
            [[52, 112], [16, 102]],
          ],
          head: LIE_HEAD,
        },
      ],
    ],
  },
  plank: { frames: [['hold', forearmPlank]] },
  'side-plank': { frames: [['left', sidePlank], ['right', mirror(sidePlank)]] },
  'ball-rollout': {
    frames: [
      ['start', { lines: [[[40, 118], [70, 118], [76, 88], [112, 72]], [[112, 72], [116, 90], [134, 90]]], head: [124, 66], under: [ball(124, 14)] }],
      [
        'end',
        {
          lines: [[[40, 118], [70, 118], [90, 98], [134, 84]], [[134, 84], [142, 92], [160, 92]]],
          head: [146, 78],
          under: [ball(150, 14)],
          arrows: [[96, 70, 124, 62]],
        },
      ],
    ],
  },
  'ball-stir-the-pot': {
    frames: [
      [
        'start',
        {
          lines: [[[30, 118], [80, 98], [124, 80]], [[124, 80], [128, 92], [146, 92]]],
          head: [137, 74],
          under: [ball(136, 14)],
        },
      ],
      [
        'end',
        {
          lines: [[[30, 118], [80, 98], [124, 80]], [[124, 80], [128, 92], [146, 92]]],
          head: [137, 74],
          under: [ball(136, 14), { t: 'circle', cx: 136, cy: 106, r: 22 }],
          arrows: [[158, 100, 156, 112]],
        },
      ],
    ],
  },
  situp: {
    frames: [
      ['start', { lines: [LIE_KNEES, [[52, 112], [64, 104], [72, 110]]], head: LIE_HEAD }],
      [
        'end',
        {
          lines: [[[100, 114], [122, 88], [140, 116], [152, 118]], [[100, 114], [106, 80]], [[106, 82], [118, 88], [112, 96]]],
          head: [110, 68],
          arrows: [[60, 100, 80, 70]],
        },
      ],
    ],
  },

  // ── Grip (gear only)
  'hand-gripper': {
    frames: [
      [
        'start',
        {
          lines: [],
          under: [
            { t: 'line', pts: [[84, 30], [64, 112]] },
            { t: 'line', pts: [[96, 30], [118, 112]] },
            { t: 'circle', cx: 90, cy: 24, r: 8 },
          ],
        },
      ],
      [
        'end',
        {
          lines: [],
          under: [
            { t: 'line', pts: [[86, 30], [84, 112]] },
            { t: 'line', pts: [[94, 30], [98, 112]] },
            { t: 'circle', cx: 90, cy: 24, r: 8 },
          ],
          arrows: [[56, 76, 74, 76], [126, 76, 108, 76]],
        },
      ],
    ],
  },
  'finger-trainer': {
    frames: [
      [
        'start',
        {
          lines: [[[70, 40], [70, 60]], [[84, 36], [84, 60]], [[98, 38], [98, 60]], [[112, 44], [112, 60]]],
          under: [{ t: 'rect', x: 60, y: 66, w: 62, h: 40, outline: true }],
        },
      ],
      [
        'end',
        {
          lines: [[[70, 40], [70, 60]], [[84, 44], [84, 68]], [[98, 38], [98, 60]], [[112, 44], [112, 60]]],
          under: [{ t: 'rect', x: 60, y: 66, w: 62, h: 40, outline: true }],
          arrows: [[84, 14, 84, 32]],
        },
      ],
    ],
  },
  'finger-extension': {
    frames: [
      [
        'start',
        {
          lines: [[[90, 118], [90, 96]], [[84, 82], [84, 40]], [[90, 82], [90, 36]], [[96, 82], [96, 40]], [[102, 84], [102, 48]], [[80, 90], [70, 74]]],
          head: [92, 90],
          under: [{ t: 'circle', cx: 92, cy: 58, r: 12 }],
        },
      ],
      [
        'end',
        {
          lines: [[[90, 118], [90, 96]], [[86, 82], [68, 42]], [[90, 82], [86, 34]], [[96, 82], [104, 36]], [[100, 84], [120, 48]], [[80, 90], [60, 78]]],
          head: [92, 90],
          under: [{ t: 'circle', cx: 92, cy: 56, r: 22 }],
          arrows: [[40, 60, 54, 60], [144, 60, 130, 60]],
        },
      ],
    ],
  },

  // ── Mobility
  'cat-cow': {
    frames: [
      ['start', { lines: [quadLegs, [[84, 84], [109, 68], [134, 84]], quadArm], head: [144, 96] }],
      ['end', { lines: [quadLegs, [[84, 84], [109, 96], [134, 84]], quadArm], head: [148, 72] }],
    ],
  },
  'thread-the-needle': {
    frames: [
      ['start', { lines: [quadLegs, [[84, 84], [130, 86]], quadArm, [[130, 86], [126, 46]]], head: [142, 82] }],
      ['end', { lines: [quadLegs, [[84, 84], [124, 102]], quadArm, [[124, 102], [96, 116]]], head: [134, 110], arrows: [[150, 60, 140, 78]] }],
    ],
  },
  'hip-flexor-stretch': {
    frames: [
      ['hold', { lines: [[[54, 118], [82, 118], [100, 88], [128, 90], [126, 118], [136, 118]], [[100, 88], [100, 58]], [[100, 60], [104, 24]]], head: [101, 46] }],
    ],
  },
  'hip-90-90': {
    frames: [
      [
        'start',
        { lines: [[[90, 112], [122, 112], [114, 96]], [[90, 112], [64, 104], [58, 118]], [[90, 112], [90, 72]], [[90, 76], [72, 98]]], head: [90, 60] },
      ],
      [
        'end',
        {
          lines: [[[90, 112], [58, 112], [66, 96]], [[90, 112], [116, 104], [122, 118]], [[90, 112], [90, 72]], [[90, 76], [108, 98]]],
          head: [90, 60],
          arrows: [[130, 80, 106, 80]],
        },
      ],
    ],
  },
  'deep-squat-hold': {
    frames: [
      [
        'hold',
        {
          lines: [[[112, 118], [100, 118], [120, 96], [92, 108], [104, 76]], [[104, 78], [140, 80]]],
          head: [108, 64],
          under: [wall(144)],
        },
      ],
    ],
  },
  'hamstring-stretch': {
    frames: [
      [
        'hold',
        {
          lines: [[[52, 113], [100, 114], [152, 116]], [[100, 114], [112, 62]], [[52, 112], [84, 86]]],
          head: LIE_HEAD,
          under: [band([84, 86], [112, 60])],
        },
      ],
    ],
  },
  'doorway-chest-stretch': {
    frames: [
      [
        'hold',
        {
          lines: [[[94, 118], [104, 96], [112, 72]], [[112, 72], [124, 96], [132, 118]], [[112, 72], [114, 42]], [[114, 44], [98, 44], [98, 22]]],
          head: [116, 30],
          under: [wall(96)],
        },
      ],
    ],
  },
  'chin-tuck': {
    frames: [
      ['start', { lines: [[[90, 121], [90, 92]], [[90, 92], [94, 74]]], under: [{ t: 'circle', cx: 100, cy: 58, r: 18, fill: true }] }],
      [
        'end',
        {
          lines: [[[90, 121], [90, 92]], [[90, 92], [88, 74]]],
          under: [{ t: 'circle', cx: 90, cy: 58, r: 18, fill: true }],
          arrows: [[140, 58, 116, 58]],
        },
      ],
    ],
  },
  'wall-angel': {
    frames: [
      ['start', { lines: [[[74, 54], [106, 54]], ...frontLegs, [[74, 54], [58, 52], [60, 30]], [[106, 54], [122, 52], [120, 30]]], head: [90, 42] }],
      [
        'end',
        {
          lines: [[[74, 54], [106, 54]], ...frontLegs, [[74, 54], [66, 32], [72, 10]], [[106, 54], [114, 32], [108, 10]]],
          head: [90, 42],
          arrows: [[146, 50, 146, 26]],
        },
      ],
    ],
  },
  'ball-back-extension': {
    frames: [
      ['start', { lines: [[[30, 118], [86, 86], [116, 104]], [[116, 104], [118, 120]]], head: [126, 110], under: [ball(88, 16), wall(22)] }],
      [
        'end',
        {
          lines: [[[30, 118], [86, 86], [122, 68]], [[118, 70], [120, 90]]],
          head: [134, 62],
          under: [ball(88, 16), wall(22)],
          arrows: [[150, 100, 150, 76]],
        },
      ],
    ],
  },
  'childs-pose': {
    frames: [['hold', { lines: [[[64, 118], [100, 118], [74, 96], [114, 106]], [[114, 106], [154, 117]]], head: [124, 112] }]],
  },
  'worlds-greatest-stretch': {
    frames: [
      ['start', { lines: [[[40, 118], [96, 98], [126, 96], [130, 118]], [[96, 98], [122, 82]], [[122, 82], [126, 118]]], head: [134, 78] }],
      [
        'end',
        {
          lines: [[[40, 118], [96, 98], [126, 96], [130, 118]], [[96, 98], [122, 82]], [[122, 82], [126, 118]], [[122, 82], [116, 42]]],
          head: [134, 78],
          arrows: [[140, 60, 128, 44]],
        },
      ],
    ],
  },
  'arm-circles': {
    frames: [
      [
        'start',
        {
          lines: [[[74, 54], [106, 54]], ...frontLegs, [[74, 54], [36, 54]], [[106, 54], [144, 54]]],
          head: [90, 42],
          under: [{ t: 'circle', cx: 30, cy: 54, r: 12 }, { t: 'circle', cx: 150, cy: 54, r: 12 }],
        },
      ],
      [
        'end',
        {
          lines: [[[74, 54], [106, 54]], ...frontLegs, [[74, 54], [36, 54]], [[106, 54], [144, 54]]],
          head: [90, 42],
          under: [{ t: 'circle', cx: 30, cy: 54, r: 20 }, { t: 'circle', cx: 150, cy: 54, r: 20 }],
        },
      ],
    ],
  },
  breathing: {
    frames: [
      ['start', { lines: [LIE_KNEES, lieArms], head: LIE_HEAD, arrows: [[78, 104, 78, 84]] }],
      ['end', { lines: [LIE_KNEES, lieArms], head: LIE_HEAD, arrows: [[78, 84, 78, 104]] }],
    ],
  },

  // ── Quiet cardio
  'march-in-place': { frames: [['start', marchA], ['end', marchB]] },
  'high-knee-march': {
    frames: [
      ['start', { ...marchA, lines: [LEGS_STAND, [[100, 70], [126, 66], [124, 92]], ...marchA.lines.slice(2)] }],
      ['end', marchB],
    ],
  },
  'shadow-boxing': {
    frames: [
      [
        'start',
        { lines: [[[132, 118], [124, 118], [116, 94], [102, 70], [106, 42]], [[102, 70], [92, 94], [84, 118]], [[106, 44], [118, 58], [120, 38]]], head: [110, 30] },
      ],
      [
        'end',
        {
          lines: [[[132, 118], [124, 118], [116, 94], [102, 70], [108, 42]], [[102, 70], [92, 94], [84, 118]], [[108, 44], [152, 40]]],
          head: [112, 30],
          arrows: [[130, 22, 156, 22]],
        },
      ],
    ],
  },
  'squat-calf-raise': {
    frames: [
      ['start', squatArmsFwd],
      ['end', { lines: [[[112, 118], [102, 112], [101, 90], [100, 66], [101, 36]], [[101, 38], [126, 42]]], head: [103, 24], arrows: [[70, 100, 70, 80]] }],
    ],
  },
  'towel-mountain-climber': {
    frames: [
      ['start', withGear(highPlank, { under: [{ t: 'rect', x: 32, y: 117, w: 20, h: 4 }] })],
      [
        'end',
        {
          lines: [[[42, 117], [92, 95], [140, 74]], [[92, 95], [116, 104], [104, 117]], [[140, 74], [140, 118]]],
          head: [153, 68],
          under: [{ t: 'rect', x: 32, y: 117, w: 20, h: 4 }, { t: 'rect', x: 94, y: 117, w: 20, h: 4 }],
          arrows: [[70, 84, 96, 84]],
        },
      ],
    ],
  },
  'lateral-lunge-step': {
    frames: [
      ['start', { lines: [[[74, 54], [106, 54]], ...frontLegs, [[74, 54], [84, 70], [96, 66]], [[106, 54], [100, 68]]], head: [90, 42] }],
      [
        'end',
        {
          lines: [[[64, 78], [134, 118]], [[64, 78], [48, 98], [44, 118]], [[64, 78], [70, 48]], [[56, 50], [84, 50]], [[56, 50], [70, 66], [80, 62]]],
          head: [72, 36],
          arrows: [[60, 20, 36, 20]],
        },
      ],
    ],
  },
  'plank-shoulder-tap': {
    frames: [
      ['start', highPlank],
      ['end', withGear(highPlank, { lines: [[[140, 74], [124, 86], [138, 82]]], arrows: [[112, 64, 128, 72]] })],
    ],
  },
  'squat-to-press': {
    frames: [
      [
        'start',
        {
          lines: [[[116, 118], [102, 118], [124, 98], [90, 96], [104, 64]], [[104, 66], [114, 80], [116, 64]]],
          head: [109, 52],
          over: [dbH(116, 60)],
        },
      ],
      ['end', { lines: [LEGS_STAND, [[101, 42], [102, 12]]], head: HEAD_STAND, over: [dbH(102, 8)], arrows: [[70, 80, 70, 50]] }],
    ],
  },
  'brisk-walk': {
    frames: [
      [
        'start',
        { lines: [[[134, 118], [124, 118], [114, 94], [102, 70], [104, 40]], [[102, 70], [90, 94], [78, 112]], [[104, 42], [118, 56], [126, 50]], [[104, 42], [94, 58], [86, 68]]], head: [106, 28] },
      ],
      [
        'end',
        { lines: [[[112, 118], [102, 118], [101, 94], [102, 70], [104, 40]], [[102, 70], [112, 92], [104, 112]], [[104, 42], [94, 56], [88, 66]], [[104, 42], [112, 58], [118, 70]]], head: [106, 28] },
      ],
    ],
  },
}
