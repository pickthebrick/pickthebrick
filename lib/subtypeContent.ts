// Editorial copy for the public Subtype-level SEO landing pages
// (app/landing/[category]/[type]/[style]) - what the founder calls "Style"
// pages, the most specific/bottom-of-funnel level of the catalog. Same
// pattern as lib/landingContent.ts and lib/typeContent.ts, kept more
// concise since the topic itself is narrower. Keyed as
// `${categoryKey}.${typeKey}.${subtypeKey}` against the live Subtype rows.
// Falls back to a generic-but-real template for anything not yet bespoke.
export type SubtypeContent = {
  intro: string[];
  benefits: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

const GENERIC = (subtypeLabel: string, typeLabel: string, categoryLabel: string): SubtypeContent => ({
  intro: [
    `${subtypeLabel} is one of the specific ${typeLabel.toLowerCase()} options under PickTheBrick's ${categoryLabel.toLowerCase()} range - supplied and installed as part of your Dubai office fit-out, priced with fitting included in the rate shown.`,
  ],
  benefits: [
    { title: "Supply and installation, one price", body: "The rate shown already includes fitting - no separate install quote to chase down later." },
    { title: "Sequenced with the rest of your fit-out", body: "Your Captain schedules this alongside every other trade on one project timeline." },
  ],
  faqs: [
    { q: `Is installation included in the ${subtypeLabel.toLowerCase()} price?`, a: "Yes - every rate shown is a supply-and-install price." },
    { q: "Can this be combined with other styles in the same type?", a: "Yes - mixing styles within one type (and across categories) in a single quote is common." },
    { q: "What if I need a spec that isn't listed here?", a: "Add a placeholder item to your quote and flag the exact spec to your Captain - our team can source close matches for most requests." },
  ],
});

export const SUBTYPE_CONTENT: Record<string, SubtypeContent> = {
  // ---------- Partitions ----------
  "partitions.glass.singleGlazed": {
    intro: ["Single glazed glass partitioning uses one pane of toughened glass in a slim aluminium frame - the standard, most cost-effective glazed wall for general offices, corridors, and cabins where visual openness matters more than acoustic isolation."],
    benefits: [
      { title: "The most cost-effective glazed option", body: "Single glazing gives the daylight and openness benefit of a glass wall at a lower per-sqm rate than a double-glazed acoustic build." },
      { title: "Slim sightlines throughout the floor", body: "A single pane in a slim frame keeps the visual profile light, suiting general open-plan glazed partitioning." },
    ],
    faqs: [
      { q: "Is single glazing private enough for a standard meeting room?", a: "It gives visual privacy but limited acoustic isolation - fine for general meeting rooms, but confidential discussions are better served by double-glazed acoustic glass." },
      { q: "Can single glazed partitions be upgraded to acoustic later?", a: "Not without replacing the glazing itself - if there's any chance a room will need more acoustic privacy later, it's worth discussing the double-glazed option with your Captain at quote stage." },
      { q: "Is single glazing suitable for exterior-facing walls?", a: "This range is specified for interior partitioning; exterior glazing falls under the building's own façade system, not this catalog." },
    ],
  },
  "partitions.glass.doubleGlazedAcoustic": {
    intro: ["Double glazed acoustic partitions use two panes of glass with an air gap between them, meaningfully cutting sound transfer compared with single glazing - the right spec for boardrooms, HR rooms, and any cabin where confidentiality actually matters."],
    benefits: [
      { title: "Real acoustic performance, not just a thicker wall", body: "The air gap between panes is what does the acoustic work, tested and rated for sound transmission loss rather than assumed." },
      { title: "Still keeps daylight moving through the floor", body: "Despite the extra glazing layer, the wall remains fully transparent - privacy comes from sound isolation, not from blocking light." },
    ],
    faqs: [
      { q: "How much better is double-glazed acoustic than single glazing for privacy?", a: "Meaningfully better for speech privacy - the air gap between panes is specifically what reduces sound transmission, which a single pane can't replicate regardless of thickness." },
      { q: "Which rooms actually need this over standard single glazing?", a: "Boardrooms, HR/confidential meeting rooms, and any cabin next to a noisy area are the typical candidates - general offices and corridors are usually fine with single glazing." },
      { q: "Does double glazing cost significantly more than single?", a: "It sits at a higher per-sqm rate reflecting the extra glass and frame depth - your Captain can give a direct comparison against single glazing for your specific room count." },
    ],
  },
  "partitions.gypsum.standardDrywall": {
    intro: ["Standard drywall is the everyday solid partition - studwork and board construction, paint-ready on handover, used wherever a wall needs full visual and reasonable acoustic separation without a fire rating requirement."],
    benefits: [
      { title: "The most cost-effective solid wall option", body: "Standard drywall is the baseline solid partition rate, appropriate for the majority of internal walls that don't have a specific fire rating requirement." },
      { title: "Easy to reconfigure or patch later", body: "Of all the partition types, standard drywall is the simplest to cut into, extend, or move if the layout changes down the line." },
    ],
    faqs: [
      { q: "When is standard drywall the right call instead of fire-rated?", a: "Anywhere the wall isn't on an egress route, stairwell, or plant room boundary - your Captain confirms which specific walls on your floor plate actually need a fire rating." },
      { q: "Does standard drywall include paint?", a: "The wall is handed over taped, skimmed, and paint-ready; final paint colour is typically scoped as part of the wider fit-out finishes." },
      { q: "How thick is a standard drywall partition?", a: "Thickness depends on the stud size and board layers specified, which your Captain confirms based on the acoustic and structural requirement for that specific wall." },
    ],
  },
  "partitions.gypsum.fireRatedDrywall": {
    intro: ["Fire-rated drywall uses a denser, glass-fibre-reinforced board to hold structural and fire integrity for a certified period - required wherever Civil Defense's fire strategy calls for a rated wall, typically corridors, stairwells, and plant room boundaries."],
    benefits: [
      { title: "Certified to a specific fire rating", body: "The board system is tested and certified (commonly 1 or 2 hour ratings), not a general assumption of fire resistance from a thicker standard wall." },
      { title: "Documented for authority approval", body: "Fire-rated wall specification is documented by your Captain as part of the Civil Defense approvals process if your fit-out needs it." },
    ],
    faqs: [
      { q: "How is fire-rated drywall different from standard drywall?", a: "It uses a different, denser board specification (typically glass-fibre reinforced) engineered to hold integrity under fire for a certified duration - it isn't simply a thicker version of the standard board." },
      { q: "Which walls in my fit-out actually need this?", a: "This depends on your building's fire strategy - typically corridor and stairwell-facing walls, and any wall separating a plant room - your Captain confirms exact requirements against your approved fire drawings." },
      { q: "Does fire-rated drywall look different once painted?", a: "No - once finished, a fire-rated wall looks identical to standard drywall; the difference is entirely in the certified board construction behind the paint." },
    ],
  },
  "partitions.demountable.modularPanel": {
    intro: ["Modular panel partitions are built from fixed panels on a demountable track system - full walls that can be lifted out and relocated without the demolition a fixed drywall build would need, suited to spaces expecting to be reconfigured."],
    benefits: [
      { title: "Full walls, not just an operable divider", body: "Modular panels build genuine fixed-looking partition walls, distinct from a sliding operable system, while still being relocatable." },
      { title: "Panels reuse when the layout changes", body: "Existing panels can be repositioned to a new layout rather than scrapped and rebuilt, recovering value on future reconfigurations." },
    ],
    faqs: [
      { q: "Does a modular panel wall look different from a fixed gypsum wall?", a: "It can be finished to look very similar, though the panel joints and track are a subtle visual difference from a fully monolithic gypsum build." },
      { q: "How long does it take to relocate a modular panel wall?", a: "Considerably faster than a demolish-and-rebuild gypsum wall - your Captain can give a specific estimate based on the wall length and layout change involved." },
      { q: "Can modular panels be glazed?", a: "Glazed modular panel options are available, combining the demountable benefit with visual openness - flag this preference when the wall type is being specced." },
    ],
  },
  "partitions.demountable.slidingPanel": {
    intro: ["Sliding panel systems let a room split into two or open back into one, with panels running along an overhead track - the standard solution for a meeting room that needs to flex between configurations depending on the day's bookings."],
    benefits: [
      { title: "One room, two configurations", body: "A sliding panel wall lets a space function as a single large room or split into two smaller ones without any physical rebuild." },
      { title: "No floor track to trip over", body: "Panels typically run on an overhead track, keeping the floor clear rather than requiring a visible floor-mounted rail." },
    ],
    faqs: [
      { q: "How much acoustic separation does a sliding panel wall give when closed?", a: "Reasonable separation for general use, though typically not to the level of a fixed double-glazed acoustic or gypsum wall - worth discussing with your Captain if the split rooms need strong sound isolation." },
      { q: "Can sliding panels be operated by one person?", a: "Most systems are designed for straightforward single-person operation, though very long or heavy panel runs may need to be confirmed against the specific product spec." },
      { q: "Is a sliding panel wall glazed or solid?", a: "Both glazed and solid panel finishes are available - glazed suits a boardroom wanting daylight continuity, solid suits a more private divided space." },
    ],
  },
  "partitions.solid.blockWall": {
    intro: ["Block wall is the most structural partition option - masonry construction used where a wall needs to carry real load, heavy wall-mounted equipment, or meet a specific structural/acoustic requirement beyond what stud construction offers."],
    benefits: [
      { title: "Genuine load-bearing and fixing capacity", body: "Block wall can carry heavy wall-mounted fixtures and equipment without the additional bracing a stud wall would need." },
      { title: "The best acoustic and fire performance available", body: "Solid masonry construction typically outperforms stud-based systems on both sound isolation and fire resistance." },
    ],
    faqs: [
      { q: "Why would an office fit-out need block wall instead of studwork?", a: "Server rooms, plant areas, or a landlord's specific structural requirement are the typical reasons - it's less common in general open-plan office areas." },
      { q: "Does block wall take longer to build than studwork?", a: "Yes, generally - block construction and curing takes longer than a stud-and-board build, which your Captain factors into the project timeline where this is specced." },
      { q: "Can block wall be finished the same as the rest of the office?", a: "Yes - it's handed over ready for the same paint or finish as any other wall in the fit-out." },
    ],
  },
  "partitions.solid.studworkWall": {
    intro: ["Studwork wall is a heavier-duty framed and boarded solid wall - more robust than standard drywall, used where extra durability or acoustic mass is needed without going as far as full block construction."],
    benefits: [
      { title: "A middle ground between drywall and block", body: "Heavier framing and board layers than standard drywall, without the full structural commitment (or install time) of block construction." },
      { title: "Good acoustic mass for the build time involved", body: "Studwork walls can be specified with additional board layers or insulation for improved sound isolation relative to a standard single-layer drywall build." },
    ],
    faqs: [
      { q: "How is studwork wall different from standard drywall?", a: "It typically uses heavier-gauge studs and/or additional board layers for improved durability and acoustic mass, compared with a standard single-layer drywall partition." },
      { q: "Is studwork wall suitable for wall-mounted TVs or shelving?", a: "With appropriate blocking/bracing specified at build stage, yes - flag any known wall-mounted fixtures to your Captain so backing is included where needed." },
      { q: "Does studwork wall need a fire rating?", a: "It can be specified with a fire rating where required, similar to the fire-rated drywall option under Gypsum Partitions - confirm the specific requirement for that wall with your Captain." },
    ],
  },
  "partitions.acoustic.acousticPanelWall": {
    intro: ["Acoustic panel walls use a tested, rated panel system specifically for sound transmission loss - the standard spec for phone booths, confidential meeting rooms, and any wall next to noise-sensitive or noise-generating spaces."],
    benefits: [
      { title: "Tested acoustic rating, not an assumption", body: "Panel systems carry certified sound transmission loss ratings, giving predictable acoustic performance rather than a general 'should be quiet enough' spec." },
      { title: "Faster to install than an equivalent masonry wall", body: "Panel-based acoustic systems generally install faster than achieving comparable acoustic performance from block or heavy studwork construction." },
    ],
    faqs: [
      { q: "What rooms typically need acoustic panel walls?", a: "Phone/call booths, HR and confidential meeting rooms, and walls adjacent to plant equipment or a noisy shared space are the common cases." },
      { q: "Do acoustic panel walls need a matching acoustic door?", a: "Yes, generally - an acoustic-rated wall with a standard door has a significant sound leak at the door, which is why the Acoustic Doors type exists to match it." },
      { q: "Can acoustic panels be finished to match the rest of the office?", a: "Yes - acoustic panels are available in a range of finishes and can be specified to coordinate with the surrounding interior palette." },
    ],
  },
  "partitions.acoustic.soundproofBoothWall": {
    intro: ["Soundproof booth-grade wall construction is the highest acoustic tier in the partition range - purpose-built for genuinely demanding isolation needs like a dedicated call studio or a room next to continuous noise."],
    benefits: [
      { title: "The highest acoustic rating in the partition range", body: "Booth-grade construction is specified and tested for demanding sound isolation requirements beyond standard acoustic panel walls." },
      { title: "Built as a complete system, not just a wall", body: "Booth-grade specification typically extends to matched doors, seals, and sometimes ceiling/floor treatment for a genuinely isolated space." },
    ],
    faqs: [
      { q: "How is this different from a standard acoustic panel wall?", a: "Soundproof booth-grade construction uses a heavier build and more comprehensive sealing system, rated for a higher degree of sound isolation than a standard acoustic panel wall." },
      { q: "What's a typical use case for booth-grade walls in an office?", a: "A dedicated recording/podcast space, a studio-adjacent room, or any space next to continuous, significant noise (plant equipment, a busy street-facing wall) are typical cases." },
      { q: "Does booth-grade construction need ventilation considered separately?", a: "Yes - a highly sealed acoustic space needs its ventilation planned specifically for that isolation level; this is coordinated with the HVAC trade rather than assumed." },
    ],
  },
  "partitions.aluminiumFramed.fullGlassFramed": {
    intro: ["Full glass framed partitions use slim aluminium framing around floor-to-ceiling glazing - the most transparent, architectural option in the range, typically specced for reception, boardrooms, and other client-facing areas."],
    benefits: [
      { title: "Maximum transparency with a considered frame", body: "Full-height glazing in a slim frame gives the most open, daylit result available in the partition range." },
      { title: "Consistent framing family across the floor", body: "Using the same aluminium frame system throughout keeps sightlines and finish consistent from reception through to the back-office cabins." },
    ],
    faqs: [
      { q: "Is full glass framed different from frameless glass doors/partitions?", a: "Yes - this uses a visible slim aluminium frame around the glazing, distinct from a frameless system which uses minimal hardware and no visible frame at all." },
      { q: "Where does this typically get specified?", a: "Reception, boardrooms, and other client-facing or feature areas where the partition system is part of the interior design statement." },
      { q: "Can full glass framed partitions include a solid lower section?", a: "That configuration is covered under the Glass-Gypsum Combo Framed style - full glass framed is fully transparent floor to ceiling." },
    ],
  },
  "partitions.aluminiumFramed.glassGypsumCombo": {
    intro: ["Glass-gypsum combo framed partitions pair a solid gypsum lower section (typically desk height) with glazing above - visual privacy at seated eye level while keeping light and openness through the upper portion of the wall."],
    benefits: [
      { title: "Privacy where it's needed, openness above it", body: "The solid lower section blocks sightlines at desk height, while glazing above keeps the sense of light and connection to the wider floor." },
      { title: "A common spec for cabins along a glazed corridor", body: "This configuration is frequently used for private offices that sit along an already-glazed corridor, keeping the corridor's visual continuity while giving the cabin real seated privacy." },
    ],
    faqs: [
      { q: "How tall is the solid lower section typically built?", a: "Commonly to desk height, though this is confirmed against the specific room's furniture layout and privacy requirement during design." },
      { q: "Can the gypsum lower section be finished differently from other walls?", a: "Yes - it can be painted, wallpapered, or finished with joinery to match the room's interior design rather than defaulting to the same finish as every other wall." },
      { q: "Is this more or less expensive than full glass framed?", a: "It typically sits at a comparable or slightly different rate depending on the gypsum-to-glass ratio - your Captain can give a direct comparison for your specific room." },
    ],
  },

  // ---------- Flooring ----------
  "flooring.tiles.porcelain": {
    intro: ["Porcelain tile is the denser, more wear-resistant option in the tile range - the standard spec for high-traffic commercial areas where long-term durability matters more than the lower upfront cost of ceramic."],
    benefits: [
      { title: "Built for heavy commercial foot traffic", body: "Porcelain's density holds up to years of daily office use, including the wear from rolling office chairs, better than ceramic." },
      { title: "Available in large-format for a premium, seamless look", body: "Large-format porcelain gives open-plan areas a more continuous, higher-end floor than smaller-format tile." },
    ],
    faqs: [
      { q: "Is porcelain worth the extra cost over ceramic?", a: "For high-traffic zones (reception, main corridors), yes - the wear and stain resistance translates to a longer service life; lower-footfall areas may not need the upgrade." },
      { q: "Does porcelain need special installation compared to ceramic?", a: "It's installed on the same levelling and adhesive basis as ceramic, though large-format porcelain in particular benefits from a well-prepared, flat subfloor - assessed by your Captain during site scoping." },
      { q: "Is porcelain slippery when wet?", a: "Slip-rated finishes are available for areas with any moisture exposure - flag this requirement for pantries or entrance zones when selecting the specific product." },
    ],
  },
  "flooring.tiles.ceramic": {
    intro: ["Ceramic tile is the more budget-conscious option in the tile range - a reliable, cost-effective finish for lower-footfall areas where porcelain's extra durability isn't essential."],
    benefits: [
      { title: "The most cost-effective tile option", body: "Ceramic delivers a genuine tile floor at a lower per-sqm rate than porcelain or natural stone." },
      { title: "Wide range of finishes and colours", body: "Ceramic tile ranges typically offer broad choice in colour, pattern, and finish for matching a specific interior palette." },
    ],
    faqs: [
      { q: "Where is ceramic the right choice over porcelain?", a: "Lower-traffic back-office areas, secondary corridors, or budget-conscious projects where the extra durability of porcelain isn't essential." },
      { q: "How does ceramic hold up under office chair castors?", a: "It performs adequately under normal office use, though very high-traffic zones with constant chair movement are better served by porcelain's greater density." },
      { q: "Can ceramic and porcelain be used in the same fit-out?", a: "Yes - it's common to specify porcelain for reception and main circulation, and ceramic for lower-visibility back-of-house areas, within the same quote." },
    ],
  },
  "flooring.tiles.naturalStone": {
    intro: ["Natural stone sits at the premium end of the tile range - genuine marble, granite, or limestone for reception and executive areas where the floor itself is meant to make a statement."],
    benefits: [
      { title: "A genuine material statement", body: "Real stone has a depth and variation no porcelain or ceramic finish fully replicates, typically reserved for a fit-out's most visible spaces." },
      { title: "Long-term durability with proper maintenance", body: "Natural stone holds up well over the long term when properly sealed and maintained, suiting a space expected to look premium for years." },
    ],
    faqs: [
      { q: "Where does natural stone typically get specified in an office?", a: "Reception, executive areas, and boardrooms are the most common locations - it's usually reserved for the fit-out's highest-visibility spaces given the cost premium." },
      { q: "Does natural stone need more maintenance than porcelain?", a: "Yes, generally - natural stone typically needs periodic sealing to maintain its finish and stain resistance, which porcelain doesn't require." },
      { q: "Is natural stone significantly more expensive than porcelain?", a: "It sits at the premium end of the tile range - your Captain can give a direct per-sqm comparison against porcelain for your specific area." },
    ],
  },
  "flooring.carpet.carpetTiles": {
    intro: ["Carpet tiles are the standard commercial carpet format - modular squares that can be replaced individually if a section wears or stains, without redoing the whole floor."],
    benefits: [
      { title: "Replace one tile, not the whole floor", body: "A worn or stained tile is swapped individually, keeping long-term maintenance cost and disruption low compared with broadloom." },
      { title: "Wide range of patterns and colourways", body: "Carpet tile ranges typically offer more pattern and colour flexibility than broadloom, useful for zoning different areas visually." },
    ],
    faqs: [
      { q: "Why are carpet tiles the default commercial choice over broadloom?", a: "The ability to replace individual tiles rather than an entire floor section is a significant long-term maintenance advantage in a space that sees years of daily use." },
      { q: "Can carpet tiles be laid in a pattern for wayfinding or zoning?", a: "Yes - different colours or patterns are commonly used to visually define zones (a team area, a walkway) across an open-plan floor." },
      { q: "How are carpet tiles fixed to the subfloor?", a: "Typically with a releasable adhesive that allows tiles to be lifted for replacement or access to the subfloor, included as part of the installation rate." },
    ],
  },
  "flooring.carpet.broadloom": {
    intro: ["Broadloom is carpet installed as a single continuous sheet rather than individual tiles - a more seamless look, typically specified for boardrooms or executive areas rather than large open-plan zones."],
    benefits: [
      { title: "A genuinely seamless carpet surface", body: "No visible tile joints across the floor, giving a more premium, continuous look than carpet tile." },
      { title: "Suits smaller, defined rooms well", body: "Broadloom is well suited to boardrooms and individual offices where the room's full carpet can be planned as one continuous piece." },
    ],
    faqs: [
      { q: "Why isn't broadloom used across a whole open-plan floor?", a: "Localised damage or staining generally means replacing a full section or room rather than one tile, which makes it less practical for large, heavily-used open areas than carpet tile." },
      { q: "Is broadloom more expensive than carpet tile?", a: "Pricing is comparable per square metre in many cases; the bigger practical difference is long-term maintenance and replacement flexibility rather than upfront cost." },
      { q: "What rooms is broadloom best suited to?", a: "Boardrooms, executive offices, and other smaller, defined rooms where a seamless look matters and the room isn't subject to the heaviest daily traffic." },
    ],
  },
  "flooring.carpet.carpetPlanks": {
    intro: ["Carpet planks use a plank format rather than square tiles, giving a more linear, directional laying pattern - a contemporary alternative to standard square carpet tile with similar practical benefits."],
    benefits: [
      { title: "A more contemporary linear look", body: "Plank format creates a directional, linear pattern distinct from the grid look of standard square carpet tile." },
      { title: "Still replaces section by section", body: "Individual planks can be replaced similarly to carpet tile, keeping the same long-term maintenance advantage." },
    ],
    faqs: [
      { q: "How is carpet plank different from standard carpet tile?", a: "The main difference is format - planks are longer and narrower than standard square tiles, creating a more linear laying pattern, while offering similar performance and replaceability." },
      { q: "Does plank format cost more than square carpet tile?", a: "Pricing is broadly comparable - the choice is primarily aesthetic rather than a significant cost trade-off." },
      { q: "Can carpet planks be laid in a herringbone or brick pattern?", a: "Yes - plank formats commonly support directional laying patterns like brick or herringbone for a more distinctive floor design." },
    ],
  },
  "flooring.vinyl.lvt": {
    intro: ["LVT (luxury vinyl tile) is a flexible vinyl product that closely replicates timber or stone visuals at a lower cost than the real material - a popular mid-range flooring choice for Dubai offices."],
    benefits: [
      { title: "Realistic wood and stone visuals", body: "LVT replicates natural material finishes closely enough for most commercial settings, at a meaningfully lower cost than genuine timber or stone." },
      { title: "Quieter and warmer underfoot than hard tile", body: "LVT has more give than porcelain or ceramic, making it more comfortable for areas with sustained foot traffic." },
    ],
    faqs: [
      { q: "How does LVT compare to SPC?", a: "LVT is a flexible vinyl product; SPC uses a rigid stone-composite core beneath a similar wear layer, giving SPC better dent and temperature stability at a typically higher cost." },
      { q: "Is LVT durable enough for a busy office?", a: "Yes, for typical office foot traffic - very heavy-traffic zones may benefit from SPC's added rigidity or a hard tile finish instead." },
      { q: "Can LVT show dents from heavy furniture?", a: "It can be more prone to pressure marks under heavy point loads than SPC or hard tile - furniture pads are recommended, and your Captain can advise on the right product for areas with heavy furniture." },
    ],
  },
  "flooring.vinyl.vinylSheet": {
    intro: ["Vinyl sheet is installed as large continuous rolls rather than individual tiles or planks - a seamless finish with fewer joints, often specified for wet areas or spaces wanting a more clinical, continuous look."],
    benefits: [
      { title: "Fewer joints, easier to keep clean", body: "Continuous sheet installation reduces the number of seams compared with tile or plank formats, which matters in wet or high-hygiene areas." },
      { title: "Well suited to wet or utility areas", body: "Sheet vinyl's seamless nature makes it a strong choice for pantries, wet zones, or utility spaces where moisture and cleaning are a factor." },
    ],
    faqs: [
      { q: "Where does vinyl sheet make more sense than LVT or SPC?", a: "Wet areas, pantries, or spaces wanting a more seamless, low-joint finish are the typical cases - general open-plan desk areas usually use LVT or SPC instead." },
      { q: "Is vinyl sheet available in wood or stone-look finishes?", a: "Yes, similar visual ranges to LVT are available in sheet format, though it's most commonly specified for its practical seamless benefits in utility-type spaces." },
      { q: "How is vinyl sheet installed compared to tile products?", a: "It's rolled out and adhered as continuous sheets with heat-welded or sealed seams where sheets meet, rather than individual tile installation." },
    ],
  },
  "flooring.vinyl.spc": {
    intro: ["SPC (stone plastic composite) uses a rigid core beneath a vinyl wear layer, giving it better dent and temperature stability than standard LVT - one of the fastest-growing commercial flooring choices for exactly that reason."],
    benefits: [
      { title: "A rigid core that resists dents", body: "SPC's stone-composite core holds up to heavy furniture and foot traffic better than flexible LVT, without a significant cost jump." },
      { title: "More dimensionally stable under temperature change", body: "The rigid core resists the slight expansion and contraction that flexible vinyl can show under Dubai's temperature swings." },
    ],
    faqs: [
      { q: "Is SPC worth the extra cost over standard LVT?", a: "For areas with heavier furniture or higher traffic, yes - the rigid core's dent and stability advantage is the main reason to step up from LVT." },
      { q: "Does SPC feel different underfoot than LVT?", a: "It's slightly firmer underfoot given the rigid core, though both are considerably softer and quieter than hard tile." },
      { q: "Is SPC waterproof?", a: "Most SPC products offer strong water resistance suitable for typical office use - confirm exact specification with your Captain if a specific wet-area use case is involved." },
    ],
  },
  "flooring.laminate.standard": {
    intro: ["Standard laminate gives a convincing timber-look finish at the most accessible price point in the flooring range - suited to dry, general office areas rather than spaces with moisture exposure."],
    benefits: [
      { title: "The most accessible timber-look option", body: "Standard laminate delivers a genuine wood-grain finish at a lower per-sqm rate than engineered timber, LVT, or premium finishes." },
      { title: "Fast, straightforward installation", body: "Laminate's click-lock installation is quick to fit, helping keep flooring off the critical path on a tight project timeline." },
    ],
    faqs: [
      { q: "Is standard laminate suitable for a busy open-plan office?", a: "It performs well under normal office foot traffic - the very highest-traffic zones (main corridors, reception) are usually better served by tile or SPC vinyl." },
      { q: "Should standard laminate be avoided near pantries or wet areas?", a: "Yes - standard laminate isn't moisture-resistant; the Waterproof Laminate style is the better choice for any area with occasional spill or moisture risk." },
      { q: "How does standard laminate compare to LVT on price?", a: "Laminate generally sits at a lower per-sqm rate than LVT for a comparable timber-look finish." },
    ],
  },
  "flooring.laminate.waterproof": {
    intro: ["Waterproof laminate closes most of the performance gap that used to exist between laminate and vinyl for moisture resistance - a realistic option even for areas that see occasional spills, not just dry desk space."],
    benefits: [
      { title: "Genuine moisture resistance", body: "Waterproof laminate holds up to occasional spills and moisture exposure that would damage standard laminate over time." },
      { title: "Extends laminate's timber look to more of the floor", body: "Areas near a pantry or with any damp risk no longer have to switch to a different flooring type just for moisture resistance." },
    ],
    faqs: [
      { q: "Is waterproof laminate suitable for a full wet area like a bathroom?", a: "It's built for occasional moisture exposure (spills, humidity) rather than constant standing water - a genuinely wet area is better served by tile or vinyl sheet." },
      { q: "Does waterproof laminate cost more than standard?", a: "Yes, it sits at a higher rate reflecting the additional moisture-resistant core construction." },
      { q: "Does waterproof laminate look different from standard laminate?", a: "Visually very similar - the performance difference is in the core construction, not the visible finish." },
    ],
  },
  "flooring.coatings.epoxy": {
    intro: ["Epoxy coating is a hard, chemical-resistant applied floor finish - the default for workshop, warehouse, and plant room floors where forklift traffic or chemical exposure would wear through standard flooring quickly."],
    benefits: [
      { title: "Genuinely heavy-duty performance", body: "Epoxy holds up to forklift traffic, chemical spills, and constant heavy use in a way no tile, vinyl, or timber product is built for." },
      { title: "Fully seamless with no grout or joints", body: "A seamless applied finish eliminates joints as a wear or cleaning issue, important in industrial or high-hygiene environments." },
    ],
    faqs: [
      { q: "Where does epoxy coating typically get used in a commercial fit-out?", a: "Warehouse floors, workshops, plant rooms, and any area with forklift traffic or chemical exposure are the standard use cases." },
      { q: "How long does epoxy take to cure before the floor can be used?", a: "Cure time varies by product and coating thickness - your Captain confirms an exact timeline once the spec and area are finalised." },
      { q: "Is epoxy slippery?", a: "Slip-resistant additive finishes are available where safety underfoot matters - flag this requirement when the coating spec is chosen." },
    ],
  },
  "flooring.coatings.polishedConcrete": {
    intro: ["Polished concrete grinds and polishes the existing slab into a smooth, reflective finish - increasingly used as a deliberate design choice in offices and retail-adjacent spaces, not only warehouse floors."],
    benefits: [
      { title: "A distinctive, low-maintenance design finish", body: "Polished concrete has become a legitimate aesthetic choice for reception and open-plan areas wanting an industrial-contemporary look." },
      { title: "No separate flooring material needed", body: "Since it works with the existing slab, polished concrete avoids the material cost of laying an entirely new floor product on top." },
    ],
    faqs: [
      { q: "Is polished concrete suitable for an office reception area?", a: "Yes - it's increasingly specified as a deliberate design finish, though it reads as a more industrial aesthetic than tile or timber-look flooring, worth confirming it matches your intended look." },
      { q: "Does the existing slab need to be in good condition for polishing?", a: "Yes - the finished look depends on the underlying slab's condition; your Captain assesses this during site scoping before confirming feasibility." },
      { q: "Is polished concrete cold underfoot?", a: "It can feel cooler underfoot than carpet or vinyl, which is a factor worth considering for areas with sustained standing or seated use." },
    ],
  },
  "flooring.coatings.puCoating": {
    intro: ["PU (polyurethane) coating offers more flexibility and better UV/abrasion resistance over time than epoxy, suiting some higher-traffic or partially exposed areas where epoxy's harder, more brittle finish is a poorer fit."],
    benefits: [
      { title: "Better flexibility than epoxy", body: "PU coatings tolerate slight substrate movement better than epoxy, reducing the risk of cracking over time in some applications." },
      { title: "Stronger UV and abrasion resistance", body: "Where a coated floor sees sunlight or heavy abrasive wear, PU generally holds its finish longer than standard epoxy." },
    ],
    faqs: [
      { q: "When is PU coating chosen over epoxy?", a: "Where the floor sees UV exposure, needs more flexibility, or faces heavier abrasive wear over time - your Captain can advise which suits your specific space." },
      { q: "Is PU coating more expensive than epoxy?", a: "It can sit at a different price point depending on the specific product and performance tier - your Captain gives a direct comparison for your project." },
      { q: "Can PU coating be applied over an existing epoxy floor?", a: "This depends on the existing floor's condition and compatibility - assessed during site scoping rather than assumed." },
    ],
  },
  "flooring.raisedAccess.calciumSulphate": {
    intro: ["Calcium sulphate raised access panels are the lighter-duty, more cost-effective option for server and comms rooms - full under-floor cable access without the load capacity (or cost) of steel panels."],
    benefits: [
      { title: "Cost-effective for standard technical rooms", body: "Calcium sulphate panels suit typical server/comms room requirements at a lower cost than steel panel systems." },
      { title: "Full cable access underneath", body: "Panels lift individually for cable routing and maintenance, same core benefit as any raised access system." },
    ],
    faqs: [
      { q: "Is calcium sulphate strong enough for server room equipment?", a: "It suits standard server/comms room loads - genuinely heavy equipment or high-traffic technical spaces are better served by steel panels, which your Captain can advise on." },
      { q: "What finish goes on top of calcium sulphate panels?", a: "Carpet tile, vinyl, or another finish can be applied on top to match the surrounding floor - the panel system itself is a substrate, not the visible finish." },
      { q: "How does calcium sulphate compare to steel on cost?", a: "It sits at a lower rate than steel panel systems, reflecting its lighter-duty load rating." },
    ],
  },
  "flooring.raisedAccess.steelPanel": {
    intro: ["Steel raised access panels handle higher point loads and heavier-duty use than calcium sulphate - specified for trading floors, high-density server rooms, or any technical space with genuinely heavy equipment."],
    benefits: [
      { title: "Higher load capacity for heavy equipment", body: "Steel panels handle greater point loads than calcium sulphate, suiting server rooms with dense, heavy equipment racks." },
      { title: "Better durability under high-traffic technical use", body: "Steel panel systems hold up to more frequent panel lifting and heavier foot/equipment traffic over time." },
    ],
    faqs: [
      { q: "When does a technical space need steel over calcium sulphate panels?", a: "High-density server rooms, trading floors, or any space with genuinely heavy equipment loads - your Captain assesses this against your actual equipment plan." },
      { q: "Is steel panel flooring noisier underfoot than calcium sulphate?", a: "It can have a slightly different underfoot sound/feel, though this is generally not a significant factor in the technical spaces where steel is specified." },
      { q: "Does steel panel flooring cost significantly more?", a: "Yes, it sits at a higher rate reflecting the greater load capacity and material cost." },
    ],
  },

  // ---------- Doors ----------
  "doors.flush.laminate": {
    intro: ["Laminate flush doors give a durable, consistent finish across every opening - the standard, cost-effective door spec for most rooms in an office fit-out."],
    benefits: [
      { title: "Consistent and durable across many doors", body: "Laminate holds up well to daily use and stays visually consistent across dozens of openings on a single floor plate." },
      { title: "The most cost-effective flush door finish", body: "Laminate gives a clean, professional look at a lower per-door rate than veneer." },
    ],
    faqs: [
      { q: "Does laminate show wear faster than veneer?", a: "Laminate is generally very durable and resists scuffing well - veneer's main advantage is aesthetic warmth, not durability." },
      { q: "Are laminate doors available in wood-look finishes?", a: "Yes - laminate finishes commonly replicate timber grain visually, at a lower cost than genuine veneer." },
      { q: "Can laminate doors be fire-rated?", a: "Fire-rated doors are covered under the dedicated Fire-Rated Doors type - flag if a specific opening needs both a laminate-look finish and a fire rating." },
    ],
  },
  "doors.flush.veneer": {
    intro: ["Veneer flush doors use a thin layer of real timber over the door core - a warmer, more premium look than laminate, typically specced for higher-visibility openings."],
    benefits: [
      { title: "A genuine timber look and feel", body: "Real wood veneer gives natural grain variation that laminate can't fully replicate." },
      { title: "A step up in finish for visible openings", body: "Veneer is often reserved for higher-visibility doors - private offices, meeting rooms - while laminate covers general back-of-house openings." },
    ],
    faqs: [
      { q: "Is veneer significantly more expensive than laminate?", a: "It sits at a higher per-door rate reflecting the real timber veneer layer - your Captain can compare directly against laminate for your specific door count." },
      { q: "Does veneer need more maintenance than laminate?", a: "Under normal office use, no special extra maintenance is required, though it's worth avoiding harsh abrasive cleaning on any timber veneer finish." },
      { q: "Can veneer match specific timber species used elsewhere in the fit-out?", a: "Veneer species and finish can often be matched to other timber elements in the interior design - flag this coordination need to your Captain." },
    ],
  },
  "doors.glass.framed": {
    intro: ["Framed glass doors use a standard aluminium frame around the glazing - matching framed glass partition systems, and the more budget-conscious glazed door option compared with frameless."],
    benefits: [
      { title: "Matches framed glass partition systems", body: "Consistent framing between doors and partitions keeps a glazed corridor or cabin run looking coordinated." },
      { title: "A more accessible glazed door option", body: "Framed glass doors cost less than frameless while still giving the visual openness of a glass door." },
    ],
    faqs: [
      { q: "Do framed glass doors work with any partition system?", a: "They pair most naturally with aluminium-framed glass partitions for a consistent look - your Captain can advise on matching if partitions are a different system." },
      { q: "Can framed glass doors be fitted with access control?", a: "Yes - electronic locking and access control hardware can be specified on framed glass doors." },
      { q: "Are framed glass doors as strong as a solid timber door?", a: "They're built to standard commercial glazing safety requirements (toughened glass, certified framing) appropriate for interior office use." },
    ],
  },
  "doors.glass.frameless": {
    intro: ["Frameless glass doors use minimal patch hardware instead of a visible frame - the most premium, minimal option in the glass door range, typically paired with frameless or slim partition glazing."],
    benefits: [
      { title: "The most minimal, premium glazed door look", body: "No visible frame means the door reads as a continuous piece of glass, the cleanest possible glazed door aesthetic." },
      { title: "Pairs naturally with frameless partition glazing", body: "Where partitions are also frameless, matching doors keep the whole glazed run visually seamless." },
    ],
    faqs: [
      { q: "Why are frameless glass doors more expensive than framed?", a: "They use heavier toughened glass and specialised patch hardware (floor springs, patch fittings) rather than a standard frame system, which costs more per door." },
      { q: "Do frameless doors need special hardware for closers and hinges?", a: "Yes - patch fittings and floor springs designed specifically for frameless glass are used rather than standard door hardware." },
      { q: "Are frameless doors harder to fit with access control?", a: "Access control can still be integrated, though the hardware options are somewhat more specific to frameless glass systems - your Captain can confirm compatibility." },
    ],
  },
  "doors.fireRated.oneHour": {
    intro: ["1 hour rated fire doors are the standard fire door specification for most internal openings requiring a rating - certified to hold fire integrity for one hour, per UAE Civil Defense requirements."],
    benefits: [
      { title: "Meets the standard rating most openings require", body: "A 1-hour rating covers the majority of internal fire-separation requirements in a typical commercial fit-out." },
      { title: "Certified door, frame, and hardware as one assembly", body: "The full door assembly is supplied and installed to hold its certified rating, not individually-sourced parts that may not perform as a system." },
    ],
    faqs: [
      { q: "How do I know if an opening needs a 1-hour or 2-hour rating?", a: "This depends on your building's approved fire strategy - your Captain confirms exact requirements per opening against your Civil Defense-approved drawings." },
      { q: "Can a 1-hour fire door be glazed?", a: "Yes - certified fire-rated vision panels are available within the size limits that maintain the door's rating." },
      { q: "Does a 1-hour fire door look different from a standard door?", a: "It can be finished to look similar to a standard flush or veneer door - the rating comes from the certified core construction, not a distinct visible appearance." },
    ],
  },
  "doors.fireRated.twoHour": {
    intro: ["2 hour rated fire doors provide a higher level of fire integrity, typically required for stairwell doors and other critical egress-route openings under UAE Civil Defense requirements."],
    benefits: [
      { title: "The higher-rated tier for critical openings", body: "2-hour rated doors are specified where the building's fire strategy calls for the highest level of separation, commonly stairwells." },
      { title: "Certified as a complete assembly", body: "Door, frame, and hardware are supplied and installed together as a certified system to maintain the 2-hour rating." },
    ],
    faqs: [
      { q: "Which openings typically require a 2-hour rating?", a: "Stairwell doors and other critical egress-route openings are the most common - confirmed against your building's approved fire strategy by your Captain." },
      { q: "Is a 2-hour door heavier or thicker than a 1-hour door?", a: "Generally yes - achieving the higher rating typically requires a denser core and sometimes a thicker door leaf, which your Captain and the door supplier confirm against the certified product." },
      { q: "Does a 2-hour rated door need different hardware than a 1-hour door?", a: "Hardware must be certified compatible with the specific rated assembly - this is supplied as part of the door package rather than sourced separately." },
    ],
  },
  "doors.timberVeneer.standard": {
    intro: ["Standard timber veneer doors give a genuine wood look for general offices and meeting rooms - a more cost-effective veneer grade than the premium/feature tier."],
    benefits: [
      { title: "A cost-effective real-timber option", body: "Standard veneer gives genuine wood grain at a more accessible rate than premium/feature grade." },
      { title: "Suits general offices and meeting rooms well", body: "Appropriate for most non-feature openings wanting a warmer look than laminate." },
    ],
    faqs: [
      { q: "How is standard veneer different from premium/feature veneer?", a: "Premium/feature grade uses higher-consistency grain selection and sometimes book-matched panels, typically reserved for the most visible doors - standard veneer is a more cost-effective grade for general use." },
      { q: "Is standard veneer durable enough for daily office use?", a: "Yes - factory-finished veneer doors are built for normal commercial daily use without special extra maintenance." },
      { q: "Can standard veneer doors be stained a specific colour?", a: "Veneer typically comes in a range of factory finishes/stains - check the specific product range or flag a custom colour need to your Captain." },
    ],
  },
  "doors.timberVeneer.premium": {
    intro: ["Premium/feature veneer doors use higher-consistency grain selection, sometimes book-matched panels - reserved for the most visible openings in a fit-out, like a boardroom or executive office."],
    benefits: [
      { title: "The highest-grade timber look in the door range", body: "Premium veneer selection gives more consistent, higher-quality grain than standard veneer." },
      { title: "Suited to a fit-out's most visible doors", body: "Typically specified for boardrooms, executive offices, or feature openings where the door is a genuine design element." },
    ],
    faqs: [
      { q: "Where should premium/feature veneer be specified rather than standard?", a: "Boardrooms, executive offices, and reception-adjacent openings - anywhere the door itself is a visible design element rather than a purely functional one." },
      { q: "Does premium veneer cost significantly more than standard?", a: "It sits at a higher rate reflecting the more selective grain and finish quality - your Captain can compare directly for your specific opening count." },
      { q: "Can premium veneer doors be book-matched across a pair of doors?", a: "Book-matching (mirrored grain across adjacent panels) can be specified for feature double-door openings - raise this with your Captain during design." },
    ],
  },
  "doors.sliding.singleTrack": {
    intro: ["Single track sliding doors run along the wall face on a surface-mounted track - the simpler, more budget-conscious sliding door option compared with a fully recessed pocket door."],
    benefits: [
      { title: "No wall cavity construction required", body: "A surface-mounted track avoids the need to build a special wall cavity, making it easier to add to an existing wall than a pocket door." },
      { title: "A more cost-effective space-saving option", body: "Gives most of the floor-space benefit of a sliding door at a lower cost and simpler installation than a pocket system." },
    ],
    faqs: [
      { q: "Is a single track door as clean-looking as a pocket door?", a: "The track and door remain visible on the wall face when open, unlike a pocket door which disappears fully into the wall - a trade-off for the simpler installation." },
      { q: "Can a single track door be added to an existing wall?", a: "Yes, more readily than a pocket door, since it doesn't require a special cavity to be built into the wall." },
      { q: "Does a single track door need much wall space beside the opening?", a: "Yes - it needs a length of wall face beside the opening for the door to slide across; your Captain confirms this fits your specific layout." },
    ],
  },
  "doors.sliding.pocket": {
    intro: ["Pocket doors slide fully into a built wall cavity, disappearing completely when open - the cleanest sliding door option, requiring the wall to be constructed to receive it."],
    benefits: [
      { title: "Disappears completely when open", body: "A true pocket door leaves no visible door or track when open, the cleanest possible result for a minimal aesthetic." },
      { title: "No swing arc or visible track to plan around", body: "Once installed, a pocket door has no footprint at all in the room when open, maximising usable floor space." },
    ],
    faqs: [
      { q: "Does a pocket door need special wall construction?", a: "Yes - the wall needs a cavity built specifically to receive the door, which is far easier to plan during a full fit-out than to retrofit into an already-finished wall." },
      { q: "Can a pocket door be added to an existing finished wall?", a: "It's possible but considerably more disruptive than during initial construction - your Captain assesses feasibility against your specific wall." },
      { q: "Is a pocket door as private/sealed as a hinged door?", a: "A well-fitted pocket door seals reasonably well, though a hinged door with proper weatherstripping generally still edges it out on acoustic seal for rooms with a strict privacy requirement." },
    ],
  },
  "doors.acoustic.standardAcoustic": {
    intro: ["Standard acoustic doors are built to match the sound isolation of an acoustic-rated wall - the right spec for private offices and meeting rooms with an acoustic partition or wall build."],
    benefits: [
      { title: "Matches the door to the wall's rating", body: "Prevents a standard door from undermining the sound isolation of an otherwise acoustic-rated room." },
      { title: "Suits typical private office and meeting room needs", body: "Covers the acoustic requirement for most confidential or quiet-need rooms without stepping up to studio-grade." },
    ],
    faqs: [
      { q: "Do I need an acoustic door if the wall itself is already acoustic-rated?", a: "Yes - sound transmission finds the weakest point in an assembly, and a standard door in an acoustic-rated wall undermines much of the wall's performance." },
      { q: "How is a standard acoustic door different from a fire-rated door?", a: "They address different requirements - acoustic doors are built and sealed for sound transmission loss, fire-rated doors for fire integrity; a door can be specified to meet both where a room needs it." },
      { q: "Does an acoustic door need special hinges or a heavier frame?", a: "Yes - acoustic performance depends on the door's seal and frame system as much as the door leaf itself, supplied as a matched assembly." },
    ],
  },
  "doors.acoustic.studioGrade": {
    intro: ["Studio grade acoustic doors provide the highest sound isolation tier in the door range - built for demanding use cases like a recording booth or studio-adjacent space."],
    benefits: [
      { title: "The highest acoustic performance available", body: "Studio-grade construction uses heavier cores and more robust seal systems than standard acoustic doors." },
      { title: "Matched to booth-grade acoustic wall construction", body: "Pairs with the Soundproof Booth Wall subtype for a genuinely isolated space, not just a quieter-than-average room." },
    ],
    faqs: [
      { q: "When is studio-grade necessary over standard acoustic doors?", a: "Dedicated recording/podcast spaces, or any room needing the most serious sound isolation available in the range - most private offices and meeting rooms are adequately served by standard acoustic doors." },
      { q: "Are studio-grade doors heavier than standard doors?", a: "Yes, generally - the denser core construction needed for the higher acoustic rating adds weight, which is factored into the frame and hardware specification." },
      { q: "Does studio-grade construction affect the door's appearance?", a: "It can be finished to look similar to other doors in the fit-out - the acoustic performance comes from the core and seal construction, not a distinct visible design." },
    ],
  },

  // ---------- Ceiling ----------
  "ceiling.gypsum.standard": {
    intro: ["Standard gypsum ceiling gives a flush, paint-ready finish - the base specification for a clean, seamless overhead without the added detailing of a decorative build."],
    benefits: [
      { title: "A clean, flush finish", body: "No visible grid or tile joints, reading as a single continuous ceiling surface." },
      { title: "The more cost-effective gypsum option", body: "Standard gypsum gives the flush-ceiling look without the extra labour of bulkheads or feature drops." },
    ],
    faqs: [
      { q: "How is standard gypsum different from decorative gypsum?", a: "Standard gives a flat, flush finish; decorative gypsum adds bulkheads, coves, or feature drops for a more architectural ceiling design." },
      { q: "Does standard gypsum ceiling include lighting cutouts?", a: "Yes - recessed lighting cutouts are coordinated with the electrical/lighting trade and included as part of the ceiling build where specified." },
      { q: "Can standard gypsum be upgraded to decorative later?", a: "Some decorative elements can be added after the fact, but it's more efficient to decide on any bulkheads or feature drops before the initial ceiling build - raise this during design if there's any chance of wanting decorative detail later." },
    ],
  },
  "ceiling.gypsum.decorative": {
    intro: ["Decorative gypsum ceilings add bulkheads, coves, and feature drops beyond a flat standard build - specified where the ceiling itself needs to be part of the room's design, typically reception or boardrooms."],
    benefits: [
      { title: "Architectural detail a flat ceiling can't offer", body: "Bulkheads, coves, and level changes give the ceiling genuine design presence rather than a purely functional flat surface." },
      { title: "Can integrate lighting as a designed feature", body: "Coves and drops are commonly used to conceal or feature cove lighting, integrating the lighting design with the ceiling architecture." },
    ],
    faqs: [
      { q: "Where does decorative gypsum typically get specified?", a: "Reception, boardrooms, and other feature areas where the ceiling is meant to contribute to the overall design impression, not just conceal services." },
      { q: "Does decorative gypsum take longer to install than standard?", a: "Yes - the additional framing and detailing work takes longer than a flat standard build, which your Captain factors into the project timeline." },
      { q: "Can decorative gypsum incorporate a stretch ceiling panel as a feature?", a: "Combining ceiling types (a gypsum bulkhead framing a stretch ceiling panel, for example) is possible and increasingly common - discuss the specific design with your Captain." },
    ],
  },
  "ceiling.suspendedGrid.mineralFiber": {
    intro: ["Mineral fibre tile is the standard, cost-effective suspended grid ceiling finish - good acoustic absorption at an accessible rate, the default choice for most open-plan office areas."],
    benefits: [
      { title: "The most cost-effective grid tile option", body: "Mineral fibre gives a reliable, serviceable ceiling at the most accessible rate in the suspended grid range." },
      { title: "Good acoustic absorption as standard", body: "Mineral fibre tile naturally absorbs some sound, contributing to a quieter open-plan environment without a dedicated acoustic panel spec." },
    ],
    faqs: [
      { q: "Is mineral fibre tile durable enough for a busy office?", a: "Yes, it's a standard, well-proven commercial ceiling product suited to normal office conditions." },
      { q: "How does mineral fibre compare to metal tile on look?", a: "Mineral fibre has a more matte, traditional ceiling tile appearance; metal tile gives a cleaner, more contemporary look at a higher cost." },
      { q: "Can mineral fibre tiles be replaced individually if damaged?", a: "Yes - that's the core benefit of a grid ceiling system; any tile lifts out and can be replaced without affecting the rest of the ceiling." },
    ],
  },
  "ceiling.suspendedGrid.metalTile": {
    intro: ["Metal tile gives a cleaner, more contemporary look than mineral fibre within the same suspended grid system - more durable, at a higher per-sqm rate."],
    benefits: [
      { title: "A more contemporary, refined look", body: "Metal tile reads as considerably cleaner and more modern than standard mineral fibre in the same grid system." },
      { title: "More durable than mineral fibre", body: "Metal tile resists damage and general wear better over the long term than a fibre-based tile." },
    ],
    faqs: [
      { q: "Does metal tile fit into the same grid as mineral fibre?", a: "Yes - both drop into the same standard suspended grid system, making it straightforward to mix tile types across different zones of one floor." },
      { q: "Is metal tile noisier (more echo) than mineral fibre?", a: "Bare metal can be more reflective acoustically than fibre tile - perforated or acoustic-backed metal tile options are available where both the look and sound absorption matter." },
      { q: "How much more does metal tile cost than mineral fibre?", a: "It sits at a noticeably higher rate reflecting the material and finish quality - your Captain can give a direct comparison for your floor area." },
    ],
  },
  "ceiling.stretch.matte": {
    intro: ["Matte stretch ceiling gives a soft, even tensioned-membrane finish similar in feel to painted gypsum, but installed considerably faster and completely seamless."],
    benefits: [
      { title: "A soft, even finish with no visible joints", body: "The tensioned membrane spans the ceiling with a smooth matte look and zero visible seams." },
      { title: "Faster to install than an equivalent gypsum finish", body: "A stretch membrane goes up considerably faster than achieving a comparable flush look with framed and finished gypsum." },
    ],
    faqs: [
      { q: "How does matte stretch ceiling compare to standard gypsum on look?", a: "Visually similar in its flat, even finish, though achieved through a completely different (and faster) construction method." },
      { q: "Can lighting be integrated into a matte stretch ceiling?", a: "Yes - recessed and cove lighting details can be built into a stretch ceiling design, coordinated with the electrical trade." },
      { q: "Does a stretch ceiling allow access to services above it?", a: "Access points can be designed in where needed, but it isn't as freely accessible as a suspended grid tile - flag any known future access needs when this type is specced." },
    ],
  },
  "ceiling.stretch.glossPrinted": {
    intro: ["Gloss and printed stretch ceilings create a reflective or custom-graphic feature surface unavailable from any traditional ceiling material - a distinctive choice for reception and breakout feature areas."],
    benefits: [
      { title: "A genuinely distinctive feature ceiling", body: "Gloss and printed finishes create a look that's very difficult to replicate with tile, gypsum, or any other ceiling type." },
      { title: "Custom graphics or branding possible", body: "Printed stretch ceilings can carry custom artwork or branding, commonly specified for reception or breakout feature areas." },
    ],
    faqs: [
      { q: "What can be printed onto a stretch ceiling?", a: "Custom graphics, patterns, or branding can be printed directly onto the membrane - your Captain can advise on file requirements and lead time for a custom design." },
      { q: "Does a gloss finish reflect light noticeably?", a: "Yes - gloss stretch ceilings are reflective by design, which is often part of the intended feature effect, particularly with good lighting design underneath." },
      { q: "Is a printed stretch ceiling more expensive than matte?", a: "Custom printing adds to the base stretch ceiling rate - your Captain can quote based on the specific design and area." },
    ],
  },
  "ceiling.acoustic.feltPanel": {
    intro: ["Felt acoustic panels give a soft, contemporary, often colour-customisable ceiling finish with genuine sound absorption - a common choice for open-plan zones needing reverberation control."],
    benefits: [
      { title: "Genuine acoustic absorption with a soft aesthetic", body: "Felt panels perform acoustically while giving a warmer, more tactile look than a standard tile ceiling." },
      { title: "Colour and shape customisation available", body: "Felt panel systems often offer more flexibility in colour and panel shape than other acoustic ceiling options." },
    ],
    faqs: [
      { q: "How does felt panel compare to wood wool for acoustic performance?", a: "Both provide genuine sound absorption; the choice between them is largely aesthetic - felt gives a smoother, more colour-flexible finish, wood wool a more textured, natural look." },
      { q: "Can felt panels be shaped into custom patterns?", a: "Many felt acoustic systems support custom shapes and layouts as a design feature, not just a flat grid of panels - discuss options with your Captain." },
      { q: "Do felt panels need to cover the whole ceiling to be effective?", a: "No - concentrating panels over the areas with the worst reverberation (open-plan desk clusters, breakout zones) is typically more cost-effective than full coverage." },
    ],
  },
  "ceiling.acoustic.woodWool": {
    intro: ["Wood wool acoustic panels give a natural, textured finish with genuine sound absorption - a distinctive alternative to felt panel for offices wanting a more organic material look."],
    benefits: [
      { title: "A natural, textured acoustic finish", body: "Wood wool's raw material texture gives a distinctly different look from smooth felt panels, while performing similarly on sound absorption." },
      { title: "Durable and low-maintenance", body: "Wood wool panels hold up well over time with minimal maintenance required." },
    ],
    faqs: [
      { q: "Is wood wool as effective acoustically as felt panel?", a: "Both provide genuine, tested sound absorption - the choice between them is largely about the aesthetic (textured/natural vs smooth/colour-flexible) rather than a meaningful performance gap." },
      { q: "Can wood wool panels be painted or finished in different colours?", a: "Some wood wool products are available pre-finished in a range of tones - check the specific product range with your Captain for colour options." },
      { q: "Where does wood wool typically get specified over felt?", a: "Spaces wanting a more natural, organic material palette - often paired with timber flooring or furniture for a coordinated look." },
    ],
  },
  "ceiling.wooden.timberSlat": {
    intro: ["Timber slat ceilings use individual linear timber battens, often over an acoustic backing - a defining feature choice in a lot of recent Dubai office fit-outs for reception and breakout zones."],
    benefits: [
      { title: "A warm, linear architectural feature", body: "Individual timber slats create a distinctive linear rhythm that reads as a genuine design feature, not just a ceiling finish." },
      { title: "Can combine the look with real acoustic performance", body: "Slat systems are commonly built over an acoustic felt or fibre backing, giving both the timber aesthetic and genuine sound absorption." },
    ],
    faqs: [
      { q: "Is a timber slat ceiling purely decorative, or does it help with acoustics too?", a: "It can be both - slat systems are frequently built with an acoustic backing material behind the visible timber, giving genuine sound absorption alongside the aesthetic." },
      { q: "Where does timber slat typically get used in an office?", a: "Reception and breakout areas are the most common locations, often used to visually define a zone against a more neutral ceiling elsewhere on the floor." },
      { q: "Is timber slat ceiling real wood or a wood-look material?", a: "Both genuine timber and high-quality timber-look alternatives are available - your Captain can advise on the right spec for your budget and maintenance preference." },
    ],
  },
  "ceiling.wooden.veneerPanel": {
    intro: ["Veneer panel ceilings use flat timber-veneer-faced panels for a more solid, continuous wood surface than slat systems - a warm, premium finish for feature ceiling areas."],
    benefits: [
      { title: "A continuous timber surface, not a slatted look", body: "Veneer panels give a more solid, unbroken wood ceiling compared with the linear gaps of a slat system." },
      { title: "A premium, considered finish", body: "Veneer panel ceilings read as a genuinely high-end material choice, typically reserved for a fit-out's most visible areas." },
    ],
    faqs: [
      { q: "How is veneer panel ceiling different from timber slat?", a: "Veneer panels give a flat, continuous wood surface; slat ceilings use individual linear battens with gaps between them, often over an acoustic backing - the choice is largely aesthetic." },
      { q: "Does veneer panel ceiling need acoustic treatment separately?", a: "A flat veneer panel ceiling doesn't inherently provide the same acoustic absorption as a slat-with-backing system - if acoustics are a priority alongside the timber look, discuss options with your Captain." },
      { q: "Can veneer panels include access points for services?", a: "Access panels can be designed into a veneer ceiling where needed for maintenance access - flag this requirement during the ceiling design stage." },
    ],
  },
  "ceiling.metal.aluminiumStrip": {
    intro: ["Aluminium strip ceilings give a linear, slatted metal look - contemporary and highly durable, commonly used in more industrial or design-forward office fit-outs."],
    benefits: [
      { title: "A clean, linear contemporary look", body: "Strip systems create a rhythmic linear pattern distinct from a flat panel or tile ceiling." },
      { title: "Highly durable and low-maintenance", body: "Aluminium resists damage, moisture, and general wear with minimal upkeep required." },
    ],
    faqs: [
      { q: "Is aluminium strip ceiling noisy or echo-prone?", a: "A bare metal strip ceiling can increase reverberation - perforated or acoustic-backed strip options are available where both the look and sound absorption matter." },
      { q: "How does aluminium strip compare to steel panel on cost?", a: "Pricing varies by specific product and finish - your Captain can give a direct comparison for your project." },
      { q: "Can aluminium strip ceilings be finished in different colours?", a: "Yes - powder-coated colour finishes are available beyond standard mill/anodised aluminium - discuss options with your Captain." },
    ],
  },
  "ceiling.metal.steelPanel": {
    intro: ["Steel panel ceilings give a flatter, more uniform metal surface than strip systems - durable and well suited to areas needing a robust, low-maintenance overhead finish."],
    benefits: [
      { title: "A flat, uniform metal surface", body: "Steel panels give a more continuous look than linear strip systems, while retaining metal's durability advantage." },
      { title: "Strong performance in higher-humidity areas", body: "Steel panel ceilings hold up well in areas like pantries or near wet zones where moisture resistance matters." },
    ],
    faqs: [
      { q: "Is steel panel ceiling removable for access like a suspended grid?", a: "Some steel panel systems are designed for removability similar to a suspended grid; others are more fixed - confirm the specific access requirement with your Captain." },
      { q: "How does steel panel compare to aluminium strip aesthetically?", a: "Steel panel gives a flatter, more uniform surface; aluminium strip gives a linear, slatted look - the choice is primarily aesthetic, both share metal's durability benefit." },
      { q: "Can steel panels be perforated for acoustic performance?", a: "Yes - perforated and acoustic-backed steel panel options are available where sound absorption matters alongside the metal finish." },
    ],
  },

  // ---------- HVAC ----------
  "hvac.splitUnits.wallMounted": {
    intro: ["Wall-mounted split units are the simplest, most visible air conditioning option - a compact indoor unit mounted directly on the wall, connected to an outdoor condenser."],
    benefits: [
      { title: "Simple, proven, and cost-effective", body: "Wall-mounted splits are a well-understood, widely serviceable technology for cooling individual rooms." },
      { title: "Straightforward installation", body: "Generally the fastest split system configuration to install, with no ducting required." },
    ],
    faqs: [
      { q: "Is a wall-mounted unit noisy?", a: "Modern wall-mounted split units run quietly under normal operation." },
      { q: "Can a wall-mounted unit cool more than one room?", a: "It's designed for a single room or open area - cooling multiple separate rooms is better served by a ducted split or VRF system." },
      { q: "Does a wall-mounted unit need to be visible?", a: "Yes - the indoor unit is mounted on the wall face; a ducted split is the option if a hidden indoor unit is preferred." },
    ],
  },
  "hvac.splitUnits.ductedSplit": {
    intro: ["Ducted split systems hide the indoor unit above the ceiling, distributing air through short duct runs to diffusers - a cleaner look than a wall-mounted unit, for rooms where a visible unit isn't wanted."],
    benefits: [
      { title: "No visible indoor unit", body: "The indoor unit sits above the ceiling, with only diffusers visible in the room - a cleaner aesthetic than a wall-mounted box." },
      { title: "Can serve more than one diffuser point", body: "Short duct runs allow one indoor unit to distribute air to multiple diffusers across a small room or a couple of adjacent spaces." },
    ],
    faqs: [
      { q: "Does a ducted split cost more than a wall-mounted unit?", a: "Generally yes, reflecting the ducting and concealed installation work - your Captain can compare directly for your specific room." },
      { q: "How much ceiling void does a ducted split need?", a: "Enough space above the ceiling for the unit and duct runs - your Captain confirms feasibility against your specific ceiling height and void." },
      { q: "Can a ducted split cool a small suite of rooms?", a: "Within limits, yes - a small number of adjacent spaces can be served through short duct runs, though a larger multi-zone requirement is better served by VRF." },
    ],
  },
  "hvac.vrf.indoorUnits": {
    intro: ["VRF indoor units are the individual room/zone units connected to a shared outdoor system - each independently controlled, giving true zone-by-zone temperature control across a large floor plate."],
    benefits: [
      { title: "Independent control per zone", body: "Each indoor unit can be set and controlled separately, so different rooms and zones don't have to share one temperature setting." },
      { title: "Available in multiple form factors", body: "Ceiling cassette, ducted, and wall-mounted indoor unit types are all available within a VRF system, matched to each room's needs." },
    ],
    faqs: [
      { q: "How many VRF indoor units does a typical floor need?", a: "This depends on floor area, room layout, and zoning requirements - your Captain calculates this against your actual floor plan." },
      { q: "Can VRF indoor units be different types in the same system?", a: "Yes - a mix of ceiling cassette, ducted, and wall-mounted indoor units can be served by the same outdoor system, matched to each room's specific need." },
      { q: "Are VRF indoor units noisy?", a: "They generally run quietly, appropriate for occupied office space - specific noise ratings vary by product and are confirmed during specification." },
    ],
  },
  "hvac.vrf.outdoorSystem": {
    intro: ["The VRF outdoor system is the shared condenser unit serving all the indoor units on a floor or building - sized against total cooling load and occupancy."],
    benefits: [
      { title: "Efficient at scale", body: "One outdoor system serving many indoor units is significantly more efficient than multiple standalone condensers." },
      { title: "Sized to your building's real capacity needs", body: "Outdoor system sizing is calculated against total floor area, occupancy, and indoor unit count, not a generic assumption." },
    ],
    faqs: [
      { q: "Where does the outdoor VRF system get installed?", a: "Typically on the building's rooftop or a designated plant area - your Captain confirms location and any structural/access requirements with the building." },
      { q: "How is the outdoor system sized?", a: "Based on total cooling load across all served indoor units and zones, calculated during the HVAC design stage." },
      { q: "Does the outdoor system need regular maintenance?", a: "Yes, like any HVAC condenser system - routine maintenance keeps it running efficiently, which your Captain can advise on as part of ongoing facilities needs." },
    ],
  },
  "hvac.ductedPackage.rooftop": {
    intro: ["Rooftop package units keep all cooling equipment off the floor plate entirely, mounted on the building roof - a common choice for larger buildings where roof access is practical."],
    benefits: [
      { title: "Keeps equipment off the floor plate", body: "All major equipment sits on the roof rather than taking up interior space or ceiling void." },
      { title: "Consolidates cooling capacity in one unit", body: "A single rooftop package unit can serve significant floor area, simplifying the overall system versus many smaller units." },
    ],
    faqs: [
      { q: "Does a rooftop unit need special building approval?", a: "Larger rooftop equipment may need to be checked against the building's structural and landlord requirements - confirmed early so it doesn't become a late-stage surprise." },
      { q: "How does conditioned air get from a rooftop unit to the floor below?", a: "Through ductwork running from the rooftop unit down through the building to diffusers on the served floor - scoped alongside the Ductwork type." },
      { q: "Is a rooftop unit noisier than other HVAC options?", a: "Since it's located on the roof rather than within occupied space, rooftop units generally have less noise impact on the office itself than an indoor-mounted alternative." },
    ],
  },
  "hvac.ductedPackage.indoorPackage": {
    intro: ["Indoor package units consolidate cooling capacity into one larger indoor-mounted unit - the alternative to a rooftop unit where roof access or space isn't practical."],
    benefits: [
      { title: "Works where rooftop placement isn't practical", body: "Suits buildings without convenient roof access, or where a landlord restricts rooftop equipment." },
      { title: "Consolidates capacity in one unit", body: "Similar benefit to a rooftop package - handling significant cooling load in one system rather than many smaller distributed units." },
    ],
    faqs: [
      { q: "Where is an indoor package unit typically located?", a: "In a dedicated plant room or mechanical space within the building - your Captain confirms the right location based on your building's layout." },
      { q: "Does an indoor package unit take up usable floor space?", a: "It requires a plant room or dedicated mechanical area, which is factored into the space plan rather than sitting within the occupied office floor." },
      { q: "Is an indoor package unit as efficient as a rooftop unit?", a: "Efficiency depends on the specific product and installation rather than indoor vs outdoor placement alone - your Captain can advise based on your building's constraints." },
    ],
  },
  "hvac.ductwork.sheetMetal": {
    intro: ["Sheet metal duct is rigid ductwork used for the main trunk runs in an HVAC system, carrying larger air volumes from the unit toward diffuser branches."],
    benefits: [
      { title: "Handles the main air volume reliably", body: "Rigid construction suits the higher air volumes and pressure of main trunk duct runs." },
      { title: "Durable, long-lasting installation", body: "Sheet metal duct holds its shape and performance over the long term better than flexible alternatives for main runs." },
    ],
    faqs: [
      { q: "Why use sheet metal instead of flexible duct for the whole system?", a: "Sheet metal is better suited to main trunk runs carrying larger air volumes; flexible duct is used for shorter final connections where its ease of routing around obstacles is the advantage." },
      { q: "Does sheet metal duct need insulation?", a: "Yes - insulation is included as standard to prevent condensation and heat loss/gain along the run." },
      { q: "Is sheet metal duct routed above the ceiling only?", a: "Typically yes, within the ceiling void, coordinated with the ceiling and electrical trades sharing the same space." },
    ],
  },
  "hvac.ductwork.flexibleDuct": {
    intro: ["Flexible duct is used for shorter final connections from the main trunk to individual diffusers - faster and easier to route around obstacles than rigid sheet metal."],
    benefits: [
      { title: "Easier to route around obstacles", body: "Flexible duct bends around structural elements and other services more easily than rigid sheet metal, useful for final connections in a tight ceiling void." },
      { title: "Faster installation for final connections", body: "Quicker to fit than rigid duct for the shorter runs it's typically used for." },
    ],
    faqs: [
      { q: "Is flexible duct used for the whole HVAC system?", a: "No - it's typically used for shorter final connections into diffusers, while rigid sheet metal duct handles the main trunk runs carrying larger air volumes." },
      { q: "Does flexible duct perform as well as rigid duct?", a: "For its intended use (short final connections) it performs well; it isn't a substitute for rigid duct on main trunk runs, where airflow efficiency over distance matters more." },
      { q: "Does flexible duct need insulation too?", a: "Yes, insulation is included as standard on flexible duct runs, same as sheet metal." },
    ],
  },
  "hvac.diffusers.supplyDiffusers": {
    intro: ["Supply diffusers deliver conditioned air into the room - positioned against your actual furniture and desk layout to avoid drafts and ensure even coverage."],
    benefits: [
      { title: "Positioned against your real layout", body: "Placement is planned against actual desk and furniture positions, not an even grid that ignores where people actually sit." },
      { title: "Styled to match the ceiling type", body: "Diffuser styles are available to suit suspended grid, gypsum, or feature ceiling systems." },
    ],
    faqs: [
      { q: "Can diffuser placement cause drafts?", a: "Yes, if positioned poorly - your Captain plans placement against your actual seating layout specifically to avoid this." },
      { q: "How many supply diffusers does a typical open-plan area need?", a: "This is calculated against the room's cooling load and area during HVAC design, not a fixed ratio - your Captain confirms exact count and placement." },
      { q: "Are diffusers adjustable after installation?", a: "Some airflow direction adjustment is possible after fitting, but major repositioning means moving ductwork - getting placement right at design stage matters." },
    ],
  },
  "hvac.diffusers.returnGrilles": {
    intro: ["Return grilles pull air back into the HVAC system to be re-conditioned - working alongside supply diffusers to keep a room properly balanced."],
    benefits: [
      { title: "Balances the room's airflow", body: "Correctly sized and placed return grilles are what keep a room from becoming over- or under-pressurised relative to supply air." },
      { title: "Styled to match the ceiling and diffusers", body: "Return grille styles coordinate visually with the supply diffusers and ceiling type in the same room." },
    ],
    faqs: [
      { q: "What's the difference between a supply diffuser and a return grille?", a: "Supply diffusers deliver conditioned air into the room; return grilles pull air back into the system - a balanced layout needs both in the right ratio and position." },
      { q: "Does every room need its own return grille?", a: "Most rooms benefit from dedicated return air path, either through a grille or a ducted return, confirmed during HVAC design based on the room's use and size." },
      { q: "Can return grilles double as a design element?", a: "They're primarily functional, though finish and style options are available to keep them visually consistent with the rest of the ceiling design." },
    ],
  },
  "hvac.freshAir.ahu": {
    intro: ["Air handling units bring outside air into the building's ventilation system, conditioning it before distribution - the supply side of a fresh air ventilation system."],
    benefits: [
      { title: "Brings genuine outside air into the space", body: "Addresses air quality directly, which cooling capacity alone doesn't solve." },
      { title: "Sized to occupancy, not just floor area", body: "Fresh air requirements scale with actual headcount, factored in alongside standard HVAC sizing." },
    ],
    faqs: [
      { q: "Is an air handling unit the same as the main HVAC system?", a: "No - it specifically handles fresh air intake and conditioning, working alongside (not replacing) the main cooling system." },
      { q: "How much fresh air does a typical office need per person?", a: "This follows UAE building ventilation requirements based on occupancy - your Captain confirms exact requirements for your floor area and headcount." },
      { q: "Does the AHU affect the overall cooling load?", a: "Yes - bringing in outside air (especially in Dubai's climate) adds to the total cooling load, factored into overall HVAC sizing." },
    ],
  },
  "hvac.freshAir.exhaustSystems": {
    intro: ["Exhaust systems remove stale air, odours, and moisture from pantries, bathrooms, and enclosed spaces - the extraction side of a balanced fresh air ventilation system."],
    benefits: [
      { title: "Removes odour and moisture at the source", body: "Targeted extraction from pantries and wet areas prevents stale air and moisture building up in enclosed spaces." },
      { title: "Keeps the building properly balanced", body: "Exhaust extraction works alongside fresh air supply to keep the space neither over- nor under-pressurised." },
    ],
    faqs: [
      { q: "Where do exhaust systems typically get installed?", a: "Pantries, bathrooms, and any enclosed space generating odour or moisture are the most common locations." },
      { q: "Is exhaust ventilation required by code?", a: "UAE building regulations generally require exhaust ventilation for specific room types like bathrooms and kitchens - your Captain confirms exact requirements for your fit-out." },
      { q: "Does an exhaust system need its own ductwork?", a: "Yes - dedicated exhaust ductwork routes from the extraction point to the building's exhaust discharge, scoped alongside the main ductwork trade." },
    ],
  },

  // ---------- Electrical ----------
  "electrical.powerWiring.standardCircuit": {
    intro: ["Standard circuits cover general desk and appliance power needs - the baseline electrical wiring specification for most of an office floor plate."],
    benefits: [
      { title: "Covers general office power needs reliably", body: "Standard circuit wiring is sized for typical desk, lighting, and general appliance loads across an office floor." },
      { title: "The most cost-effective wiring specification", body: "Standard circuits are the baseline rate in the power wiring range, appropriate for the majority of a floor plate." },
    ],
    faqs: [
      { q: "Is standard circuit wiring enough for a typical desk setup?", a: "Yes, for standard computer, monitor, and general equipment loads - genuinely high-draw equipment needs the Heavy Duty circuit type instead." },
      { q: "Can standard circuits be added to later if headcount grows?", a: "It's possible but more disruptive after walls and ceilings are closed - worth discussing reasonable headroom with your Captain at the design stage if growth is expected." },
      { q: "Does standard circuit wiring need DEWA inspection?", a: "Yes, as part of the overall electrical installation inspection your Captain manages if your fit-out requires authority approval." },
    ],
  },
  "electrical.powerWiring.heavyDuty": {
    intro: ["Heavy duty and sub-mains wiring is specified for genuinely higher power demand areas - server rooms, kitchen equipment, or heavy machinery that standard circuits aren't sized for."],
    benefits: [
      { title: "Sized for real high-draw equipment", body: "Heavy-duty circuits and sub-mains are calculated against the actual equipment load, rather than trying to stretch standard circuits beyond their capacity." },
      { title: "Isolates high-demand loads from general circuits", body: "Keeping heavy-duty equipment on its own dedicated wiring avoids overloading or disrupting general office circuits." },
    ],
    faqs: [
      { q: "What kind of equipment typically needs heavy-duty circuits?", a: "Server rooms, commercial kitchen equipment, EV charging, and similar higher-draw loads are the common cases - flag any of these to your Captain during quoting." },
      { q: "Does heavy-duty wiring need a bigger distribution board?", a: "It's coordinated with the Distribution Boards type - specialty boards are often specified alongside heavy-duty circuits for higher-demand areas." },
      { q: "Is heavy-duty wiring significantly more expensive than standard?", a: "Yes, reflecting the larger cable sizing and additional design work - your Captain can quote based on the specific equipment load involved." },
    ],
  },
  "electrical.dataCabling.copper": {
    intro: ["Copper Cat cabling handles the vast majority of standard office data and phone connections - the default data cabling specification for desk-level connectivity."],
    benefits: [
      { title: "Covers standard office connectivity reliably", body: "Cat cabling handles typical computer, VoIP phone, and device connections across an office floor." },
      { title: "The most cost-effective data cabling option", body: "Copper cabling is the standard rate for desk-level connections, appropriate for the majority of an office's data points." },
    ],
    faqs: [
      { q: "Is copper cabling fast enough for modern office needs?", a: "Yes, for typical desk-level connectivity - fibre is reserved for backbone runs or genuinely high-bandwidth requirements, covered under the Fiber Optic style." },
      { q: "How many data points does a typical desk need?", a: "Commonly two to four points per desk, confirmed against your actual equipment plan during electrical design." },
      { q: "Is copper cabling tested after installation?", a: "Yes - all data cabling is tested and certified after installation, confirming every point works before handover." },
    ],
  },
  "electrical.dataCabling.fiber": {
    intro: ["Fiber optic cabling is specified for backbone runs between comms rooms or floors, or wherever very high bandwidth is genuinely required - distinct from standard desk-level copper cabling."],
    benefits: [
      { title: "Handles significantly higher bandwidth", body: "Fiber supports much greater data throughput than copper, suited to backbone connections carrying aggregated traffic." },
      { title: "Performs over longer distances", body: "Fiber doesn't suffer the same signal degradation over distance that copper does, useful for longer backbone runs between floors or comms rooms." },
    ],
    faqs: [
      { q: "Does every office need fiber optic cabling?", a: "Not necessarily at desk level - most offices only need fiber for backbone connections between a comms room and floor distribution points, with copper handling individual desk connections." },
      { q: "Is fiber more expensive than copper cabling?", a: "Yes, generally, reflecting the cable and termination cost - your Captain scopes it specifically for backbone runs rather than desk-level connections to manage cost appropriately." },
      { q: "Can fiber be added later if bandwidth needs grow?", a: "It's possible but more disruptive after the fit-out is complete - worth flagging any known future bandwidth needs to your Captain at design stage." },
    ],
  },
  "electrical.distributionBoards.lightingPower": {
    intro: ["Lighting and power distribution boards handle the standard circuit distribution for general office lighting and power needs - the baseline distribution board specification."],
    benefits: [
      { title: "Covers general lighting and power distribution", body: "Sized for typical office lighting circuits and standard power circuits across the floor plate." },
      { title: "Sized with reasonable headroom", body: "Board capacity is calculated with headroom for future minor additions, not a bare minimum spec." },
    ],
    faqs: [
      { q: "Is a lighting & power board sufficient for a whole floor?", a: "For general lighting and standard power circuits, yes - higher-demand areas (server rooms, heavy equipment) are better served by a specialty board alongside it." },
      { q: "How is board capacity decided?", a: "Calculated against your full lighting, power, and general equipment plan during electrical design, with reasonable headroom built in." },
      { q: "Are lighting and power on the same board, or separate?", a: "They can share a board or be split depending on the floor's specific circuit design - your Captain confirms the right configuration during electrical design." },
    ],
  },
  "electrical.distributionBoards.specialty": {
    intro: ["Specialty distribution boards serve higher-demand or isolated circuits - server rooms, kitchen equipment, EV charging - kept separate from general lighting and power distribution."],
    benefits: [
      { title: "Isolates higher-demand circuits", body: "Keeping specialty loads on their own board prevents them from affecting or overloading general lighting and power distribution." },
      { title: "Matched to the specific equipment it serves", body: "Specialty boards are sized and specified against the actual equipment they're serving, not a generic assumption." },
    ],
    faqs: [
      { q: "When does a fit-out need a specialty distribution board?", a: "Wherever there's a server room, commercial kitchen equipment, EV charging, or another significant isolated load - your Captain identifies this during electrical design." },
      { q: "Does a specialty board need its own DEWA approval consideration?", a: "It's included as part of the overall electrical load approval process your Captain manages if your fit-out requires DEWA sign-off." },
      { q: "Can a specialty board be added later if new equipment is introduced?", a: "It's possible but more disruptive than planning for it upfront - flag any known future equipment plans (like EV charging) to your Captain during quoting." },
    ],
  },
  "electrical.switchesSockets.standard": {
    intro: ["The standard switches and sockets range covers every general office electrical fitting need reliably and cost-effectively."],
    benefits: [
      { title: "Reliable, cost-effective fittings", body: "Standard switches and sockets cover the vast majority of a floor plate's needs at an accessible rate." },
      { title: "Consistent across the whole office", body: "Using the standard range throughout keeps fittings visually and functionally consistent floor-wide." },
    ],
    faqs: [
      { q: "Is the standard range durable enough for daily commercial use?", a: "Yes - it's specified for normal commercial daily use across a typical office." },
      { q: "Can USB sockets be included in the standard range?", a: "Combination power/USB sockets are available as a specification option within the standard range - flag this preference when the electrical layout is finalised." },
      { q: "Where should the premium/designer range be used instead?", a: "Reception, boardrooms, and executive areas where the fitting itself is visible and part of the interior finish - see the Premium/Designer Range style." },
    ],
  },
  "electrical.switchesSockets.premium": {
    intro: ["The premium/designer range gives switches and sockets a finish quality suited to visible, higher-end areas - reception, boardrooms, and executive offices."],
    benefits: [
      { title: "A finish that matches a premium interior", body: "Designer-range fittings are chosen for visual quality, appropriate for spaces where the fitting itself is part of the finish." },
      { title: "Available in a range of premium finishes", body: "Metal, matte, and other premium finish options are typically available beyond the standard white/plastic range." },
    ],
    faqs: [
      { q: "How much more does the premium range cost than standard?", a: "It sits at a noticeably higher per-point rate reflecting the finish quality - your Captain can quote based on how many points need the upgrade." },
      { q: "Does the premium range function differently from standard fittings?", a: "Functionally similar - the difference is primarily in finish quality and material, not electrical performance." },
      { q: "Can premium fittings be specified for just a few rooms rather than the whole floor?", a: "Yes - it's common to specify premium fittings only in reception, boardrooms, and executive offices, with standard fittings elsewhere." },
    ],
  },
  "electrical.emergencyLighting.circuitWiring": {
    intro: ["Emergency lighting circuit wiring provides the dedicated electrical infrastructure for escape route illumination, specified to UAE life-safety code."],
    benefits: [
      { title: "Dedicated circuits for life-safety compliance", body: "Emergency lighting is wired on its own dedicated circuits, separate from general lighting, per Civil Defense requirements." },
      { title: "Coordinated with the main lighting design", body: "Emergency circuits are planned alongside standard lighting so escape route illumination is genuinely continuous." },
    ],
    faqs: [
      { q: "Is emergency lighting circuit wiring different from standard lighting circuits?", a: "Yes - it's wired as dedicated life-safety circuits, often with battery backup or connection to an emergency power source, distinct from general lighting circuits." },
      { q: "Does this need to be documented for Civil Defense?", a: "Yes - emergency lighting circuit design and placement is documented by your Captain as part of the authority approvals process." },
      { q: "How often is emergency lighting tested?", a: "Testing frequency follows Civil Defense requirements - control systems (see the Control Systems style) can automate much of this ongoing testing." },
    ],
  },
  "electrical.emergencyLighting.controlSystems": {
    intro: ["Emergency lighting control systems automate testing and fault monitoring for the emergency lighting circuit, reducing reliance on manual periodic checks alone."],
    benefits: [
      { title: "Automates routine testing", body: "Control systems can run scheduled self-tests on emergency fixtures, flagging faults automatically rather than relying solely on manual inspection." },
      { title: "Simplifies ongoing compliance", body: "Automated monitoring makes it easier to maintain and demonstrate ongoing Civil Defense compliance over the life of the fit-out." },
    ],
    faqs: [
      { q: "Is a control system required, or just circuit wiring on its own?", a: "Requirements vary by building and scope - your Captain confirms whether a control system is needed or recommended for your specific fit-out." },
      { q: "Does the control system replace manual testing entirely?", a: "It significantly reduces the manual testing burden, though periodic manual verification is still generally good practice alongside automated monitoring." },
      { q: "Can an emergency lighting control system integrate with building management systems?", a: "Depending on the specific product, integration with a wider building management system may be possible - discuss this with your Captain if relevant to your building." },
    ],
  },
  "electrical.earthing.earthing": {
    intro: ["Earthing systems protect the building's electrical installation and occupants by providing a safe path for fault current - foundational infrastructure for every other electrical system in the fit-out."],
    benefits: [
      { title: "Protects the entire electrical system", body: "A correctly designed earthing system protects every circuit and piece of equipment connected to it, not just the point where a fault occurs." },
      { title: "Verified through testing, not assumed", body: "Earthing resistance is tested as part of the electrical sign-off process, confirming the system meets code requirements." },
    ],
    faqs: [
      { q: "Does every fit-out need its own earthing system, or does the building already have one?", a: "Most commercial buildings have base building earthing infrastructure that a fit-out's electrical system ties into - your Captain confirms what's already in place and what specifically needs to be added or verified." },
      { q: "How is earthing system integrity verified?", a: "Earthing resistance testing is carried out as part of the electrical installation sign-off, confirming the system meets code requirements before handover." },
      { q: "Is earthing something that shows up in a walkthrough of the finished space?", a: "No - it's foundational infrastructure that doesn't have a visible finish, but is checked during authority approval and matters for the safety of everything else electrical in the fit-out." },
    ],
  },
  "electrical.earthing.lightningProtection": {
    intro: ["Lightning protection systems are primarily a building-level system relevant to rooftop and structural design, specified against the building's height and exposure per UAE code."],
    benefits: [
      { title: "Specified against your building's actual exposure", body: "Lightning protection design follows the building's height and site exposure, not a one-size-fits-all assumption." },
      { title: "Documented for authority sign-off", body: "Design is documented as part of the authority approvals process where relevant to your fit-out scope." },
    ],
    faqs: [
      { q: "Is lightning protection relevant for a mid-floor office fit-out?", a: "It's primarily relevant to fit-outs that include rooftop plant, antennas, or other rooftop-level work rather than a typical mid-floor office fit-out on its own." },
      { q: "Who is typically responsible for a building's overall lightning protection?", a: "Base building lightning protection is generally the landlord/building's responsibility - a fit-out's involvement is usually limited to any rooftop-level additions the project includes." },
      { q: "Does lightning protection need periodic testing?", a: "Yes, lightning protection systems typically require periodic inspection and testing to confirm ongoing integrity, per standard building maintenance practice." },
    ],
  },

  // ---------- CCTV ----------
  "cctv.dome.indoor": {
    intro: ["Indoor dome cameras give discreet, general-purpose coverage for reception, corridors, and open-plan office areas - not rated for outdoor exposure."],
    benefits: [
      { title: "Discreet indoor coverage", body: "The low-profile dome housing suits general indoor areas without drawing visual attention." },
      { title: "Cost-effective for standard indoor needs", body: "Indoor dome cameras are the standard, accessible option for typical office coverage." },
    ],
    faqs: [
      { q: "Can indoor dome cameras be used near a window or entrance?", a: "They can cover areas visible through glass, but the camera itself should remain in a genuinely indoor, non-weather-exposed location - use the outdoor variant for actual exterior mounting." },
      { q: "How many indoor dome cameras does a reception area typically need?", a: "This depends on the room's layout and entry points - your Captain can recommend a placement plan for your specific space." },
      { q: "Do indoor dome cameras work well in low light?", a: "Most indoor dome products include reasonable low-light performance suited to typical office lighting conditions - specific low-light capability depends on the exact product selected." },
    ],
  },
  "cctv.dome.outdoor": {
    intro: ["Outdoor/weatherproof dome cameras extend dome-style discreet coverage to exterior or covered outdoor areas - rated to withstand weather exposure."],
    benefits: [
      { title: "Weather-rated for exterior use", body: "Built to withstand outdoor conditions, unlike the standard indoor dome variant." },
      { title: "Keeps the same discreet housing style outdoors", body: "Extends the low-profile dome aesthetic to entrances and outdoor areas rather than switching to a more visible camera style." },
    ],
    faqs: [
      { q: "Is the outdoor dome variant more expensive than indoor?", a: "Yes, reflecting the weatherproof housing and rating - your Captain can quote based on your specific outdoor coverage needs." },
      { q: "Where do outdoor dome cameras typically get used?", a: "Covered entrances, outdoor walkways, and building perimeters where a discreet (rather than obviously visible) camera style is preferred." },
      { q: "Do outdoor dome cameras need special cabling?", a: "Cabling is run and weatherproofed appropriately for outdoor installation, included as part of the per-camera installation rate." },
    ],
  },
  "cctv.bullet.standard": {
    intro: ["Standard bullet cameras give visible, directional coverage for entrances and general perimeter monitoring - a clear visual deterrent alongside functional coverage."],
    benefits: [
      { title: "Clearly visible as a deterrent", body: "The obvious housing and directional mount make bullet cameras an intentional visual signal at entry points." },
      { title: "Straightforward to aim and verify coverage", body: "Easy to see exactly what a bullet camera is covering, useful for entrances where coverage needs to be precise." },
    ],
    faqs: [
      { q: "Are standard bullet cameras suitable for a main entrance?", a: "Yes - this is one of the most common use cases, giving both visible deterrence and clear directional coverage of who enters." },
      { q: "How is standard different from long-range bullet cameras?", a: "Standard suits typical entrance and short-to-medium distance coverage; long-range/perimeter is specified for covering greater distances, like a long driveway or building boundary." },
      { q: "Do standard bullet cameras work at night?", a: "Most include infrared or low-light capability suited to entrance monitoring after dark - exact specification depends on the product chosen." },
    ],
  },
  "cctv.bullet.longRange": {
    intro: ["Long-range/perimeter bullet cameras extend effective coverage distance for outdoor boundaries, driveways, or wide approach areas beyond what a standard bullet camera covers well."],
    benefits: [
      { title: "Covers greater distances effectively", body: "Extended range capability suits perimeter and boundary monitoring where the area to cover is larger than a standard entrance." },
      { title: "Still functions as a visible deterrent", body: "Retains the same directional, visible housing style as standard bullet cameras, just with extended coverage range." },
    ],
    faqs: [
      { q: "When is long-range/perimeter needed instead of standard bullet cameras?", a: "Wherever the camera needs to cover real distance - a long driveway, a building perimeter, or a wide outdoor boundary - rather than a single entry point." },
      { q: "Is a long-range camera more expensive than standard?", a: "Yes, generally, reflecting the extended range optics and capability." },
      { q: "Can long-range cameras be combined with standard bullet cameras on one system?", a: "Yes - it's common to use long-range cameras on the perimeter and standard bullet or dome cameras at entrances and indoors, all on one recording system." },
    ],
  },
  "cctv.ptz.standard": {
    intro: ["Standard PTZ cameras give remote pan-tilt-zoom control for actively monitoring a defined area - suited to most commercial coverage needs beyond fixed cameras."],
    benefits: [
      { title: "Actively steerable coverage", body: "Can be panned, tilted, and zoomed remotely to follow activity, covering more ground than a fixed camera in the same position." },
      { title: "Suits most typical PTZ use cases", body: "Standard PTZ covers the majority of commercial active-monitoring needs without stepping up to a specialty model." },
    ],
    faqs: [
      { q: "Does a standard PTZ camera need someone actively controlling it?", a: "It can be actively controlled for real-time monitoring, or set to preset patrol patterns depending on configuration." },
      { q: "How is standard PTZ different from specialty PTZ?", a: "Specialty models offer greater zoom range, better low-light performance, or coverage distance for particularly demanding sites; standard PTZ suits most typical commercial coverage needs." },
      { q: "Can a standard PTZ camera replace multiple fixed cameras?", a: "In some large open areas, yes - one PTZ can cover ground that would otherwise need multiple fixed units." },
    ],
  },
  "cctv.ptz.specialty": {
    intro: ["Specialty PTZ cameras offer greater zoom range, low-light performance, or coverage distance for particularly demanding sites beyond what a standard PTZ handles well."],
    benefits: [
      { title: "Handles more demanding coverage requirements", body: "Suited to larger areas, greater distances, or more challenging lighting conditions than standard PTZ cameras." },
      { title: "Still fully remotely controllable", body: "Retains the same steerable pan-tilt-zoom functionality as standard PTZ, with extended capability." },
    ],
    faqs: [
      { q: "When is specialty PTZ actually necessary?", a: "Particularly large open areas, long-distance perimeter monitoring, or challenging lighting conditions where a standard PTZ's range or performance falls short." },
      { q: "Is specialty PTZ significantly more expensive than standard?", a: "Yes, reflecting the extended optical and performance capability - your Captain can advise whether the upgrade is warranted for your specific site." },
      { q: "Does specialty PTZ need a more powerful recording system?", a: "Higher-resolution or higher-frame-rate specialty cameras may have greater storage/bandwidth needs - factored into the NVR/recording system sizing." },
    ],
  },
  "cctv.nvr.standalone": {
    intro: ["Standalone NVR units are the straightforward recording solution for a single-site camera system - simpler and more cost-effective than server-based VMS for typical deployments."],
    benefits: [
      { title: "Simple, cost-effective for single-site systems", body: "A standalone NVR covers typical single-site camera recording needs without the complexity or cost of a full VMS." },
      { title: "Straightforward setup and operation", body: "Easier to configure and operate than a server-based system, suited to most standard commercial deployments." },
    ],
    faqs: [
      { q: "How many cameras can a standalone NVR support?", a: "This varies by specific product/model - your Captain sizes the right NVR against your actual camera count." },
      { q: "Is a standalone NVR suitable for multiple sites?", a: "Not typically - multi-site deployments are better served by server-based VMS, which is built for centralised multi-location management." },
      { q: "Does a standalone NVR support remote viewing?", a: "Yes - basic remote viewing configuration is included with installation as standard." },
    ],
  },
  "cctv.nvr.serverBased": {
    intro: ["Server-based VMS (video management software) scales to larger camera deployments, multiple sites, or more advanced search and analytics needs beyond what a standalone NVR handles."],
    benefits: [
      { title: "Scales to larger and multi-site deployments", body: "VMS is built to centrally manage significantly more cameras, including across multiple locations, than a standalone NVR." },
      { title: "Supports more advanced features", body: "Better suited to advanced search, analytics integration, and more sophisticated system management needs." },
    ],
    faqs: [
      { q: "When is server-based VMS worth it over a standalone NVR?", a: "Larger camera counts, multiple sites needing central management, or a need for advanced search/analytics are the typical reasons to step up to VMS." },
      { q: "Does VMS need dedicated server hardware?", a: "Yes, typically - VMS runs on dedicated server infrastructure, which is scoped and sized as part of the system design." },
      { q: "Can VMS integrate with access control and analytics?", a: "Yes - server-based VMS is generally well suited to integration with access control systems and advanced video analytics." },
    ],
  },
  "cctv.accessControl.doorControllers": {
    intro: ["Door controllers manage electronic locking on individual doors via card, fob, or biometric access - removing the operational overhead of physical key management."],
    benefits: [
      { title: "No physical keys to manage", body: "Access can be granted or revoked instantly through the system rather than tracking physical keys." },
      { title: "Retrofits to most existing doors", body: "Can generally be added to existing doors with compatible hardware and wiring." },
    ],
    faqs: [
      { q: "Can door controllers be added to existing doors?", a: "Generally yes, with compatible hardware and wiring - your Captain assesses this against your specific doors during scoping." },
      { q: "What access methods do door controllers support?", a: "Card, fob, PIN, and biometric options are commonly available depending on the specific product selected." },
      { q: "Can door controller events be tied to CCTV footage?", a: "Yes - access events can be logged alongside camera footage on a shared system, giving a combined record of who accessed a door and what was captured." },
    ],
  },
  "cctv.accessControl.turnstiles": {
    intro: ["Turnstiles and barriers give physical entry control for higher-security or higher-traffic entrances - a step up from a standard controlled door."],
    benefits: [
      { title: "Robust physical entry control", body: "Turnstiles and barriers manage entry more robustly than a standard door, suited to higher-security or higher-traffic environments." },
      { title: "Handles high foot traffic efficiently", body: "Built to manage continuous entry flow at a main lobby or high-traffic entrance without becoming a bottleneck." },
    ],
    faqs: [
      { q: "When does an office need turnstiles instead of a standard controlled door?", a: "Higher-security requirements or heavy foot traffic at a main entrance are the typical reasons - most general office doors are adequately served by a standard door controller." },
      { q: "Do turnstiles integrate with the same access control system as doors?", a: "Yes - turnstiles and barriers typically integrate with the same card/fob/biometric access control system used for doors." },
      { q: "Are turnstiles accessible for wheelchair users?", a: "Accessible barrier options (wider gates alongside standard turnstiles) are available and should be specified where accessibility is a requirement." },
    ],
  },
  "cctv.analytics.basic": {
    intro: ["Basic video analytics covers common needs like motion detection and line-crossing alerts - a straightforward software layer added to your existing camera system."],
    benefits: [
      { title: "Turns passive footage into active alerts", body: "Flags events like after-hours motion or a crossed boundary line, rather than requiring manual footage review to catch them." },
      { title: "Straightforward to add to most systems", body: "Basic analytics is typically a configuration layer compatible with most standard camera and recording setups." },
    ],
    faqs: [
      { q: "What's a realistic use case for basic analytics in an office?", a: "Motion detection alerts after hours, or line-crossing alerts at a restricted entrance, are common, straightforward use cases." },
      { q: "Does basic analytics need special cameras?", a: "Generally no - basic analytics works with most standard camera setups, unlike some advanced AI features which may need specific hardware." },
      { q: "Can basic analytics send alerts to a phone?", a: "Yes - alert notifications to a phone or email are a standard feature of most basic analytics configurations." },
    ],
  },
  "cctv.analytics.advanced": {
    intro: ["Advanced AI analytics goes beyond basic motion detection - capabilities like people counting, facial recognition, or behaviour pattern detection, depending on the specific product and use case."],
    benefits: [
      { title: "More sophisticated detection capabilities", body: "Advanced analytics can address specific business needs beyond simple motion or line-crossing alerts." },
      { title: "Can support operational insights, not just security", body: "Features like people counting can inform space utilisation decisions, not just security monitoring." },
    ],
    faqs: [
      { q: "Does advanced AI analytics need special cameras?", a: "Some advanced features perform best with cameras and recording hardware specifically rated for it - your Captain confirms compatibility with your planned camera spec before this is added." },
      { q: "What's a typical use case for advanced analytics in an office?", a: "People counting for space utilisation insight, or more sophisticated security event detection beyond basic motion alerts, are common examples." },
      { q: "Is advanced analytics significantly more expensive than basic?", a: "Yes, generally, reflecting the more sophisticated software (and sometimes hardware) involved - your Captain can scope this against your specific requirement." },
    ],
  },

  // ---------- Authority Approvals ----------
  "approvals.municipality.fitoutPermit": {
    intro: ["The fit-out permit is the base authorisation required to legally carry out construction work in most Dubai commercial buildings - typically the first approval needed before work can begin."],
    benefits: [
      { title: "Unlocks the legal start of construction", body: "Work generally can't begin without this permit in hand, making it the first item in the approvals sequence." },
      { title: "Timed against your actual project schedule", body: "Application is sequenced so approval isn't the bottleneck delaying your project start date." },
    ],
    faqs: [
      { q: "What does a fit-out permit application actually require?", a: "Typically approved drawings and supporting documentation specific to your building - your Captain confirms exact requirements for your project." },
      { q: "How long does permit approval usually take?", a: "It varies by building and submission completeness - a complete, well-documented application the first time is the biggest factor in avoiding delay." },
      { q: "Can construction start before the permit is issued?", a: "No, generally - starting work before permit approval risks a stop-work order and complications later in the project." },
    ],
  },
  "approvals.municipality.inspections": {
    intro: ["Inspections and NOCs confirm the completed fit-out work meets Municipality requirements - typically needed before the space can be occupied."],
    benefits: [
      { title: "Confirms completed work meets requirements", body: "Inspection verifies the actual construction against what was approved, rather than assuming compliance." },
      { title: "Sequenced once work is genuinely ready", body: "Inspections are booked once the relevant construction is actually complete, avoiding a failed first visit." },
    ],
    faqs: [
      { q: "What happens if an inspection identifies an issue?", a: "Your Captain coordinates the fix with the relevant trade and rebooks the inspection, managed as part of the existing project timeline." },
      { q: "Are inspections a one-time event or multiple stages?", a: "This can involve one or more stages depending on your building and scope - your Captain confirms the specific sequence for your project." },
      { q: "Do I need the NOC before moving into the space?", a: "Generally yes - occupancy typically depends on receiving the relevant NOC/inspection sign-off, which your Captain sequences accordingly." },
    ],
  },
  "approvals.civilDefense.drawingApproval": {
    intro: ["Fire drawing approval reviews your fit-out's fire strategy - door ratings, partition ratings, emergency lighting, and detection systems - before construction begins."],
    benefits: [
      { title: "Catches issues before construction, not after", body: "Reviewing the fire strategy on paper first avoids discovering a mismatch once walls and doors are already built." },
      { title: "Coordinated with the trades it depends on", body: "Drawing approval is cross-checked against your actual door, partition, and emergency lighting specifications." },
    ],
    faqs: [
      { q: "What does Civil Defense review at the drawing approval stage?", a: "Fire-rated door and partition locations, emergency lighting layout, and general life-safety strategy shown on the approved drawings." },
      { q: "How long does fire drawing approval typically take?", a: "It varies by scope and building - your Captain manages the submission and follow-up to keep it on track against your project timeline." },
      { q: "Does drawing approval need to happen before any construction starts?", a: "Yes, generally - construction proceeding against un-approved fire drawings risks needing rework later." },
    ],
  },
  "approvals.civilDefense.inspectionCertificate": {
    intro: ["The inspection and certificate stage confirms the completed fire and life-safety systems match what was approved on the drawings - the final Civil Defense sign-off."],
    benefits: [
      { title: "Confirms the build matches the approved fire strategy", body: "Inspection verifies fire-rated doors, partitions, and emergency systems as actually installed, not just as designed." },
      { title: "Reduces risk through earlier coordination", body: "Because drawing approval and trade specification were already coordinated, this final inspection has a much lower risk of surprises." },
    ],
    faqs: [
      { q: "What happens if the inspection finds a discrepancy from the approved drawings?", a: "Your Captain coordinates the fix with the relevant trade contractor and reschedules inspection, managed within the existing project timeline." },
      { q: "Is the fire certificate required for occupancy?", a: "Yes, generally - Civil Defense sign-off is typically part of the requirements before a commercial space can be occupied." },
      { q: "How is this different from the Dubai Municipality inspection?", a: "This specifically covers fire and life-safety compliance under Civil Defense; Municipality inspection covers the broader general construction/fit-out permit compliance - both may be required depending on your project." },
    ],
  },
  "approvals.dewa.electricalApproval": {
    intro: ["DEWA electrical load approval confirms your fit-out's electrical demand is properly registered and within capacity - coordinated with your actual distribution board design."],
    benefits: [
      { title: "Based on your real electrical design", body: "Approval is submitted against your actual distribution board and circuit specification, not a generic assumption." },
      { title: "Coordinated with the electrical trade directly", body: "This approval is managed alongside the electrical installation itself, not as a disconnected paperwork exercise." },
    ],
    faqs: [
      { q: "What information does DEWA need for electrical load approval?", a: "Your fit-out's electrical load design, including distribution board and circuit specification - your Captain coordinates this submission with the electrical trade's actual design." },
      { q: "Can this approval be submitted before the electrical design is finalised?", a: "Generally the application needs your actual electrical load design, which is why this is coordinated with the electrical trade rather than started independently." },
      { q: "Is this approval separate from the general fit-out permit?", a: "Yes - it's a specific DEWA approval alongside (not instead of) the Dubai Municipality fit-out permit process." },
    ],
  },
  "approvals.dewa.waterApproval": {
    intro: ["Water and chiller approval covers the utility-side sign-off where a fit-out affects water supply or a chilled water HVAC system."],
    benefits: [
      { title: "Confirms water/chiller infrastructure compliance", body: "Where relevant to your fit-out, this approval verifies the water and chiller system meets DEWA requirements." },
      { title: "Scoped only where it actually applies", body: "Not every fit-out needs this approval - your Captain confirms whether it's relevant to your specific project and building type." },
    ],
    faqs: [
      { q: "Does every office fit-out need water & chiller approval?", a: "No - it's relevant where your fit-out specifically affects water supply or a chilled water HVAC system, confirmed by your Captain during project scoping." },
      { q: "Is this approval linked to the HVAC installation?", a: "Yes, where a chilled water system is involved, this approval is coordinated with the HVAC trade's specification." },
      { q: "How long does water & chiller approval typically take?", a: "It varies by scope and building - your Captain manages the submission timeline as part of the overall approvals process." },
    ],
  },
  "approvals.trakhees.designApproval": {
    intro: ["Trakhees design approval reviews your fit-out design before construction begins - the free zone equivalent of Dubai Municipality's permit process, for buildings under Trakhees jurisdiction."],
    benefits: [
      { title: "Matched to the correct jurisdiction", body: "Your Captain confirms your building falls under Trakhees before submitting to this specific authority, rather than the wrong one." },
      { title: "Reviewed before construction begins", body: "Design approval happens upfront, avoiding construction proceeding against an un-approved design." },
    ],
    faqs: [
      { q: "How do I know if my building needs Trakhees rather than Dubai Municipality approval?", a: "It depends on which free zone or jurisdiction your building sits within - your Captain confirms this based on your building's address and ownership structure." },
      { q: "What does Trakhees design approval review?", a: "Your fit-out design and drawings, similar in principle to a Municipality permit review, following Trakhees' specific process and documentation requirements." },
      { q: "How long does Trakhees design approval take?", a: "It varies by project and building - your Captain manages the submission and follow-up against your project timeline." },
    ],
  },
  "approvals.trakhees.completionApproval": {
    intro: ["Trakhees completion approval confirms the finished fit-out matches the approved design - the final sign-off stage for buildings under Trakhees jurisdiction."],
    benefits: [
      { title: "Confirms the build matches what was approved", body: "Completion approval verifies the actual finished work against the design approval issued earlier in the project." },
      { title: "Closes out the Trakhees approval chain", body: "This is the final stage following design approval, typically required before the space can be occupied." },
    ],
    faqs: [
      { q: "What's needed before completion approval can be submitted?", a: "Generally, construction needs to be complete and matching the approved design - your Captain confirms readiness before submission." },
      { q: "Is completion approval required for occupancy under Trakhees?", a: "Yes, generally - similar to Dubai Municipality's process, occupancy typically depends on receiving this final sign-off." },
      { q: "What happens if completion approval identifies a discrepancy?", a: "Your Captain coordinates the fix with the relevant trade and resubmits, managed within the existing project timeline." },
    ],
  },
  "approvals.asBuilt.architectural": {
    intro: ["Architectural as-built drawings document the finished space's actual layout and finishes as constructed, capturing any adjustments made during the build."],
    benefits: [
      { title: "An accurate record of the finished layout", body: "Captures the real, final architectural condition of the space, not just the original design intent." },
      { title: "Useful for any future alteration work", body: "Gives an accurate baseline for any future fit-out changes, without relying on outdated original drawings." },
    ],
    faqs: [
      { q: "Why is this different from the original approved drawings?", a: "Site conditions and minor adjustments during construction almost always mean the finished space differs slightly from the original drawings - this captures the actual final condition." },
      { q: "Who typically needs architectural as-builts?", a: "Facilities management, future contractors doing alteration work, and sometimes the landlord all rely on accurate as-built documentation." },
      { q: "When are architectural as-builts prepared?", a: "As construction completes, capturing the final condition while it's still fresh and verifiable, rather than reconstructed later." },
    ],
  },
  "approvals.asBuilt.mep": {
    intro: ["MEP as-built drawings document the actual mechanical, electrical, and plumbing systems as installed - critical for anyone maintaining or modifying the space's services later."],
    benefits: [
      { title: "Documents what's actually behind the walls and ceiling", body: "MEP as-builts capture the real routing of electrical, HVAC, and plumbing systems, not just the original design intent." },
      { title: "Essential for future maintenance and alterations", body: "Anyone doing future work on the space's systems needs accurate MEP documentation to work safely and efficiently." },
    ],
    faqs: [
      { q: "Why are MEP as-builts particularly important compared to architectural?", a: "Services routing (cabling, ductwork, plumbing) is hidden behind finished surfaces and genuinely difficult to verify without accurate documentation - unlike architectural layout, which is at least partly visible." },
      { q: "Who prepares MEP as-built drawings?", a: "Documented as each relevant trade (electrical, HVAC) completes their installation, coordinated by your Captain into the final handover package." },
      { q: "Are MEP as-builts required by any authority?", a: "Some authority completion/handover processes expect this documentation - your Captain confirms specific requirements for your building and jurisdiction." },
    ],
  },
  "approvals.completionCert.authorityCert": {
    intro: ["The authority completion certificate is the formal document confirming your fit-out has passed all required authority sign-offs and is approved for occupancy."],
    benefits: [
      { title: "The formal confirmation of full compliance", body: "This certificate represents the culmination of the entire approvals chain - permit, inspections, and any interim sign-offs." },
      { title: "Typically required before legal occupancy", body: "This is generally the document that allows the space to be legally occupied and used." },
    ],
    faqs: [
      { q: "What's required before the authority completion certificate can be issued?", a: "All relevant construction and prior approval stages need to be complete and passed - your Captain confirms the specific sequence for your building and jurisdiction." },
      { q: "Does this certificate cover fire and electrical compliance specifically?", a: "It typically follows and references the relevant individual approvals (Civil Defense, DEWA, Municipality/Trakhees) as the final confirmation the full chain is complete." },
      { q: "How long after construction completes is this certificate typically issued?", a: "It varies by building and authority - your Captain manages the submission and follow-up once all prior approval stages are confirmed complete." },
    ],
  },
  "approvals.completionCert.handoverDocs": {
    intro: ["Handover documentation bundles as-built drawings, warranty information, and relevant certificates into one complete record delivered at project close."],
    benefits: [
      { title: "One complete record, not scattered documents", body: "Everything relevant to the finished space is bundled together at handover, rather than left as separate documents to track down later." },
      { title: "A practical resource for facilities management", body: "Gives whoever manages the space day-to-day a single, organised reference for warranties, as-builts, and certificates." },
    ],
    faqs: [
      { q: "What's typically included in the handover documentation package?", a: "As-built drawings (architectural and MEP), warranty information, and relevant authority certificates are commonly bundled together - your Captain confirms exactly what's included for your specific project." },
      { q: "Is handover documentation delivered digitally or as physical copies?", a: "This can typically be arranged either way, or both - confirm your preference with your Captain ahead of project completion." },
      { q: "Who should keep the handover documentation after the project closes?", a: "Whoever manages the space long-term - facilities management or the business owner - should retain this as a reference for future maintenance or alteration work." },
    ],
  },

  // ---------- Lighting ----------
  "lighting.recessed.ledDownlight": {
    intro: ["LED downlights give even, efficient general illumination across open-plan office areas - the standard fixture for baseline ceiling lighting."],
    benefits: [
      { title: "Efficient, even general illumination", body: "The standard, cost-effective way to light an open-plan floor evenly." },
      { title: "Long-lasting, low-maintenance fixtures", body: "LED fixtures typically require minimal maintenance over their operating life compared with older lighting technology." },
    ],
    faqs: [
      { q: "How many LED downlights does a typical open-plan office need?", a: "This is calculated against your floor area and required illumination levels during lighting design - your Captain confirms fixture count and spacing." },
      { q: "Are LED downlights dimmable?", a: "Dimmable options are available - flag this preference when your lighting layout is being specified." },
      { q: "Can LED downlights be different colour temperatures in different areas?", a: "Yes - colour temperature can be specified per area (typically cooler/brighter for open-plan, warmer for breakout areas) as part of the lighting design." },
    ],
  },
  "lighting.recessed.adjustable": {
    intro: ["Adjustable/gimbal downlights can be aimed after installation - useful for highlighting a specific wall, reception feature, or artwork rather than just lighting the floor evenly."],
    benefits: [
      { title: "Aimable after installation", body: "Unlike a fixed straight-down downlight, a gimbal fixture can be angled to highlight a specific feature." },
      { title: "Adds accent lighting without a separate track system", body: "Gives some of the flexibility of track lighting within a standard recessed downlight format." },
    ],
    faqs: [
      { q: "Where are adjustable/gimbal downlights typically used?", a: "Highlighting a feature wall, reception element, or artwork - anywhere general straight-down light isn't quite what's needed." },
      { q: "How much more do adjustable downlights cost than standard?", a: "They sit at a modest premium over standard fixed downlights, reflecting the adjustable housing mechanism." },
      { q: "Can gimbal downlights be re-aimed easily after installation?", a: "Yes - that's their core benefit; the angle can be adjusted without any electrical rework, unlike repositioning a fixed downlight." },
    ],
  },
  "lighting.pendant.singlePendant": {
    intro: ["A single pendant is one statement fixture hung as a focal point - typically over a reception desk or a smaller feature area."],
    benefits: [
      { title: "A focused, singular design statement", body: "One well-chosen pendant draws attention to a specific point, like a reception desk, without the complexity of a multi-drop arrangement." },
      { title: "Simpler installation than a cluster configuration", body: "A single fixture is more straightforward to position and wire than a multi-drop cluster." },
    ],
    faqs: [
      { q: "Where does a single pendant typically get used?", a: "Above a reception desk or a smaller feature point is the most common application." },
      { q: "How is single pendant different from cluster/multi-drop?", a: "A single pendant is one fixture; cluster/multi-drop uses multiple drops at varying heights, suited to a larger feature area like a breakout zone." },
      { q: "Can a single pendant be dimmed independently?", a: "Yes - pendant circuits are commonly specified on their own dimmable zone." },
    ],
  },
  "lighting.pendant.clusterPendant": {
    intro: ["Cluster/multi-drop pendants use multiple fixtures at varying heights for a larger, more layered feature moment - suited to breakout areas or a larger reception space."],
    benefits: [
      { title: "A larger, more layered visual feature", body: "Multiple drops at varying heights create more visual interest and coverage than a single pendant." },
      { title: "Scales to larger feature areas", body: "Suited to bigger spaces - a breakout zone or larger reception - where a single pendant wouldn't have enough presence." },
    ],
    faqs: [
      { q: "How many pendants are typically used in a cluster configuration?", a: "This depends on the space and desired visual effect - your Captain and the lighting design can advise on the right count for your specific area." },
      { q: "Does a cluster pendant configuration need more ceiling height than a single pendant?", a: "Generally similar drop-height requirements to a single pendant, though the overall spread needs enough ceiling area - confirmed against your specific space." },
      { q: "Can cluster pendants be different fixture styles within one arrangement?", a: "Some designs intentionally mix fixture sizes or styles within a cluster for visual variety - discuss this with your Captain if that's the desired look." },
    ],
  },
  "lighting.track.singleCircuit": {
    intro: ["Single circuit track lighting uses a standard rail with fixtures wired along one circuit - the straightforward, proven track lighting option for feature walls or displays."],
    benefits: [
      { title: "Proven, straightforward track system", body: "A well-established, reliable track lighting format suited to most feature and accent lighting needs." },
      { title: "Fixtures reposition along the rail", body: "Heads slide and rotate along the track without rewiring, giving flexibility as display or feature needs change." },
    ],
    faqs: [
      { q: "How is single circuit track different from magnetic track?", a: "Single circuit uses a standard wired rail; magnetic track uses a low-voltage magnetic rail that makes adding, removing, or repositioning fixtures even easier." },
      { q: "Can single circuit track fixtures be dimmed?", a: "Yes, dimmable configurations are available for single circuit track systems." },
      { q: "Where does single circuit track typically get used in an office?", a: "Feature walls, gallery-style displays, or reception accent lighting are common applications." },
    ],
  },
  "lighting.track.magneticTrack": {
    intro: ["Magnetic track lighting uses a low-voltage magnetic rail that makes adding, removing, or repositioning fixtures faster and easier than a standard wired track system."],
    benefits: [
      { title: "The most flexible track lighting option", body: "Fixtures can be added, removed, or repositioned with more ease than a standard single-circuit track." },
      { title: "Suited to frequently-changing displays", body: "Where a display or feature area's content changes often, magnetic track's flexibility is a genuine practical advantage." },
    ],
    faqs: [
      { q: "Is magnetic track more expensive than single circuit track?", a: "It typically sits at a higher rate reflecting the more advanced rail and fixture technology - your Captain can compare directly for your specific area." },
      { q: "How is a magnetic track fixture actually attached?", a: "Fixtures connect magnetically to the low-voltage rail, rather than a mechanical twist-lock connection as with standard track." },
      { q: "Does magnetic track suit residential-style use, or is it commercial-grade?", a: "Commercial-grade magnetic track systems are used here, specified for the durability and performance an office environment needs." },
    ],
  },
  "lighting.linear.surfaceMounted": {
    intro: ["Surface-mounted linear profile lighting sits visibly on the ceiling face as an architectural line - suited to corridors or as a deliberate visible design detail."],
    benefits: [
      { title: "A visible architectural line", body: "The profile sits on top of the ceiling surface, creating an intentional visible design element rather than disappearing into the ceiling." },
      { title: "Suits corridors and general circulation well", body: "Continuous linear illumination works particularly well guiding movement along a corridor." },
    ],
    faqs: [
      { q: "How is surface-mounted different from recessed profile lighting?", a: "Surface-mounted sits visibly on the ceiling as a line; recessed integrates flush into the ceiling for a more built-in look - recessed generally suits a gypsum ceiling design better." },
      { q: "Can surface-mounted linear lighting be curved to follow a corridor shape?", a: "Some profile systems support curved runs - discuss this with your Captain if your layout calls for it." },
      { q: "Does surface-mounted linear lighting work on a suspended grid ceiling?", a: "Yes - it can be mounted onto or integrated with a suspended grid ceiling as well as gypsum." },
    ],
  },
  "lighting.linear.recessedProfile": {
    intro: ["Recessed profile lighting integrates flush into the ceiling for a clean, built-in line of light - typically paired with a gypsum ceiling design."],
    benefits: [
      { title: "A flush, integrated look", body: "The profile sits recessed into the ceiling surface rather than protruding, giving a cleaner, more architectural result." },
      { title: "Works well as a feature ceiling edge detail", body: "Commonly used along the edge of a bulkhead or cove as a considered lighting detail within a decorative gypsum ceiling." },
    ],
    faqs: [
      { q: "Does recessed profile lighting require a gypsum ceiling?", a: "It's most commonly paired with gypsum given the need to build the recess into the ceiling construction, though it can be considered for other ceiling types - confirm feasibility with your Captain." },
      { q: "Is recessed profile lighting more expensive than surface-mounted?", a: "It typically involves more coordination with the ceiling build, which can affect overall project cost - your Captain can compare options for your specific design." },
      { q: "Can recessed profile lighting be dimmed?", a: "Yes, dimmable configurations are available." },
    ],
  },
  "lighting.panel.ceilingPanel": {
    intro: ["Ceiling panel lights are flat, even fixtures sized to drop into a standard suspended grid ceiling module - straightforward general illumination for a grid ceiling."],
    benefits: [
      { title: "A simple, coordinated fit for grid ceilings", body: "Sized to standard grid modules, panel lights drop in as a direct replacement for a standard ceiling tile." },
      { title: "Even, glare-controlled light output", body: "Designed to spread light evenly across the panel surface, reducing glare compared with a bare fixture." },
    ],
    faqs: [
      { q: "Do ceiling panel lights only fit suspended grid ceilings?", a: "Grid-mounted panels are designed for suspended grid ceilings specifically; surface-mounted panel options exist for other ceiling types." },
      { q: "How many ceiling panels does a typical open-plan area need?", a: "Calculated against your floor area and required illumination level during lighting design." },
      { q: "Are ceiling panel lights dimmable?", a: "Dimmable options are available - flag this requirement during lighting design." },
    ],
  },
  "lighting.panel.officePartition": {
    intro: ["Office/task panel lights are specified with light output and distribution suited to focused work areas - a more work-specific alternative to general ceiling panel illumination."],
    benefits: [
      { title: "Suited to focused work areas", body: "Light distribution is optimised for task-focused work rather than purely general area illumination." },
      { title: "Complements task lighting at the desk", body: "Works alongside desk-level task lighting as part of a layered lighting approach for a specific work zone." },
    ],
    faqs: [
      { q: "How is office/task panel different from a standard ceiling panel?", a: "Task panels are specified with light output and distribution suited to focused work areas, while general ceiling panels prioritise even area-wide illumination." },
      { q: "Do task panel lights reduce screen glare?", a: "Task-appropriate panel lighting is generally specified with glare control suited to computer-based work - confirm specific glare ratings with your Captain if this is a particular concern." },
      { q: "Where are office/task panels typically specified over standard ceiling panels?", a: "Areas with concentrated, detailed desk work where lighting quality for screen-based tasks matters more than general ambient illumination alone." },
    ],
  },
  "lighting.decorative.wallSconce": {
    intro: ["Wall sconces add a smaller-scale accent lighting moment along a corridor or feature wall - a subtler decorative option than a larger feature installation."],
    benefits: [
      { title: "A subtle, smaller-scale accent", body: "Sconces add visual interest without the scale or cost of a larger feature installation." },
      { title: "Suits corridors and smaller accent moments well", body: "Well matched to hallways and transitional spaces where a full feature installation wouldn't fit the scale of the space." },
    ],
    faqs: [
      { q: "Where do wall sconces typically get used in an office?", a: "Corridors, smaller accent walls, and transitional spaces are the most common locations." },
      { q: "Are wall sconces dimmable?", a: "Dimmable options are available - flag this preference when the lighting layout is specified." },
      { q: "How is a wall sconce different from a larger feature installation?", a: "Sconces are smaller-scale, individual fixtures; feature installations are larger, often bespoke pieces reserved for a signature space like reception." },
    ],
  },
  "lighting.decorative.featureInstallation": {
    intro: ["Feature installations are larger, often bespoke lighting pieces reserved for a signature space - reception, a feature stair, or a boardroom wall where lighting is a genuine design statement."],
    benefits: [
      { title: "A genuine signature design moment", body: "Feature installations are chosen and positioned specifically to make a visual impression, distinct from functional lighting elsewhere." },
      { title: "Can be fully custom to the space", body: "Bespoke feature lighting can be designed specifically for a unique space or design concept." },
    ],
    faqs: [
      { q: "Can a feature lighting installation be fully custom-designed?", a: "Yes - raise this with your Captain early, since custom pieces typically need longer lead times than catalog fixtures." },
      { q: "Where do feature installations typically get specified?", a: "Reception, a signature stair or wall, and boardrooms are the most common locations for a larger bespoke lighting moment." },
      { q: "Does a feature installation need its own dedicated circuit?", a: "It's common to put feature lighting on its own dimmable zone so it can be controlled independently of general office lighting." },
    ],
  },

  // ---------- Furniture ----------
  "furniture.workstations.singleDesk": {
    intro: ["Single desks suit private offices or lower-density layouts where an open-plan bench cluster isn't the right fit - quoted per unit with delivery and assembly included."],
    benefits: [
      { title: "Right for private offices and lower density", body: "Single desks suit spaces that aren't optimising for maximum open-plan density." },
      { title: "Straightforward, flexible placement", body: "A standalone desk is easier to reposition individually than a fixed bench cluster configuration." },
    ],
    faqs: [
      { q: "When should single desks be used instead of cluster desking?", a: "Private offices, executive spaces, or lower-headcount areas where an open-plan bench cluster isn't the right fit." },
      { q: "Can single desks include cable management?", a: "Yes - integrated cable management is available as a standard specification option." },
      { q: "Are single desks more expensive per unit than cluster desks?", a: "Pricing varies by specific product - your Captain can compare directly against cluster desking for your specific space plan." },
    ],
  },
  "furniture.workstations.clusterDesk": {
    intro: ["Cluster/bench desks are the dominant format for open-plan Dubai offices, seating more people per square metre than individual single desks through a shared bench structure."],
    benefits: [
      { title: "Maximises open-plan floor space efficiency", body: "Bench-style clusters seat more people per square metre than individual single desks." },
      { title: "Shared cable management and structure", body: "Cluster desks typically share integrated cable management across the bench, keeping the whole configuration tidy." },
    ],
    faqs: [
      { q: "How many people does a typical cluster desk configuration seat?", a: "This varies by product and configuration (commonly 4, 6, or 8-person benches) - your Captain can advise based on your headcount and floor plate." },
      { q: "Can cluster desks be reconfigured if the team grows or shrinks?", a: "Depending on the specific product's modularity, some reconfiguration is possible - discuss future flexibility needs with your Captain at quote stage." },
      { q: "Do cluster desks include privacy screens between positions?", a: "Screen options are commonly available as an add-on to cluster desk configurations - flag this preference when selecting products." },
    ],
  },
  "furniture.chairs.taskChair": {
    intro: ["Task chairs are specified for ergonomics above all else, given eight-hour daily desk use - the standard seating for every workstation in the office."],
    benefits: [
      { title: "Built for all-day ergonomic support", body: "Task seating prioritises adjustability and support suited to a full working day, not just short-term comfort." },
      { title: "Adjustable to fit different users", body: "Height, armrest, and lumbar adjustability let one chair model suit a range of different people comfortably." },
    ],
    faqs: [
      { q: "Is it worth specifying ergonomic task chairs for every desk?", a: "For any desk used for a full working day, yes - it's a reasonable baseline specification given how much time is spent in it." },
      { q: "What adjustability should a task chair have?", a: "Height, lumbar support, and armrest adjustment are common baseline features - your Captain can advise on the right spec level for your budget." },
      { q: "Can task chair fabric be customised to brand colours?", a: "Many ranges offer fabric and finish options - check the specific product detail or flag a requirement to your Captain." },
    ],
  },
  "furniture.chairs.visitorMeeting": {
    intro: ["Visitor and meeting chairs prioritise a cleaner look and space efficiency over the heavy adjustability of a task chair, suited to shorter-duration use in meeting rooms and reception."],
    benefits: [
      { title: "A more design-led aesthetic", body: "Visitor/meeting chairs are chosen more for visual coordination with the room than heavy ergonomic adjustability, appropriate given shorter duration of use." },
      { title: "Often stackable or space-efficient", body: "Many visitor/meeting chair ranges are designed to stack or nest, useful for flexible or storage-conscious spaces." },
    ],
    faqs: [
      { q: "Do visitor/meeting chairs need the same ergonomic features as task chairs?", a: "Not to the same degree, since they're used for shorter durations - the priority typically shifts toward aesthetic and space efficiency." },
      { q: "How many meeting chairs does a typical boardroom need?", a: "Scoped against your actual room size and expected capacity - your Captain confirms quantities as part of the furniture layout." },
      { q: "Are visitor chairs available with arms or without?", a: "Both configurations are typically available - the choice is often about the room's aesthetic and space constraints." },
    ],
  },
  "furniture.meetingTables.smallMeeting": {
    intro: ["Small meeting tables (4-6 person) suit standard meeting rooms - sized for typical team discussions rather than large boardroom presentations."],
    benefits: [
      { title: "Sized right for standard meeting rooms", body: "4-6 person tables fit the room size and typical use case of most general meeting spaces without overwhelming the floor area." },
      { title: "Available with or without AV cable management", body: "Options range from a simple table to one with integrated power/data for video conferencing needs." },
    ],
    faqs: [
      { q: "What room size suits a small meeting table?", a: "Your Captain can advise on table dimensions against your actual room measurements, factoring in circulation space around the table." },
      { q: "Can a small meeting table include video conferencing cable management?", a: "Yes - integrated power/data modules are available as a specification option." },
      { q: "Is a small meeting table more cost-effective than a boardroom table?", a: "Generally yes, reflecting the smaller size - your Captain can give a direct comparison for your specific room needs." },
    ],
  },
  "furniture.meetingTables.boardroom": {
    intro: ["Boardroom tables (8+ person) are sized for larger meetings and formal presentations - typically the largest, most considered furniture piece in a fit-out's meeting room range."],
    benefits: [
      { title: "Scaled for larger, more formal meetings", body: "8+ person boardroom tables suit executive meetings and formal presentations requiring more seating capacity." },
      { title: "Often the room's centrepiece furniture item", body: "Boardroom tables are typically specified with more consideration given to finish and design, reflecting the room's importance." },
    ],
    faqs: [
      { q: "How is boardroom table size determined?", a: "Against your actual boardroom dimensions and expected maximum attendance - your Captain factors in circulation space, not just seat count." },
      { q: "Do boardroom tables typically include AV integration?", a: "Integrated power/data and cable management for video conferencing and presentation equipment is a common specification for boardroom tables - flag this requirement." },
      { q: "Can a boardroom table be custom-designed?", a: "Custom sizing or finish can be scoped for a signature boardroom - raise this with your Captain, since custom pieces need a longer lead time than standard catalog options." },
    ],
  },
  "furniture.storage.pedestals": {
    intro: ["Pedestals and lockers give individual, desk-level storage - fixed or mobile options, lockable where secure personal storage matters."],
    benefits: [
      { title: "Personal storage tied to each desk or person", body: "Keeps individual belongings and files organised at the point of use rather than in a shared, distant storage area." },
      { title: "Fixed or mobile, matched to your working style", body: "Mobile pedestals suit hot-desking or flexible layouts; fixed pedestals suit assigned desks." },
    ],
    faqs: [
      { q: "Are pedestals fixed to a specific desk, or mobile?", a: "Both fixed and mobile pedestal options are available - mobile suits hot-desking or flexible layouts, fixed suits assigned desks." },
      { q: "Can pedestals be locked?", a: "Yes - lockable options are available where secure personal storage matters." },
      { q: "How much storage does a typical pedestal offer?", a: "This varies by specific product configuration (drawers, file storage) - check the product range or discuss your needs with your Captain." },
    ],
  },
  "furniture.storage.cabinets": {
    intro: ["Cabinets and shelving cover shared team storage needs - stationery, files, and equipment - distributed around the floor plate rather than tied to one individual desk."],
    benefits: [
      { title: "Serves shared, team-level storage needs", body: "Distinct from personal pedestal storage, cabinets and shelving handle stationery, files, and equipment shared across a team or floor." },
      { title: "Keeps open-plan areas clutter-free", body: "Properly planned shared storage is what keeps a floor plate looking clean rather than accumulating loose items at desks." },
    ],
    faqs: [
      { q: "How much shared storage does a typical floor need?", a: "It depends on how paper-based the team's workflow still is - your Captain can advise on a reasonable ratio based on your headcount and working style." },
      { q: "Can cabinets be locked for secure shared storage?", a: "Yes - lockable cabinet options are available for sensitive shared documents or equipment." },
      { q: "Are open shelving and closed cabinets both available?", a: "Yes - both formats are available depending on whether visible, accessible storage or concealed storage suits the specific area better." },
    ],
  },
  "furniture.receptionDesks.standard": {
    intro: ["A standard reception desk covers the functional brief reliably and cost-effectively - a straightforward, professional first point of contact for visitors."],
    benefits: [
      { title: "A reliable, professional standard", body: "Covers the functional reception need well without the cost or lead time of a custom build." },
      { title: "Faster to produce than a custom design", body: "As a catalog item, a standard reception desk has a shorter lead time than a bespoke feature build." },
    ],
    faqs: [
      { q: "Does a standard reception desk include cable management?", a: "Yes - integrated power and data for reception equipment (phone, computer, badge printer) is a standard specification." },
      { q: "Can a standard reception desk still look distinctive?", a: "Standard doesn't mean generic - there's a range of finishes and configurations available; a custom feature build is the option when something genuinely bespoke is needed." },
      { q: "How long does a standard reception desk take to arrive?", a: "Considerably faster than a custom feature build, since it's a catalog item rather than a bespoke design - your Captain confirms exact lead time." },
    ],
  },
  "furniture.receptionDesks.customFeature": {
    intro: ["A custom feature reception desk is built specifically for your space and brand - the option where the desk itself needs to make a genuine design statement as part of the first impression."],
    benefits: [
      { title: "A genuinely bespoke first impression", body: "Custom feature reception desks are designed specifically for your space, brand, and interior design concept." },
      { title: "Can incorporate branding directly", body: "Lit logos, specific brand colours, and custom materials are commonly built into a feature reception design." },
    ],
    faqs: [
      { q: "How long does a custom feature reception desk take to produce?", a: "Considerably longer than a standard catalog desk - your Captain gives an accurate lead time once the design is finalised, and it's worth flagging early if reception is a priority for opening day." },
      { q: "Can a custom reception desk incorporate our brand logo?", a: "Yes - branded elements are commonly incorporated into a custom feature reception build." },
      { q: "Does a custom feature desk cost significantly more than standard?", a: "Yes, generally, reflecting the bespoke design and joinery work - your Captain can scope this against your specific design brief." },
    ],
  },
  "furniture.loungeSeating.sofasArmchairs": {
    intro: ["Sofas and armchairs furnish breakout and lounge areas for comfortable, informal use - distinct from task seating built for focused desk work."],
    benefits: [
      { title: "Built for comfort and informal collaboration", body: "Specified for relaxed, casual use rather than the ergonomic-for-eight-hours brief of a task chair." },
      { title: "Anchors a breakout or lounge zone", body: "Sofas and armchairs give a breakout area a genuine sense of separate, comfortable space distinct from the desk floor." },
    ],
    faqs: [
      { q: "How much lounge seating should a breakout area include?", a: "This depends on the space and expected use - your Captain can advise based on how the area is expected to be used day to day." },
      { q: "Can sofas and armchairs be specified in brand colours?", a: "Many ranges offer a choice of upholstery colours and finishes - check the specific product or flag a brand-matching requirement." },
      { q: "Is breakout furniture as durable as task seating for daily office use?", a: "Commercial-grade lounge furniture is specified for daily office use, though the wear profile differs from a task chair given the different use pattern." },
    ],
  },
  "furniture.loungeSeating.breakoutSeating": {
    intro: ["Breakout/pod seating gives a degree of acoustic and visual separation within an open breakout area - useful for informal calls or small group conversations without needing a fully enclosed room."],
    benefits: [
      { title: "Semi-private within an open area", body: "Pod formats give a degree of enclosure without the cost or space commitment of a fully built room." },
      { title: "Suits informal calls and small conversations", body: "A practical alternative to booking a full meeting room for a quick informal discussion or call." },
    ],
    faqs: [
      { q: "How is pod seating different from a standard sofa arrangement?", a: "Pod formats give a degree of acoustic and visual enclosure within an open area, useful for informal calls or small conversations without needing a fully enclosed room." },
      { q: "Does breakout/pod seating include any acoustic treatment?", a: "Some pod products include built-in acoustic material as part of their construction - check the specific product spec with your Captain." },
      { q: "Can breakout/pod seating include power for laptops or phones?", a: "Integrated power options are available on many pod seating products - flag this requirement when selecting products." },
    ],
  },
};

export function getSubtypeContent(categoryKey: string, typeKey: string, subtypeKey: string, subtypeLabel: string, typeLabel: string, categoryLabel: string): SubtypeContent {
  return SUBTYPE_CONTENT[`${categoryKey}.${typeKey}.${subtypeKey}`] ?? GENERIC(subtypeLabel, typeLabel, categoryLabel);
}
