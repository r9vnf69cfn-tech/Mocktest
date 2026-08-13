# Velum — App-Icon Assets

Icon: Instrument-Serif-„V" (aufrecht) auf kühlem Papier + Kupferpunkt (Signatur der Wortmarke „Velum.").

## Inhalt
- `AppIcon-light-1024.png` · `AppIcon-dark-1024.png` · `AppIcon-tinted-1024.png`
  → **Master, full-bleed 1024×1024, quadratisch, ohne gerundete Ecken.** Genau so in den iOS-18-`AppIcon`-Slot (Any / Dark / Tinted). Das System rundet die Ecken selbst.
- `preview-rounded/` → dieselben Icons mit Squircle-Ecken, nur zur Ansicht/Präsentation (App Store Marketing, Mockups) — NICHT in den Asset-Katalog legen.
- `sizes/` → kleinere Full-Bleed-PNGs (180/120/80) für schnelle Vorschauen; der iOS-Katalog braucht nur das 1024er.

## Xcode
1. Assets → `AppIcon`, „Single Size" (iOS 17+).
2. `AppIcon-light-1024.png` in „Any Appearance", `-dark` in „Dark", `-tinted` in „Tinted".
3. Fertig — keine weiteren Größen nötig.

## Farbwerte
- Papier hell `#EEF1F6 → #DCE1EA` · Tinte-V `#14161B` · Kupferpunkt `#B5763F`
- Dunkel `#191C23 → #0D0F14` · V `#F1F3F8` · Punkt `#D89B63`
- Tinted `#26292F` · V `#C2C9D5` · kein Punkt

Hinweis: Für perfekte Schärfe kann der Entwickler das „V" final als Vektor-Outline aus Instrument Serif setzen; diese PNGs sind bereits produktionsnah gerendert.
