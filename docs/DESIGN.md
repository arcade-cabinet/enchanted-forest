---
title: Design
updated: 2026-04-23
status: current
domain: product
---

# Design

## Identity

*Enchanted Forest* is not an action game. It is a **rune-cadence
meditation with stakes**. The player spends 60–120 seconds drawing
three simple runes over a grove of three sacred trees. Each rune
plays a pentatonic note. Stringing them in the right cadence builds
harmony; harmony empowers the next cast. The grove is under siege —
corruption shadows march toward the trees and must be cleared — but
the game is not won by twitch; it is won by rhythm.

When the last wave is sealed the finale reads "wiser mage." When the
trees fall the defeat reads "the roots have gone dark." Neither beat
shouts. The grove either sleeps or mourns.

## Player journey

1. **Land.** The title card reads "Enchanted Forest" in Cinzel
   amber-on-moss. Subtitle: *"Learn a rune, chain it, survive grove
   variety that tests the reading of your cadence. Finish as a wiser
   mage."* Three verb chips — *Draw a rune · Chain its cadence ·
   Seal the grove.* One primary CTA: "START."
2. **Draw.** A drawing canvas covers the grove stage. As the player
   drags their finger or cursor, a mint spirit trails behind, and the
   rune pattern builds. The three rune templates are simple — a
   triangle (shield), a circle (heal), a spiral (purify) — so the
   player can re-read their own stroke.
3. **Cast.** A completed stroke is matched to the nearest rune
   template. A note fires (heal = A, shield = D, purify = G). The
   spell applies its effect on the grove: a halo over all three
   trees (shield), a pulse on the weakest tree (heal), or a
   dissolving violet zone under the nearest shadow (purify).
4. **Chain.** Casting a new rune type immediately after another
   increments a harmony counter. At 3+ harmony, every spell lasts
   longer and heals more. Breaking the cadence — repeating the same
   rune or letting time run out — resets it.
5. **Seal.** Each wave is a batch of corruption shadows on timed
   paths. When the wave is cleared the next one spawns; when all five
   waves are cleared the grove is sealed and the player ends "wiser."

## Palette rationale

- `#0c1a10` deep forest void — the background. Night-in-the-trees,
  almost-black green.
- `#1a3a22` moss — the safe-life anchor color. Used for tree bases,
  healing zones, and any surface the player wants to protect.
- `#2e1810` bark — warm brown, used for tree trunks and underlays.
  Contrast with moss so trees read as living.
- `#f2c14e` firefly amber — the hero glow color. Used exclusively
  for the rune, the CTA, the harmony meter, and anywhere the player
  should look. One color for "this is the beat."
- `#8b5cf6` spirit violet — the wisp that follows the stroke, and
  the purify zone. Distinguishes drawing from the grove itself.
- `#ecf1df` pale starlight — body text and readouts.
- `#8a9b82` muted sage — secondary labels.
- `#f29679` warm coral — corruption flash, defeat state. Intrusion
  color; deliberately warm to contrast with cool moss.

## Fontography rationale

**Cinzel** (display): a contemporary humanist serif revival with
rune-adjacent capital detailing — very long "T" crossbars, generous
"A" apex, strong inscriptional feel. Letters already look carved.
Used for the title, wave cues, and any moment that should feel like
stone.

**Inter** (body + HUD): high x-height, tabular figures. Legible at
12px against the moss-on-void gradient. The HUD's readability
contract.

Both fall back to system fonts to avoid FOIT.

## Future work

- Three new rune archetypes (freeze, bloom, dispel) to expand mid-run
  decision-making.
- Daily grove seed — shared corruption pattern per day.
- Audio layer expansion: ambient wind, wave-end chime, harmony surge
  chord. Stay within the pentatonic tonality.
- Portrait-locked capacitor config — the stroke interaction reads
  best on phone.
- "Grove diary" after victory showing every rune cast in order.
