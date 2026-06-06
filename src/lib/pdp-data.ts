export const SPECS_EXTRA: Record<string, Record<string, string>> = {
  'Tourbillon':         { Complication: 'Tourbillon',              'Power Reserve': '72 Hours', Frequency: '28,800 bph', Jewels: '35' },
  'Grand Feu Enamel':   { Complication: 'Grand Feu Enamel Dial',   'Power Reserve': '60 Hours', Frequency: '21,600 bph', Jewels: '27' },
  'Perpetual Calendar': { Complication: 'Perpetual Calendar',      'Power Reserve': '68 Hours', Frequency: '28,800 bph', Jewels: '33' },
  'Minute Repeater':    { Complication: 'Minute Repeater',         'Power Reserve': '55 Hours', Frequency: '18,000 bph', Jewels: '38' },
  'Chronograph':        { Complication: 'Flyback Chronograph',     'Power Reserve': '48 Hours', Frequency: '36,000 bph', Jewels: '30' },
}

export const REVIEWS = [
  { name: 'Khalid A.', init: 'K', rating: 5, title: 'A masterpiece of Islamic craftsmanship',       body: 'The dial geometry is breathtaking in person. The fumé effect deepens beautifully in different lighting. Delivery was flawless — arrived in a stunning presentation box. Al Noor has created something truly special.',                                                                                                   date: '12 May 2026', helpful: 34 },
  { name: 'Sophie M.', init: 'S', rating: 5, title: 'Worth every Franc',                             body: "I've handled many high-end watches. Al Noor sits comfortably among the very finest. The movement finishing visible through the caseback is extraordinary. The weight of grade-5 titanium on the wrist is perfect.",                                                                                              date: '3 Apr 2026',  helpful: 28 },
  { name: 'Omar R.',   init: 'O', rating: 4, title: 'Stunning — minor box scuff on delivery',        body: "The watch itself is a 10/10. Reduced one star only because the outer box had a slight scuff during transit. Al Noor's customer service resolved it immediately with a replacement box sent the next day.",                                                                                                       date: '18 Mar 2026', helpful: 19 },
  { name: 'Priya N.',  init: 'P', rating: 5, title: "Gift for my husband — he hasn't taken it off",  body: 'Purchased as a 10th anniversary gift. The personalised engraving on the caseback was executed flawlessly. The accompanying handwritten note from the atelier was a beautiful touch.',                                                                                                                           date: '2 Feb 2026',  helpful: 41 },
]

export function buildSpecs(p: { ref: string; category: string; material: string; dial: string; reviews: number }) {
  const extra = SPECS_EXTRA[p.category] ?? {}
  return {
    Reference:         p.ref,
    Collection:        p.category,
    'Case Material':   p.material,
    'Dial Colour':     p.dial,
    'Case Diameter':   '40 mm',
    'Case Thickness':  '13.2 mm',
    'Lug Width':       '20 mm',
    Crystal:           'Sapphire, double anti-reflective',
    'Water Resistance':'50 metres',
    Movement:          `In-house Cal. ${p.ref.slice(0, 7)}`,
    Winding:           'Automatic, bidirectional',
    ...extra,
    Strap:             'Hand-stitched Louisiana alligator',
    Clasp:             `Folding deployant, ${p.material}`,
    Origin:            'Swiss Made · Geneva Atelier',
    Warranty:          '5 Years — Full service coverage',
    Limited:           p.reviews < 30 ? `Yes — ${p.reviews * 2} pieces` : 'No',
  }
}
