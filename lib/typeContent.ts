// Editorial copy for the public Type-level SEO landing pages
// (app/landing/[category]/[type]) - one level more specific than the
// category page's copy in lib/landingContent.ts, same voice and structure.
// Keyed as `${categoryKey}.${typeKey}` against the live Type rows (see
// prisma/seed.ts). Falls back to a generic-but-real template for any type
// that hasn't had bespoke copy written yet, so a page is never broken or
// empty - same pattern as lib/landingContent.ts's GENERIC().
export type TypeContent = {
  intro: string[];
  benefits: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

const GENERIC = (typeLabel: string, categoryLabel: string): TypeContent => ({
  intro: [
    `${typeLabel} is one of the ${categoryLabel.toLowerCase()} systems PickTheBrick supplies and installs for Dubai office fit-outs - priced and scheduled the same way as everything else in your quote, with fitting included in the rate shown.`,
    `Every product under this type ships with our standard workmanship warranty and is fitted by a vetted PickTheBrick contractor, coordinated by your assigned Captain alongside every other trade on your project.`,
  ],
  benefits: [
    { title: "Supply and installation, one price", body: "The rate shown per item already includes fitting - no separate install quote to chase down or reconcile later." },
    { title: "Vetted contractors only", body: "Every installer working under a PickTheBrick quote has been through our partner application and category-approval process before they're allowed on a project." },
    { title: "Sequenced against your whole fit-out", body: "Your Captain schedules this alongside every other trade on one project timeline, not as a standalone booking." },
  ],
  faqs: [
    { q: `Is installation included in the ${typeLabel.toLowerCase()} price?`, a: "Yes - every rate shown is a supply-and-install price, with no separate installation invoice." },
    { q: "Can I combine this with other types in the same category?", a: "Yes - it's common to mix types within one category (and across categories) in a single quote and timeline." },
    { q: "What if I need a spec that isn't listed here?", a: "Add a placeholder item to your quote and flag the exact spec to your Captain - our team can source close matches or custom options for most requests." },
  ],
});

export const TYPE_CONTENT: Record<string, TypeContent> = {
  // ---------- Partitions ----------
  "partitions.glass": {
    intro: [
      "Glass partitions are the default choice for most Dubai office fit-outs that want to keep a floor plate open and daylit while still separating it into cabins and meeting rooms. PickTheBrick supplies and installs both single-glazed and double-glazed acoustic glass systems, priced per square metre of wall with framing and fitting included.",
      "The choice between the two usually comes down to what's on the other side of the glass: single glazing suits general offices and corridors, while double-glazed acoustic builds are worth the extra rate wherever real speech privacy - HR rooms, boardrooms, phone booths - actually matters.",
    ],
    benefits: [
      { title: "Daylight keeps moving through the floor", body: "A glazed floor plate doesn't create dark, boxed-in rooms the way a solid wall does - light from the perimeter reaches deeper into the space." },
      { title: "Two acoustic tiers, one system family", body: "Single and double-glazed acoustic options are quoted on the same per-sqm basis, so upgrading a specific room's privacy doesn't mean switching to an entirely different partition system." },
      { title: "Framing specified to Dubai Civil Defense requirements", body: "Glazing and framing are specified to meet UAE fire and safety codes, documented by your Captain if your fit-out needs formal authority approval." },
    ],
    faqs: [
      { q: "What's the difference between single and double-glazed acoustic partitions?", a: "Single glazing is one pane of glass in a frame; double-glazed acoustic uses two panes with an air gap, which meaningfully cuts sound transfer - worth the extra cost for rooms where confidentiality matters." },
      { q: "Can glass partitions be reconfigured later if the floor plan changes?", a: "Framed glass systems are generally easier to reposition than a built wall, though it's still a partial rebuild rather than a true demountable system - flag future flexibility needs to your Captain at quote stage." },
      { q: "Do glass partitions need manifestation (visibility markings)?", a: "Yes, most UAE commercial fit-outs require manifestation strips or frosting at eye level for safety compliance - this is included as standard on full-height glazing." },
    ],
  },
  "partitions.gypsum": {
    intro: [
      "Gypsum partitions are the standard solid wall for spaces that don't need glass - store rooms, back-of-house corridors, or any wall where acoustic separation matters more than visual openness. PickTheBrick supplies and installs both standard drywall and fire-rated gypsum builds, priced per square metre with framing, boarding, and a paint-ready finish included.",
      "Fire-rated gypsum in particular comes up constantly on Dubai fit-outs wherever a wall separates a corridor, stairwell, or plant room - Civil Defense checks the rating on these walls specifically, so getting the right build spec on the right wall the first time avoids a failed inspection later.",
    ],
    benefits: [
      { title: "Better acoustic separation than glass", body: "A studwork-and-board wall cuts sound transfer more effectively than any glazed system, which is why it's still the right call for anything genuinely private." },
      { title: "Fire-rated where the code requires it", body: "Corridor, stairwell, and plant room walls can be specced to the correct fire rating from the outset instead of being caught and rebuilt at inspection stage." },
      { title: "Straightforward to patch and reconfigure", body: "Standard drywall is the easiest partition type to cut into, extend, or move later - useful for spaces expected to change over the life of the lease." },
    ],
    faqs: [
      { q: "When is gypsum the right call over a glass partition?", a: "Anywhere sound isolation or fire rating matters more than daylight or visual openness - store rooms, private offices, corridors, and plant rooms are typical cases." },
      { q: "How is fire-rated gypsum different from standard drywall?", a: "Fire-rated boards use a denser, glass-fibre-reinforced core that holds structural integrity under fire for a certified period (commonly 1 or 2 hours) - it's a different board spec, not just a thicker version of standard drywall." },
      { q: "Does a gypsum wall need to be painted separately?", a: "The wall is handed over paint-ready (taped and skimmed); final paint colour is typically scoped as part of the wider fit-out finishes rather than this partition line item." },
    ],
  },
  "partitions.demountable": {
    intro: [
      "Demountable partitions are built to come apart - modular panel and sliding panel systems that can be reconfigured or relocated without the drywall rebuild a fixed wall requires. PickTheBrick supplies and installs both, priced per square metre with track, panels, and fitting included.",
      "These systems earn their higher per-sqm rate on flexibility: a tenant on a shorter lease, or a team that reorganises floor layouts every year or two, gets most of a glass partition's look with a genuinely different cost profile the second and third time the layout changes.",
    ],
    benefits: [
      { title: "Built for reconfiguration, not just installation", body: "Panels lift out and relocate along the same track system rather than requiring demolition and rebuild every time the layout changes." },
      { title: "Modular or sliding, same rate basis", body: "Fixed modular panel walls and operable sliding systems are quoted per square metre on the same basis, so comparing the two for a specific room is a direct like-for-like number." },
      { title: "Lower total cost across multiple reconfigurations", body: "The higher upfront rate compared with gypsum is usually recovered the second time a wall needs to move, since there's no rebuild labour or made-good patching involved." },
    ],
    faqs: [
      { q: "How is a demountable system different from a normal glass partition?", a: "Standard framed glass can be repositioned but generally requires some rework at the old and new locations; true demountable/modular systems are designed around panels and track specifically so relocation is fast and doesn't damage the panel or the floor/ceiling." },
      { q: "Is a sliding panel system good for a meeting room that's sometimes one space, sometimes two?", a: "Yes - that's the main use case for sliding panel walls, letting a room split into two smaller spaces or open back up depending on the day's bookings." },
      { q: "Do demountable partitions meet the same fire and acoustic standards as fixed walls?", a: "Panel systems are specified with fire and acoustic ratings appropriate to their use, though very high acoustic requirements (like a dedicated confidential meeting room) are usually still better served by a fixed gypsum or double-glazed build." },
    ],
  },
  "partitions.solid": {
    intro: [
      "Solid partitions - block wall and studwork - are the most structural option in the partition range, used where a wall needs to carry more than just acoustic separation: load-bearing situations, heavy wall-mounted equipment, or simply the most robust and lowest-maintenance option available. PickTheBrick supplies and installs both, priced per square metre including finish-ready surface.",
      "These come up less often in a typical open-plan office fit-out than glass or gypsum, but are the right spec for server rooms, plant areas, or any wall a landlord's structural requirements call for specifically.",
    ],
    benefits: [
      { title: "Structural capacity glass and gypsum don't offer", body: "Block wall in particular can carry real load and heavy wall-mounted fixtures without the additional bracing a stud wall would need." },
      { title: "Lowest long-term maintenance of any partition type", body: "A solid block or heavy studwork wall has effectively no moving parts and nothing to service over the life of the fit-out." },
      { title: "Best acoustic and fire performance in the range", body: "Where a wall needs to meet the highest sound isolation or fire separation requirement on a floor plate, solid construction is usually the specification that clears it with the most margin." },
    ],
    faqs: [
      { q: "When would a fit-out actually need block wall instead of studwork?", a: "Block is specified where structural load, exceptional acoustic separation, or a landlord's building code requires it - server rooms and plant areas are the most common cases in an office fit-out." },
      { q: "Is solid partition construction slower to install than gypsum or glass?", a: "Yes, generally - block wall in particular takes longer to build and cure than a stud-and-board or glazed system, which your Captain factors into the project timeline when this type is specced." },
      { q: "Can solid partitions be finished to look like the rest of the office?", a: "Yes - both block and studwork walls are handed over ready for the same paint, wallcovering, or joinery finish as any other wall in the fit-out." },
    ],
  },
  "partitions.acoustic": {
    intro: [
      "Acoustic partitions are purpose-built for the rooms where sound isolation is the actual brief, not a side benefit - phone booths, soundproof meeting booths, and rooms next to anything genuinely noisy. PickTheBrick supplies and installs acoustic panel walls and soundproof booth-grade systems, priced per square metre with fitting included.",
      "The difference between this type and a standard gypsum or glass wall specced with 'good' acoustics is real: these systems are rated and tested specifically for sound transmission loss, not adapted from a general-purpose partition build.",
    ],
    benefits: [
      { title: "Purpose-rated for sound transmission loss", body: "Panel and booth-grade systems carry tested acoustic ratings, not an assumption of 'should be quiet enough' from a general partition spec." },
      { title: "Right for the specific rooms that need it", body: "Rather than over-specifying every wall on the floor, acoustic partitions target the handful of rooms - call booths, confidential meeting rooms, rooms beside plant equipment - where it actually matters." },
      { title: "Compatible with the rest of the partition system", body: "Acoustic sections integrate with the surrounding glass or gypsum partitions on the same floor plate rather than looking like a bolted-on afterthought." },
    ],
    faqs: [
      { q: "What rooms actually need acoustic-rated partitions instead of standard ones?", a: "Phone/video call booths, HR and confidential meeting rooms, and any room adjacent to plant equipment, a server room, or a noisy shared wall are the typical candidates." },
      { q: "Is a soundproof booth wall the same as a prefabricated pod?", a: "No - this is a built-in-place acoustic wall system, priced per square metre like the rest of the partition range, rather than a standalone prefabricated booth product." },
      { q: "How much quieter is acoustic-rated construction than standard gypsum?", a: "It varies by exact panel spec, but acoustic-rated systems are tested and rated for sound transmission loss specifically, while standard gypsum's acoustic performance is a byproduct of the build rather than the design target - your Captain can advise on the right rating for a specific room's use." },
    ],
  },
  "partitions.aluminiumFramed": {
    intro: [
      "Aluminium-framed partitions are the finished, architectural end of the glass partition range - slim sightlines, a consistent frame system across the floor, and the option to combine full-glass framed sections with glass-gypsum combination walls where a room needs both daylight and a solid lower section. PickTheBrick supplies and installs both configurations, priced per square metre.",
      "This is usually the type specced for reception, boardrooms, and any area where the partition system itself is part of the interior design statement, not just a functional divider.",
    ],
    benefits: [
      { title: "Consistent frame system across the whole floor", body: "Using one aluminium framing family for every glazed wall keeps sightlines and finishes matching from reception through to the back-office cabins." },
      { title: "Full glass or glass-gypsum combo, one system", body: "Rooms that want full transparency and rooms that want a solid lower section with glass above can both be built from the same framed system, quoted on the same basis." },
      { title: "The most design-forward option in the partition range", body: "Slim aluminium sightlines read as considerably more finished than a bulkier framing system, which is why this is the default spec for client-facing areas." },
    ],
    faqs: [
      { q: "What's a glass-gypsum combo framed wall used for?", a: "A solid gypsum lower section (typically desk height) with glass above - it gives visual privacy at seated eye level while still letting light and a sense of openness through above it, common in cabins along a glazed corridor." },
      { q: "Is aluminium-framed glazing more expensive than a standard glass partition?", a: "It's usually a step up from a basic framed system, reflecting the finish quality and consistency of the frame family - your Captain can compare it directly against standard glass partitioning for your specific layout." },
      { q: "Can aluminium framing match our brand colours?", a: "Framing is available in a range of standard finishes, and custom powder-coat colours can be scoped as a specification upgrade - raise this with your Captain when the quote is being built." },
    ],
  },

  // ---------- Flooring ----------
  "flooring.tiles": {
    intro: [
      "Tiles are the most-specified flooring type for Dubai office reception areas, wet zones, and high-traffic circulation - porcelain, ceramic, and natural stone, priced per square metre with levelling, adhesive, and fitting included.",
      "Porcelain and ceramic look similar in a photo but perform differently underfoot over years of commercial use; natural stone sits at the premium end for spaces where the floor itself is meant to make a statement, typically reception and executive areas.",
    ],
    benefits: [
      { title: "Three tiers, one per-sqm pricing basis", body: "Porcelain, ceramic, and natural stone are all quoted the same way, so comparing a premium reception spec against a standard corridor spec is a straightforward number." },
      { title: "Rated for commercial foot traffic", body: "Every tile range here is specified for office-level daily use, not a residential product pressed into commercial service." },
      { title: "Consistent large-format options for open-plan areas", body: "Large-format porcelain in particular reads as a more premium, seamless floor across open-plan space than smaller-format tile." },
    ],
    faqs: [
      { q: "Which tile type is right for a reception area?", a: "Natural stone or large-format porcelain are the usual specs for reception, where the floor is part of the first impression - ceramic is a more budget-conscious option for lower-visibility areas." },
      { q: "Is porcelain worth the extra cost over ceramic?", a: "Porcelain is denser and more wear- and stain-resistant, which shows up as a longer service life under heavy commercial foot traffic - worth it for high-traffic zones, less critical for a low-footfall back office." },
      { q: "Do tiles need a levelled subfloor first?", a: "Yes - subfloor levelling is included in the per-sqm rate where the existing floor needs it, assessed once your Captain has confirmed the site condition." },
    ],
  },
  "flooring.carpet": {
    intro: [
      "Carpet remains the default for open-plan desk areas in Dubai offices - it's quieter underfoot than hard flooring, more comfortable for an eight-hour workday, and available as carpet tile, broadloom, or carpet plank depending on how the space needs to be maintained. PickTheBrick supplies and installs all three, priced per square metre with fitting included.",
      "Carpet tile is by far the most common commercial spec because it can be replaced section by section when a small area wears or stains, without redoing the whole floor - a real advantage over broadloom in a space that sees years of daily use.",
    ],
    benefits: [
      { title: "Quieter, warmer open-plan floors", body: "Carpet meaningfully cuts down on ambient noise and underfoot fatigue across a large open desk area compared with any hard flooring option." },
      { title: "Carpet tile replaces section by section", body: "A worn or stained tile can be swapped individually rather than requiring the whole floor to be redone, which broadloom can't offer." },
      { title: "Three formats to match the room's use", body: "Carpet tile, broadloom, and carpet plank are all quoted per square metre, so the format decision is about maintenance and look, not a cost trade-off you have to reverse-engineer." },
    ],
    faqs: [
      { q: "What's the real advantage of carpet tile over broadloom?", a: "Individual tiles can be lifted and replaced if damaged or stained, without touching the rest of the floor - broadloom is a single continuous sheet, so localised damage usually means replacing a whole section or room." },
      { q: "How often does commercial carpet need replacing?", a: "It depends heavily on traffic and maintenance, but commercial-grade carpet tile in an office setting typically holds up well for several years under normal daily use - your Captain can advise based on the specific product spec chosen." },
      { q: "Is carpet a fire risk in a Dubai office fit-out?", a: "All carpet supplied is specified to meet UAE commercial fire-rating requirements for flooring, which your Captain documents if your fit-out requires formal authority approval." },
    ],
  },
  "flooring.vinyl": {
    intro: [
      "Vinyl flooring sits between carpet and hard tile on cost and maintenance, and has become one of the most popular commercial flooring choices in Dubai for exactly that reason - LVT, vinyl sheet, and SPC rigid core, priced per square metre with fitting included.",
      "SPC in particular has grown fast in commercial fit-outs because its rigid core resists dents and temperature-driven expansion better than standard LVT, without the cost jump to natural stone or premium porcelain.",
    ],
    benefits: [
      { title: "Realistic wood and stone visuals at a lower cost", body: "LVT and SPC both replicate timber or stone finishes closely enough for most office settings, at a materially lower per-sqm rate than the real material." },
      { title: "SPC's rigid core resists dents and movement", body: "Where LVT can show pressure marks from heavy furniture or fluctuate slightly with temperature, SPC's stone-composite core holds its shape better under both." },
      { title: "Fast, low-disruption installation", body: "Vinyl in all three formats installs quickly compared with tile, which matters on a fit-out timeline where flooring is often on the critical path." },
    ],
    faqs: [
      { q: "What's the difference between LVT and SPC?", a: "LVT (luxury vinyl tile) is a flexible vinyl product; SPC (stone plastic composite) uses a rigid core beneath the same style of vinyl wear layer, giving it better dent and temperature stability - SPC typically costs a little more per sqm as a result." },
      { q: "Is vinyl sheet different from vinyl tile products?", a: "Yes - sheet vinyl is installed as large continuous rolls rather than individual tiles or planks, which gives a more seamless look and fewer joints, often specified for wet areas or clinical-adjacent spaces." },
      { q: "How does vinyl compare to tile for a busy open-plan office?", a: "Vinyl is generally quieter underfoot and faster to install than hard tile, though tile still wins on long-term scratch resistance in the very highest-traffic zones - your Captain can advise on the right call for your specific floor plate." },
    ],
  },
  "flooring.laminate": {
    intro: [
      "Laminate offers a genuine timber look at the most accessible price point in the flooring range, available in standard and waterproof builds. PickTheBrick supplies and installs both, priced per square metre with fitting included.",
      "Waterproof laminate has closed most of the gap that used to exist between laminate and vinyl for moisture resistance, making it a realistic option even for areas that see occasional spills, not just dry open-plan desk space.",
    ],
    benefits: [
      { title: "The most accessible timber-look option", body: "Laminate delivers a convincing wood-grain finish at a lower per-sqm rate than engineered timber or premium LVT." },
      { title: "Waterproof builds extend where it can go", body: "Standard laminate is best kept to dry areas, but the waterproof range holds up to occasional moisture, opening it up to more of the floor plate." },
      { title: "Straightforward, fast installation", body: "Laminate's click-lock installation method is quick to fit, which helps keep flooring off the critical path on a tight fit-out timeline." },
    ],
    faqs: [
      { q: "Is laminate durable enough for a busy office?", a: "Standard laminate performs well under normal office foot traffic, though very high-traffic zones (main corridors, reception) are usually better served by tile or SPC vinyl - your Captain can advise per zone." },
      { q: "Where should waterproof laminate be used over standard?", a: "Anywhere with occasional moisture exposure - near a pantry, a wet area, or ground-level spaces with any damp risk - standard laminate is fine for typical dry desk areas." },
      { q: "How does laminate compare to LVT on price?", a: "Laminate generally sits at a lower per-sqm rate than LVT for a comparable timber-look finish, though LVT edges it out on moisture resistance and long-term wear in heavy-use areas." },
    ],
  },
  "flooring.coatings": {
    intro: [
      "Coatings are a different category of flooring altogether - epoxy, polished concrete, and PU coating are applied directly to the slab rather than laid as a discrete product, giving a seamless, industrial-grade finish. PickTheBrick supplies and installs all three, priced per square metre.",
      "These come up most often in warehouse, workshop, plant room, and some back-of-house office areas where durability and easy cleaning matter more than the softer feel of tile or vinyl.",
    ],
    benefits: [
      { title: "Fully seamless, no joints to maintain", body: "Applied coatings have no grout lines or seams, which makes them easier to keep clean and eliminates a common failure point in high-traffic industrial areas." },
      { title: "Built for genuinely heavy-duty use", body: "Epoxy and PU coatings are specified where forklift traffic, chemical exposure, or constant foot traffic would wear through standard flooring products quickly." },
      { title: "Polished concrete as a design choice, not just a utility floor", body: "Polished concrete has become a legitimate aesthetic choice for some office and retail-adjacent spaces, not only warehouse floors." },
    ],
    faqs: [
      { q: "What's the difference between epoxy and PU coating?", a: "Epoxy is harder and more chemical-resistant, making it the default for workshop and warehouse floors; PU coating has more flexibility and better UV/abrasion resistance over time, which suits some higher-traffic or partially exposed areas better." },
      { q: "Is polished concrete suitable for an office reception?", a: "Yes - it's increasingly used as a deliberate design finish in reception and open-plan areas, not just utility spaces, though it reads as a more industrial aesthetic than tile or timber-look flooring." },
      { q: "How long does a coated floor take to cure before use?", a: "Curing time varies by product and coating thickness - your Captain confirms an exact timeline once the coating spec and area are finalised, since this affects how it's sequenced against other trades." },
    ],
  },
  "flooring.raisedAccess": {
    intro: [
      "Raised access flooring creates a service void beneath a removable floor panel system - the standard spec for server rooms, trading floors, and any heavily-cabled space where access to what's underneath the floor matters as much as the floor itself. PickTheBrick supplies and installs both calcium sulphate and steel panel systems, priced per square metre.",
      "This type is usually specced alongside standard tile or carpet elsewhere on the same floor plate, not across an entire office - it's a technical-space solution layered into a wider fit-out.",
    ],
    benefits: [
      { title: "Full cable and services access under the floor", body: "Panels lift individually for cable routing, moves, and maintenance without disrupting the finished floor above." },
      { title: "Steel or calcium sulphate, matched to load requirements", body: "Steel panel systems suit the heaviest load and highest-traffic technical spaces; calcium sulphate is a lighter-duty, more cost-effective option for standard server or comms rooms." },
      { title: "Finished surface on top, same as any other floor", body: "The panel system is topped with carpet tile, vinyl, or another finish to match the surrounding floor - it doesn't have to look like a technical space from above." },
    ],
    faqs: [
      { q: "When does a fit-out actually need raised access flooring?", a: "Server rooms, comms rooms, trading floors, and any space with dense, frequently-changed cabling are the standard use cases - it's rarely specified for general open-plan desk areas." },
      { q: "What's the difference between steel and calcium sulphate panels?", a: "Steel panels handle higher point loads and heavier equipment; calcium sulphate is lighter-duty and typically more cost-effective for standard server/comms room requirements - your Captain can advise based on what the room will actually hold." },
      { q: "How much void height does raised access flooring need?", a: "It depends on the cabling and services density planned for the room - this is confirmed with your Captain against the specific space before the system is specced, since it affects ceiling height and any threshold/ramp detailing where it meets standard flooring." },
    ],
  },

  // ---------- Doors ----------
  "doors.flush": {
    intro: [
      "Flush doors are the standard interior door for most rooms in a Dubai office fit-out - a clean, flat-faced door available in laminate or timber veneer finish. PickTheBrick supplies and installs both, priced per door with frame, ironmongery, and fitting included.",
      "The choice between laminate and veneer is mostly about finish and budget: laminate is durable and consistent across dozens of doors on a floor plate, while veneer gives a warmer, more premium timber look for higher-visibility rooms.",
    ],
    benefits: [
      { title: "Consistent finish across every opening", body: "Specifying one flush door range across a whole floor keeps every opening looking uniform, rather than a mix of styles creeping in door by door." },
      { title: "Laminate or veneer, priced per door", body: "Both finishes are quoted on the same per-door basis, so upgrading specific doors to veneer for higher-visibility rooms is a simple, direct cost comparison." },
      { title: "Ironmongery matched from the outset", body: "Handles, hinges, and closers are quoted with the door, so hardware quality matches the door spec rather than being value-engineered down separately." },
    ],
    faqs: [
      { q: "What's the real difference between laminate and veneer flush doors?", a: "Laminate is a durable synthetic finish, consistent and low-maintenance across many doors; veneer is a thin layer of real timber over the door core, giving a warmer, more premium look at a higher price point." },
      { q: "Are flush doors suitable for every room in an office?", a: "Yes for general offices, meeting rooms, and corridors - rooms with a fire, acoustic, or glazing requirement are better served by the Fire-Rated, Acoustic, or Glass door types instead." },
      { q: "Can flush doors be specified with vision panels?", a: "Small glazed vision panels can be added to a flush door as a specification option - flag this to your Captain if any doors need sightlines through them." },
    ],
  },
  "doors.glass": {
    intro: [
      "Glass doors match glass partition systems for a consistent look through meeting rooms and cabins - available framed or frameless. PickTheBrick supplies and installs both, priced per door including hardware and fitting.",
      "Frameless glass doors read as the more premium, minimal option and are typically paired with frameless or slim-framed partition glazing; framed glass doors work well against any framed partition system and are the more budget-conscious glazed option.",
    ],
    benefits: [
      { title: "Visual continuity with glass partitions", body: "Matching the door glazing to the surrounding partition system keeps sightlines consistent through a glazed corridor or meeting room run." },
      { title: "Framed or frameless, priced per door", body: "Both configurations are quoted per door, making it straightforward to mix frameless doors in feature areas with framed doors elsewhere." },
      { title: "Hardware specified for glass, not adapted from a timber door", body: "Patch fittings, floor springs, and handles are specified for glass door use from the outset, not retrofitted hardware designed for a solid door." },
    ],
    faqs: [
      { q: "Are frameless glass doors more expensive than framed?", a: "Generally yes - frameless systems use heavier toughened glass and specialised patch hardware, which costs more per door than a framed glass door in a standard aluminium frame." },
      { q: "Do glass doors need manifestation markings like glass partitions?", a: "Yes - manifestation at eye level is standard practice for safety compliance on glass doors, same as full-height glazed partitions." },
      { q: "Can a glass door be fitted with an access control reader?", a: "Yes - glass doors can be specified with electronic locking and access control integration; flag this requirement early since it affects the hardware and framing spec." },
    ],
  },
  "doors.fireRated": {
    intro: [
      "Fire-rated doors are a Civil Defense requirement on egress routes, stairwells, and specific room types across most Dubai commercial fit-outs - available in 1-hour and 2-hour rated builds. PickTheBrick supplies and installs both, priced per door with certified hardware and fitting included.",
      "This is one of the categories Civil Defense checks specifically during inspection, so getting the correct rating on the correct opening from the start avoids a rejected inspection and a second site visit later in the project.",
    ],
    benefits: [
      { title: "Certified to the rating the code requires", body: "Doors, frames, and hardware are supplied as a certified fire-rated assembly, not individually-sourced components that may not hold the rating as a system." },
      { title: "1-hour or 2-hour, matched to the opening's requirement", body: "Different openings on the same floor plate can require different ratings - both tiers are available and priced on the same per-door basis." },
      { title: "Documented for authority approval", body: "Fire door certification is documented by your Captain as part of the authority approvals process wherever your fit-out requires formal sign-off." },
    ],
    faqs: [
      { q: "How do I know which openings need a 2-hour rating instead of 1-hour?", a: "This depends on the building's fire strategy and the specific opening (stairwell doors typically require a higher rating than a general office door on an egress corridor) - your Captain confirms exact requirements against your building's approved fire strategy." },
      { q: "Can fire-rated doors be glazed?", a: "Yes - fire-rated vision panels using certified fire-rated glass are available, though the panel size is typically more limited than on a standard non-rated glass door." },
      { q: "What happens if a fire door is installed with the wrong hardware?", a: "Fire door assemblies must use certified compatible hardware to maintain the rating - this is why hardware is quoted and supplied as part of the fire door package rather than sourced separately." },
    ],
  },
  "doors.timberVeneer": {
    intro: [
      "Timber veneer doors are the step up from standard laminate flush doors for spaces that want a genuine warm timber look - standard and premium/feature grades. PickTheBrick supplies and installs both, priced per door with matched ironmongery and fitting included.",
      "Premium veneer doors are typically specced for executive offices, boardrooms, and reception-adjacent openings, where the door itself is part of the material palette rather than a purely functional element.",
    ],
    benefits: [
      { title: "Real timber veneer, not a printed finish", body: "A genuine wood veneer layer gives grain variation and depth that a laminate or printed finish can't fully replicate." },
      { title: "Standard or premium/feature grade", body: "Both tiers are priced per door, so specifying premium veneer for a handful of feature openings (reception, boardroom) alongside standard veneer elsewhere is a direct cost comparison." },
      { title: "Matched hardware for a considered, finished look", body: "Ironmongery is specified to suit the veneer finish, keeping feature doors looking intentional rather than mismatched." },
    ],
    faqs: [
      { q: "What's the difference between standard and premium/feature veneer?", a: "Premium/feature grade uses higher-quality veneer selection (more consistent grain, book-matched panels) typically reserved for the most visible doors in a fit-out - standard veneer is a more cost-effective grade for general offices." },
      { q: "Do veneer doors need to be re-finished over time?", a: "Veneer doors are supplied factory-finished and don't require routine refinishing under normal office use, though heavy wear over many years may eventually warrant attention, same as any timber finish." },
      { q: "Can veneer doors be fire-rated?", a: "Fire-rated timber veneer doors are available where both the finish and the rating are required - flag this combination to your Captain, since it narrows the exact product spec." },
    ],
  },
  "doors.sliding": {
    intro: [
      "Sliding doors save the floor space a swinging door needs, which matters in tight corridors, small meeting rooms, or anywhere a door's swing arc would clash with furniture or traffic flow - single track and pocket door systems. PickTheBrick supplies and installs both, priced per door with track and fitting included.",
      "Pocket doors disappear fully into the wall cavity for the cleanest look; single track sliding doors run along the wall face and are the simpler, more budget-conscious option where a fully recessed door isn't necessary.",
    ],
    benefits: [
      { title: "No swing arc to plan furniture around", body: "A sliding door frees up the floor space a hinged door's swing would otherwise claim, useful in tight or heavily-furnished rooms." },
      { title: "Pocket doors disappear completely", body: "A true pocket door slides fully into the wall cavity, leaving no visible door at all when open - the cleanest option for a minimal aesthetic." },
      { title: "Single track as the simpler, lower-cost option", body: "Where a fully recessed pocket isn't practical (existing wall construction, budget), a single-track surface-mounted slider gives most of the same space-saving benefit at a lower cost." },
    ],
    faqs: [
      { q: "Does a pocket door need special wall construction?", a: "Yes - the wall needs a cavity built to receive the door, which is easier to plan for during a full fit-out than to retrofit into an existing finished wall; your Captain confirms feasibility against your specific wall." },
      { q: "Are sliding doors as private as a standard hinged door?", a: "A well-fitted sliding door can seal reasonably well, though a hinged door with proper weatherstripping and a rated frame generally still edges it out on acoustic seal - worth discussing with your Captain if the room has a strict privacy requirement." },
      { q: "Can sliding doors be glazed?", a: "Yes - glazed sliding doors are available and are often paired with glass partition systems for a consistent look." },
    ],
  },
  "doors.acoustic": {
    intro: [
      "Acoustic doors are built specifically to cut sound transfer through an opening - standard acoustic and studio-grade builds. PickTheBrick supplies and installs both, priced per door with rated seals and hardware included.",
      "A standard door in an acoustic-rated wall undermines the wall's whole purpose, since sound finds the weakest point in any assembly - this type exists specifically to match the door to the acoustic performance of the wall it sits in.",
    ],
    benefits: [
      { title: "Matches the door to the wall's acoustic rating", body: "An acoustic-rated wall with a standard door has a sound leak at the door - this range is built to close that gap." },
      { title: "Standard or studio-grade, by how much isolation is needed", body: "Standard acoustic doors suit meeting rooms and private offices; studio-grade is specified for the rooms that need the most serious isolation, like a dedicated call studio or recording space." },
      { title: "Rated seals included as standard", body: "Acoustic performance depends heavily on the door seal, not just the door leaf - certified seals are included and fitted as part of the door package, not an afterthought." },
    ],
    faqs: [
      { q: "Is an acoustic door necessary if the room already has acoustic partition walls?", a: "Yes, generally - sound transmission finds the weakest point in an assembly, and a standard door in an otherwise acoustic-rated room undermines much of the wall's performance." },
      { q: "What's the difference between standard acoustic and studio-grade doors?", a: "Studio-grade doors use heavier cores and more robust seal systems for higher sound transmission loss, intended for spaces like recording booths or studio-adjacent rooms - standard acoustic doors suit typical private office or meeting room needs." },
      { q: "Do acoustic doors need special frames too?", a: "Yes - the frame and seal system are part of what makes an acoustic door perform to its rating, which is why these are quoted and fitted as a matched assembly rather than a door alone." },
    ],
  },

  // ---------- Ceiling ----------
  "ceiling.gypsum": {
    intro: [
      "Gypsum board ceilings give a clean, flush finish and the option for bulkheads, coves, and feature drops that a suspended grid ceiling can't offer - standard and decorative builds. PickTheBrick supplies and installs both, priced per square metre with fitting and a paint-ready finish included.",
      "This is the type specced wherever the ceiling itself needs to make a design statement, not just conceal services - reception, boardrooms, and any area where a flush, seamless overhead is worth the extra labour compared with a dropped grid.",
    ],
    benefits: [
      { title: "Flush, seamless finish", body: "No visible grid lines or tile joints - a gypsum ceiling reads as a single continuous surface, which suits higher-end reception and boardroom specs." },
      { title: "Bulkheads, coves, and feature drops possible", body: "Decorative gypsum builds allow for level changes, coves, and lighting details a flat suspended grid can't accommodate." },
      { title: "Standard or decorative, one paint-ready finish", body: "Both tiers are handed over ready for final paint, so the finish decision doesn't add a separate line item." },
    ],
    faqs: [
      { q: "Why choose gypsum over a suspended grid ceiling?", a: "Gypsum gives a cleaner, more finished look with no visible grid or tile joints, and allows bulkheads and feature details - the trade-off is it's fixed, so accessing services above it later means cutting and patching rather than lifting a tile." },
      { q: "How long does a gypsum ceiling take to install?", a: "It generally takes longer than a suspended grid, since it involves framing, boarding, taping, and finishing before paint - your Captain gives an exact timeline once the ceiling design and area are confirmed." },
      { q: "Can a gypsum ceiling include recessed lighting?", a: "Yes - recessed and linear lighting are routinely built into gypsum ceiling designs; this is coordinated with the electrical and lighting trades on the same project timeline." },
    ],
  },
  "ceiling.suspendedGrid": {
    intro: [
      "Suspended grid ceilings are the standard, serviceable choice for most open-plan office areas - mineral fibre tile and metal tile options, both dropping into the same metal frame system. PickTheBrick supplies and installs both, priced per square metre with grid and fitting included.",
      "The main advantage over a fixed gypsum ceiling is access: any tile lifts out individually for maintenance or cabling changes above it, which matters a great deal over the working life of an office fit-out.",
    ],
    benefits: [
      { title: "Full access to the ceiling void", body: "Any tile can be lifted for maintenance, cabling, or HVAC access without disturbing the rest of the ceiling - a real advantage over a fixed gypsum build." },
      { title: "Mineral fibre or metal tile, same grid system", body: "Both tile types drop into the same standard grid, so mixing tile finishes across different zones on one floor is straightforward." },
      { title: "Fast, predictable installation", body: "A grid ceiling installs considerably faster than a gypsum build, which helps keep the ceiling trade from becoming a bottleneck on the wider project timeline." },
    ],
    faqs: [
      { q: "What's the difference between mineral fibre and metal tile?", a: "Mineral fibre is the standard, cost-effective option with good acoustic absorption; metal tile gives a cleaner, more contemporary look and is more durable, at a higher per-sqm rate." },
      { q: "Can a suspended grid ceiling be mixed with gypsum bulkheads?", a: "Yes - it's common to run a suspended grid across the main open-plan area with gypsum bulkheads or feature drops over reception or a boardroom within the same floor plate." },
      { q: "How easy is it to add extra lighting or diffusers later?", a: "Considerably easier than with a fixed ceiling - individual tiles lift out to accommodate a new fixture or diffuser without cutting into a finished surface." },
    ],
  },
  "ceiling.stretch": {
    intro: [
      "Stretch ceilings use a tensioned membrane rather than tile or board, giving a completely seamless surface in matte or gloss/printed finishes - increasingly popular for feature ceilings in Dubai commercial fit-outs. PickTheBrick supplies and installs both finishes, priced per square metre.",
      "Gloss and printed stretch ceilings in particular have become a distinctive feature choice for reception areas and breakout zones, giving a look that's difficult to replicate with any traditional ceiling material.",
    ],
    benefits: [
      { title: "Genuinely seamless, no visible joints", body: "The tensioned membrane spans the full ceiling area with no grid lines, tile joints, or panel seams visible." },
      { title: "Matte or gloss/printed, distinct looks", body: "Matte gives a soft, even finish similar to painted gypsum; gloss and printed options create a reflective or custom-graphic feature surface unavailable from other ceiling types." },
      { title: "Faster install than a comparable gypsum feature ceiling", body: "A stretch membrane system installs considerably faster than an equivalent bespoke gypsum feature build." },
    ],
    faqs: [
      { q: "What is a stretch ceiling actually made of?", a: "A PVC or fabric membrane tensioned across a perimeter track fitted to the ceiling structure - it's a different construction method entirely from tile, grid, or board ceilings." },
      { q: "Can a stretch ceiling be printed with a custom design or logo?", a: "Yes - printed stretch ceilings can carry custom graphics or branding, commonly specified for reception or breakout feature areas." },
      { q: "Does a stretch ceiling allow access to services above it?", a: "Access points can be built into the design where needed (for sprinklers, diffusers, or maintenance access), but it isn't as freely accessible as a suspended grid tile - flag any known future access needs when this type is specced." },
    ],
  },
  "ceiling.acoustic": {
    intro: [
      "Acoustic ceiling panels are specified specifically to cut reverberation and noise transfer in open-plan areas - felt panel and wood wool builds, each with a distinct look as well as a distinct acoustic profile. PickTheBrick supplies and installs both, priced per square metre.",
      "This type is often layered into an open-plan ceiling design alongside standard suspended grid tile, rather than covering an entire floor plate - concentrated over the desk areas or breakout zones where noise actually needs managing.",
    ],
    benefits: [
      { title: "Purpose-rated for sound absorption", body: "Felt and wood wool panels carry genuine acoustic absorption ratings, addressing reverberation in open-plan space rather than just concealing services." },
      { title: "Two distinct finishes, two different looks", body: "Felt panels give a soft, contemporary, often colour-customisable finish; wood wool has a more textured, natural material look - both perform acoustically, so the choice is largely aesthetic." },
      { title: "Targeted where it's actually needed", body: "Acoustic ceiling treatment can be concentrated over open-plan desk clusters or breakout areas rather than specified across an entire floor, keeping cost proportional to the problem being solved." },
    ],
    faqs: [
      { q: "Do we need acoustic ceiling panels across the whole floor?", a: "Usually not - it's typically most effective (and most cost-efficient) concentrated over open-plan desk clusters and breakout areas where reverberation is worst, rather than the entire ceiling." },
      { q: "What's the difference between felt and wood wool acoustic panels?", a: "Both absorb sound effectively; felt panels give a smoother, more colour-flexible finish, while wood wool has a natural, textured look - the acoustic performance trade-off between them is secondary to the aesthetic choice for most fit-outs." },
      { q: "Can acoustic panels be combined with standard suspended grid tile?", a: "Yes - it's common to run standard grid tile across most of a floor plate with acoustic panel zones over specific noisy or high-occupancy areas." },
    ],
  },
  "ceiling.wooden": {
    intro: [
      "Wooden ceilings bring warmth and texture that no board, tile, or membrane ceiling can fully replicate - timber slat and veneer panel systems. PickTheBrick supplies and installs both, priced per square metre with fitting included.",
      "Timber slat ceilings in particular have become a defining feature in a lot of recent Dubai office fit-outs, often used to define a reception or breakout zone against a more neutral grid or gypsum ceiling elsewhere on the floor.",
    ],
    benefits: [
      { title: "A material warmth other ceiling types don't offer", body: "Real timber (slat or veneer panel) brings texture and warmth that reads very differently from painted gypsum or standard tile." },
      { title: "Slat systems allow acoustic backing", body: "Timber slat ceilings are commonly built with an acoustic felt or fibre backing behind the slats, combining the timber look with genuine sound absorption." },
      { title: "Works well as a zone-defining feature", body: "A timber ceiling section is a common way to visually mark out reception, a breakout area, or a boardroom against the rest of a more neutral office ceiling." },
    ],
    faqs: [
      { q: "Is a timber slat ceiling acoustically absorbent, or just decorative?", a: "It can be both - slat systems are frequently built with an acoustic backing material behind the visible timber, giving genuine sound absorption alongside the aesthetic." },
      { q: "What's the difference between timber slat and veneer panel ceilings?", a: "Slat ceilings use individual linear timber battens with gaps between them (often over an acoustic backing); veneer panel ceilings use flat timber-veneer-faced panels for a more solid, continuous wood surface." },
      { q: "Does a wooden ceiling need special maintenance?", a: "Factory-finished timber ceiling products are low-maintenance under normal office conditions and don't require the routine refinishing that raw timber would." },
    ],
  },
  "ceiling.metal": {
    intro: [
      "Metal ceilings give a clean, contemporary, and highly durable finish - aluminium strip and steel panel systems. PickTheBrick supplies and installs both, priced per square metre with fitting included.",
      "This type is common in more industrial or design-forward office fit-outs, and holds up particularly well in areas with higher humidity or where a ceiling needs to be genuinely low-maintenance over many years.",
    ],
    benefits: [
      { title: "Highly durable, low-maintenance finish", body: "Metal ceiling systems resist damage, moisture, and general wear better than most other ceiling types, with minimal upkeep required." },
      { title: "Aluminium strip or steel panel, distinct aesthetics", body: "Strip systems give a linear, slatted look; panel systems give a flatter, more uniform metal surface - both suit a contemporary design direction." },
      { title: "Holds up well in higher-humidity areas", body: "Metal ceiling products are a strong choice for areas like pantries or near wet zones where moisture resistance matters more than in a standard office ceiling." },
    ],
    faqs: [
      { q: "Where does a metal ceiling make more sense than gypsum or grid?", a: "Areas wanting a contemporary, industrial-leaning aesthetic, or spaces with higher humidity/moisture exposure where a metal finish holds up better over time." },
      { q: "Is a metal ceiling noisy or echo-prone compared with other types?", a: "A bare metal ceiling can increase reverberation compared with an acoustic tile or panel system - perforated or acoustic-backed metal options are available where both the look and sound absorption matter." },
      { q: "Can metal ceiling panels be removed for access like a suspended grid?", a: "Some metal panel systems are designed for removability similar to a suspended grid; others are more fixed - confirm the specific access requirement with your Captain when this type is specced." },
    ],
  },

  // ---------- HVAC ----------
  "hvac.splitUnits": {
    intro: [
      "Split units are the most common air conditioning solution for smaller offices and individual rooms - wall-mounted and ducted split systems. PickTheBrick supplies and installs both, priced per unit sized against the room's actual cooling load.",
      "Wall-mounted units are the simplest, most visible option; ducted splits hide the indoor unit above the ceiling and distribute air through short duct runs, giving a cleaner look for rooms where a visible wall unit isn't wanted.",
    ],
    benefits: [
      { title: "Simple, proven technology for individual rooms", body: "Split systems are well understood, widely serviceable, and a cost-effective choice for cooling individual rooms or small office suites." },
      { title: "Ducted option keeps the indoor unit out of sight", body: "A ducted split hides the indoor unit above the ceiling, distributing air through diffusers rather than a visible wall-mounted box." },
      { title: "Independent control per room", body: "Each split system typically has its own control, giving room-by-room temperature control without needing a full building-wide zoned system." },
    ],
    faqs: [
      { q: "When is a split unit the right choice over a VRF system?", a: "Split units suit smaller offices or a handful of independent rooms; VRF systems are more efficient and better suited to larger floor plates with many zones needing central coordination - your Captain sizes this against your actual floor plan." },
      { q: "Is a wall-mounted unit noisy?", a: "Modern wall-mounted split units run quietly under normal operation - noise levels are specified as part of the product selection if this is a particular concern for the room's use." },
      { q: "Can a ducted split cool more than one room?", a: "Yes, within limits - a ducted split can serve a small number of adjacent spaces through short duct runs and multiple diffusers, though a larger multi-zone requirement is usually better served by a VRF system." },
    ],
  },
  "hvac.vrf": {
    intro: [
      "VRF (variable refrigerant flow) systems are the standard for larger Dubai office floor plates - one efficient outdoor system serving many indoor units, each independently controlled. PickTheBrick supplies and installs both the indoor units and outdoor system, priced per unit and sized against your floor plate and occupancy.",
      "This is the type most commercial fit-outs above a certain size land on, since it scales more efficiently than multiple standalone split units and gives proper zone-by-zone control across an open floor.",
    ],
    benefits: [
      { title: "Efficient at scale", body: "One outdoor system serving many indoor units is significantly more efficient than running many independent split systems across the same floor plate." },
      { title: "True zone-by-zone control", body: "Each indoor unit can be controlled independently, so a boardroom in use doesn't affect temperature in the open-plan area next to it." },
      { title: "Sized against your real occupancy plan", body: "Outdoor system capacity and indoor unit placement are calculated against your actual floor area and headcount, not a generic assumption." },
    ],
    faqs: [
      { q: "Why is VRF specified over multiple split units for a larger office?", a: "VRF is more energy-efficient at scale, gives more consistent zone control across a large floor plate, and avoids the visual and space impact of multiple separate outdoor condenser units." },
      { q: "How many indoor units does a typical open-plan floor need?", a: "It depends on floor area, ceiling height, and zoning requirements - your Captain calculates this against your actual floor plan and occupancy during quoting." },
      { q: "Does a VRF system need Civil Defense or DEWA approval?", a: "Ventilation and electrical load aspects of a VRF installation are typically covered under the authority approvals your Captain manages if your fit-out requires formal sign-off." },
    ],
  },
  "hvac.ductedPackage": {
    intro: [
      "Ducted package units combine cooling and air handling in one larger unit, either rooftop-mounted or installed indoors - a common choice for bigger floor plates or buildings where a rooftop unit is the practical location for the outdoor equipment. PickTheBrick supplies and installs both configurations, priced per unit sized to the space.",
      "This type is typically specced where a VRF system isn't the right fit for the building's existing infrastructure, or where one larger centralised unit is more practical than many smaller distributed units.",
    ],
    benefits: [
      { title: "Handles larger cooling loads in one system", body: "A package unit consolidates cooling capacity that would otherwise require several smaller units, simplifying the overall system." },
      { title: "Rooftop or indoor placement, matched to the building", body: "Rooftop units keep equipment off the floor plate entirely; indoor package units suit buildings where roof access or space isn't practical." },
      { title: "Straightforward maintenance access", body: "Package units are designed with service access built in, making routine maintenance more straightforward than a fully distributed multi-unit system." },
    ],
    faqs: [
      { q: "When would a ducted package unit be chosen over VRF?", a: "Where the building's infrastructure, roof access, or floor plate size makes one or two larger centralised units more practical than many small distributed indoor units - your Captain advises based on your building's specifics." },
      { q: "Does a rooftop unit need special structural approval?", a: "Larger rooftop equipment may need to be checked against the building's structural and landlord requirements - this is confirmed early in the project so it doesn't become a late-stage surprise." },
      { q: "How is ducting distributed from a package unit?", a: "Ductwork runs from the package unit through the ceiling void to diffusers across the served area - this is scoped and priced alongside the Ductwork & Insulation and Diffusers & Grilles types." },
    ],
  },
  "hvac.ductwork": {
    intro: [
      "Ductwork and insulation carry conditioned air from the HVAC unit to every diffuser across the floor plate - sheet metal duct and flexible duct, priced per the run required for your layout. PickTheBrick supplies and installs both, sized and routed against your ceiling void and floor plan.",
      "This is very much a behind-the-scenes trade that has to be coordinated tightly with the ceiling and electrical trades sharing the same void - getting duct routing agreed before the ceiling closes up is one of the more common coordination points on a fit-out.",
    ],
    benefits: [
      { title: "Sized and routed for your specific floor plate", body: "Duct runs are planned against your actual ceiling void and diffuser locations, not a generic layout retrofitted to your space." },
      { title: "Sheet metal or flexible, matched to the run", body: "Rigid sheet metal duct suits main trunk runs; flexible duct is used for shorter final connections to diffusers - both are priced and specified appropriately for their role in the system." },
      { title: "Coordinated with the ceiling trade above it", body: "Duct routing is agreed with the ceiling and electrical trades sharing the same void before anything closes up, avoiding rework once tiles or gypsum are in place." },
    ],
    faqs: [
      { q: "What's the difference between sheet metal and flexible duct?", a: "Sheet metal duct is rigid and used for the main trunk runs carrying larger air volumes; flexible duct is used for shorter final connections into individual diffusers, and is faster and easier to route around obstacles." },
      { q: "Does ductwork need insulation?", a: "Yes - insulation prevents condensation and heat loss/gain along the duct run, and is included as standard as part of this type's scope." },
      { q: "How does ductwork get coordinated with ceiling and electrical work?", a: "Your Captain sequences duct routing against the ceiling and electrical first-fix so all three trades agree on the ceiling void layout before anything is closed in." },
    ],
  },
  "hvac.diffusers": {
    intro: [
      "Diffusers and grilles are where conditioned air actually enters and leaves a room - supply diffusers and return grilles, priced per unit and positioned against your ceiling and furniture layout.",
      "Placement matters more than most people expect: a diffuser positioned wrong can create an uncomfortable draft over a specific desk, or leave a corner of the room barely conditioned at all, even with a correctly-sized system behind it.",
    ],
    benefits: [
      { title: "Positioned against your actual floor plan", body: "Diffuser and grille placement is planned against real desk and furniture layout, not an even grid that ignores where people actually sit." },
      { title: "Balances the system's performance room by room", body: "Correct diffuser sizing and placement is what turns a well-sized HVAC system into even, comfortable coverage across the whole floor - not just adequate total capacity." },
      { title: "Matched to the ceiling type", body: "Diffuser and grille styles are specified to suit the ceiling system they're set into, whether that's a suspended grid, gypsum, or a feature ceiling." },
    ],
    faqs: [
      { q: "Can diffuser placement cause uncomfortable drafts?", a: "Yes, if positioned poorly - a diffuser directly above a desk can create a noticeable draft even from a correctly-sized system; your Captain plans placement against your actual seating layout to avoid this." },
      { q: "What's the difference between a supply diffuser and a return grille?", a: "Supply diffusers deliver conditioned air into the room; return grilles pull air back into the system to be re-conditioned - a balanced layout needs both in the right ratio and position." },
      { q: "Are diffusers adjustable after installation?", a: "Many diffusers allow some airflow direction adjustment after fitting, but major repositioning means moving ductwork - which is why getting placement right during the design stage matters." },
    ],
  },
  "hvac.freshAir": {
    intro: [
      "Fresh air ventilation brings outside air into the building and exhausts stale air out - air handling units and exhaust systems, priced and sized against your floor area and occupancy. PickTheBrick supplies and installs both.",
      "This is distinct from cooling: an HVAC system can be sized correctly for temperature and still leave a space feeling stuffy without adequate fresh air exchange, which matters both for comfort and for meeting UAE building ventilation requirements.",
    ],
    benefits: [
      { title: "Addresses air quality, not just temperature", body: "Fresh air systems bring in outside air and remove stale air, which cooling capacity alone doesn't solve - important for both comfort and code compliance." },
      { title: "Sized to occupancy, not just floor area", body: "Fresh air requirements scale with how many people actually occupy the space, which your Captain factors in alongside the standard per-sqm HVAC sizing." },
      { title: "Air handling units and exhaust, one coordinated system", body: "Supply-side air handling and exhaust extraction are specified together so the space stays properly balanced, not over-pressurised or under-ventilated." },
    ],
    faqs: [
      { q: "Is fresh air ventilation required by code in Dubai offices?", a: "UAE building regulations generally require a minimum fresh air exchange rate for occupied commercial space - your Captain confirms exact requirements against your building and floor area." },
      { q: "Where do exhaust systems typically get used in an office?", a: "Pantries, bathrooms, and any enclosed space generating odour or moisture are the most common exhaust locations, alongside the general fresh air supply to the main floor." },
      { q: "Does fresh air ventilation affect the HVAC cooling load?", a: "Yes - bringing in outside air (especially in Dubai's climate) adds to the cooling load the system has to handle, which is factored into overall HVAC sizing rather than treated as a separate calculation." },
    ],
  },

  // ---------- Electrical ----------
  "electrical.powerWiring": {
    intro: [
      "Power wiring is the base circuit infrastructure every desk, appliance, and system in the office plugs into - standard circuits and heavy-duty/sub-mains wiring. PickTheBrick supplies and installs both, priced per square metre and sized against your actual equipment and headcount plan.",
      "Standard circuits cover general desk and appliance loads; heavy-duty and sub-mains wiring is specced wherever a space has genuinely higher power demand - server rooms, kitchen equipment, or heavy machinery.",
    ],
    benefits: [
      { title: "Sized to real equipment load, not a generic assumption", body: "Circuit capacity is planned against your actual desk count and equipment plan, avoiding both an underpowered layout and unnecessary over-specification." },
      { title: "Heavy-duty circuits where they're actually needed", body: "Server rooms, pantries, and equipment-heavy areas get sub-mains and heavy-duty circuits specified for their real load, rather than sharing standard office circuits." },
      { title: "First-fixed before ceilings and walls close up", body: "Power wiring is sequenced as one of the first trades in, so cable routes are locked in before they become inaccessible behind finished surfaces." },
    ],
    faqs: [
      { q: "What counts as a 'heavy-duty' circuit requirement?", a: "Server rooms, commercial kitchen equipment, EV charging, and similar higher-draw loads typically need dedicated heavy-duty or sub-mains circuits rather than standard office wiring - flag any of these to your Captain during quoting." },
      { q: "Can power wiring be added to after the fit-out is complete?", a: "It's possible but more disruptive - adding circuits after walls and ceilings are closed means cutting into finished surfaces, so it's worth over-specifying slightly at the design stage if future growth is expected." },
      { q: "Does power wiring need a DEWA inspection?", a: "Yes, DEWA typically inspects new commercial electrical installations - your Captain includes this in the authority approvals process if your fit-out requires it." },
    ],
  },
  "electrical.dataCabling": {
    intro: [
      "Data and networking cabling carries every internet connection, VoIP line, and networked device in the office - copper Cat cabling and fibre optic. PickTheBrick supplies and installs both, priced per point and planned against your desk layout and IT requirements.",
      "Copper Cat cabling handles the vast majority of standard office data and phone connections; fibre is specced for backbone runs between comms rooms or floors, or wherever very high bandwidth is genuinely required.",
    ],
    benefits: [
      { title: "Planned against your actual desk and device layout", body: "Data point placement is mapped to your real seating and equipment plan, not an even grid that misses where connections are actually needed." },
      { title: "Copper for desks, fibre for backbone", body: "Standard Cat cabling serves individual desk and device connections; fibre is used where bandwidth or distance between comms points calls for it - both quoted per point/run." },
      { title: "Tested and certified on completion", body: "Data cabling is tested and certified after installation, so every point is confirmed working before handover, not assumed." },
    ],
    faqs: [
      { q: "How many data points does a typical desk need?", a: "It varies by setup, but two to four points per desk (covering a computer, VoIP phone, and any secondary device) is a common baseline - your Captain confirms this against your actual equipment plan." },
      { q: "When is fibre optic cabling actually necessary in an office?", a: "Mainly for backbone connections between a comms room and floor distribution points, or between floors/buildings - most desk-level connections run on standard copper Cat cabling." },
      { q: "Is Wi-Fi access point cabling included in this type?", a: "Cabling to wireless access point locations is included under data cabling - the access point hardware itself is typically scoped as IT equipment outside this catalog." },
    ],
  },
  "electrical.distributionBoards": {
    intro: [
      "Distribution boards are where power gets split and protected across the whole electrical system - lighting & power boards and specialty boards for higher-demand circuits. PickTheBrick supplies and installs both, sized against your floor's total electrical load.",
      "Getting distribution board capacity right at the design stage matters because it's genuinely disruptive to upgrade later - this is one of the electrical decisions worth over-specifying slightly if any future expansion is even loosely on the table.",
    ],
    benefits: [
      { title: "Sized for your total floor load, with headroom", body: "Board capacity is calculated against your full lighting, power, and equipment plan, with reasonable headroom for future additions rather than a bare minimum spec." },
      { title: "Specialty boards for higher-demand circuits", body: "Server rooms, heavy equipment, or EV charging can be given dedicated specialty distribution rather than sharing general lighting and power boards." },
      { title: "Clearly labelled and documented", body: "Every board is labelled and documented on handover, so any future electrician or facilities team can work on the system safely without guesswork." },
    ],
    faqs: [
      { q: "Why does distribution board capacity matter if the current load is covered?", a: "Upgrading a distribution board after a fit-out is complete is disruptive and costly compared with specifying reasonable headroom from the start - worth discussing with your Captain if any future headcount or equipment growth is anticipated." },
      { q: "What's a 'specialty' distribution board used for?", a: "Higher-demand or isolated circuits - server rooms, kitchen equipment, EV charging - that benefit from being separated from general lighting and power distribution." },
      { q: "Are distribution boards inspected by DEWA?", a: "Yes, as part of the broader electrical installation inspection - your Captain includes this in the authority approvals process where required." },
    ],
  },
  "electrical.switchesSockets": {
    intro: [
      "Switches and sockets are the electrical fittings people interact with every day - standard and premium/designer ranges. PickTheBrick supplies and installs both, priced per point.",
      "The standard range covers every general office need reliably; the premium/designer range is specced for higher-visibility areas - reception, boardrooms, executive offices - where the fitting itself is part of the finish, not just a utility.",
    ],
    benefits: [
      { title: "Standard range covers every general need", body: "Reliable, cost-effective switches and sockets for the vast majority of an office floor plate." },
      { title: "Premium/designer range for visible areas", body: "A higher-finish range is available for reception, boardrooms, and executive spaces where the fitting is part of the visual design, not hidden behind furniture." },
      { title: "Consistent placement planning", body: "Socket and switch positions are planned against furniture and layout during the electrical design stage, not added as an afterthought once desks arrive." },
    ],
    faqs: [
      { q: "Where does it make sense to specify the premium/designer range?", a: "Reception, boardrooms, and executive offices are the typical areas - anywhere the fitting itself is visible and part of the interior finish, rather than tucked behind a desk." },
      { q: "Can USB charging sockets be specified instead of standard power sockets?", a: "Yes - combination power/USB sockets are available as a specification option; flag this preference to your Captain when the electrical layout is being finalised." },
      { q: "How many sockets does a standard desk position typically get?", a: "This is planned against your actual furniture layout and equipment needs rather than a fixed number - your Captain confirms this as part of the electrical design." },
    ],
  },
  "electrical.emergencyLighting": {
    intro: [
      "Emergency lighting circuits keep escape routes lit and visible if the main power fails - circuit wiring and control systems, priced and specified to meet UAE life-safety code. PickTheBrick supplies and installs both.",
      "This is one of the electrical categories Civil Defense checks specifically, since emergency lighting placement and function directly affects safe evacuation - getting the circuit and control design right the first time avoids issues at inspection.",
    ],
    benefits: [
      { title: "Specified to UAE life-safety code", body: "Emergency lighting circuit design and fixture placement follow Civil Defense requirements for escape route illumination, not a generic assumption." },
      { title: "Control systems for automatic testing and monitoring", body: "Emergency lighting control systems can automate routine testing and flag faults, rather than relying on manual periodic checks alone." },
      { title: "Coordinated with the main lighting design", body: "Emergency circuits are planned alongside standard lighting so escape route illumination is genuinely continuous, not an afterthought bolted onto the main lighting layout." },
    ],
    faqs: [
      { q: "Is emergency lighting required in every office fit-out?", a: "UAE commercial buildings generally require emergency lighting on escape routes as part of Civil Defense requirements - your Captain confirms exact requirements for your specific building and floor plate." },
      { q: "How is emergency lighting tested after installation?", a: "Emergency lighting is tested as part of the authority approval/inspection process, and control systems can support ongoing periodic testing afterward." },
      { q: "Does emergency lighting need a separate power source?", a: "Emergency fixtures typically include battery backup (or are fed from a dedicated emergency circuit) so they function during a main power failure - this is a defining feature of the system, not an optional extra." },
    ],
  },
  "electrical.earthing": {
    intro: [
      "Earthing and lightning protection are the safety systems most people never think about until something goes wrong - earthing systems and lightning protection, specified and installed to protect the building's electrical system and occupants. PickTheBrick supplies and installs both.",
      "This is foundational electrical infrastructure rather than a visible finish - it doesn't show up in a walkthrough, but it's checked during authority approval and matters for the safety of everything else in the electrical system.",
    ],
    benefits: [
      { title: "Protects the entire electrical system, not just one circuit", body: "A correctly designed earthing system protects every circuit and piece of equipment connected to it, not just the point where a fault occurs." },
      { title: "Lightning protection where the building requires it", body: "Lightning protection systems are specified against the building's height and exposure, following UAE code requirements." },
      { title: "Documented for authority sign-off", body: "Earthing and lightning protection design is documented as part of the authority approvals process your Captain manages if your fit-out requires formal inspection." },
    ],
    faqs: [
      { q: "Does every office fit-out need its own earthing system, or does the building already have one?", a: "Most commercial buildings have base building earthing infrastructure that a fit-out's electrical system ties into - your Captain confirms what's already in place and what the fit-out specifically needs to add or verify." },
      { q: "Is lightning protection relevant for a mid-floor office fit-out?", a: "It's primarily a building-level system relevant to rooftop and structural design rather than an individual floor fit-out - flagged here mainly for fit-outs that include rooftop plant or antenna installations." },
      { q: "How is earthing system integrity verified?", a: "Earthing resistance testing is carried out as part of the electrical installation sign-off, confirming the system meets code requirements before handover." },
    ],
  },

  // ---------- CCTV ----------
  "cctv.dome": {
    intro: [
      "Dome cameras are the most common CCTV format for indoor office coverage - discreet, hard to tell which way they're pointed, and available in outdoor/weatherproof builds for exterior or covered areas. PickTheBrick supplies and installs both indoor and outdoor dome cameras, priced per camera with cabling and configuration included.",
      "Their low-profile housing makes dome cameras the default choice for reception, corridors, and open-plan areas where a camera needs to be present but not visually dominant.",
    ],
    benefits: [
      { title: "Discreet, vandal-resistant housing", body: "The dome shape conceals which direction the camera is pointed and is more resistant to tampering than an exposed camera body." },
      { title: "Indoor or outdoor/weatherproof, one product family", body: "Both variants are quoted and installed the same way, making it straightforward to extend coverage from indoor reception to a covered outdoor entrance." },
      { title: "Cabling and basic configuration included", body: "Each camera's price covers the cable run back to a recorder and initial setup - no separate cabling contractor needed." },
    ],
    faqs: [
      { q: "Are dome cameras suitable for outdoor coverage?", a: "The weatherproof outdoor dome variant is rated for exterior or covered outdoor use; the standard indoor dome is not weather-rated and should stay inside." },
      { q: "Why choose dome cameras over bullet cameras for an office?", a: "Domes are more discreet and don't clearly indicate viewing direction, which suits general indoor coverage; bullet cameras are more visible and directional, often preferred as a visible deterrent at entry points." },
      { q: "Can dome cameras cover a large open-plan area on their own?", a: "One dome typically covers a defined area effectively - larger open floor plates usually need multiple cameras positioned to avoid blind spots, which your Captain plans against your actual floor layout." },
    ],
  },
  "cctv.bullet": {
    intro: [
      "Bullet cameras are the visible, directional option in the CCTV range - standard and long-range/perimeter variants. PickTheBrick supplies and installs both, priced per camera with cabling and configuration included.",
      "Their obvious housing and clear line of sight make them a deliberate visual deterrent at entrances and perimeters, which is often exactly the point - unlike a dome, nobody has to guess whether a bullet camera is watching a specific direction.",
    ],
    benefits: [
      { title: "Clearly visible as a deterrent", body: "The obvious housing and directional mount make bullet cameras an intentional visual signal at entry points, not just a coverage tool." },
      { title: "Long-range variant for perimeters", body: "The long-range/perimeter option extends effective coverage distance, suited to outdoor boundaries or long approach areas." },
      { title: "Straightforward directional aiming", body: "A bullet camera's mount makes it easy to see and confirm exactly what it's covering, useful for entrances where coverage needs to be precise and verifiable." },
    ],
    faqs: [
      { q: "When should long-range/perimeter bullet cameras be used over standard?", a: "Wherever the camera needs to cover distance - a long driveway, a building perimeter, or a wide outdoor approach - rather than a single entry point or room." },
      { q: "Do bullet cameras work well at night?", a: "Most bullet camera products include infrared or low-light capability suited to entrance and perimeter monitoring after dark - exact specification depends on the product chosen for your site." },
      { q: "Can bullet and dome cameras be mixed on the same system?", a: "Yes - it's common to use bullet cameras at entrances and perimeters for visible deterrence, and dome cameras indoors for discreet general coverage, all on one recording system." },
    ],
  },
  "cctv.ptz": {
    intro: [
      "PTZ (pan-tilt-zoom) cameras can be remotely steered and zoomed rather than covering a single fixed view - standard and specialty PTZ. PickTheBrick supplies and installs both, priced per camera with cabling and configuration included.",
      "This type is specced where active, on-demand monitoring of a large or variable area matters more than fixed continuous coverage - a large open perimeter, a car park, or any space where security staff need to actively track something rather than just record it.",
    ],
    benefits: [
      { title: "Actively steerable, not fixed to one view", body: "A PTZ camera can be panned, tilted, and zoomed remotely to follow activity, covering far more ground than a fixed camera in the same position." },
      { title: "Covers large or variable areas efficiently", body: "One well-positioned PTZ can substitute for several fixed cameras across a large open area, at the cost of active rather than passive coverage." },
      { title: "Specialty variants for demanding use cases", body: "Specialty PTZ models are available for particularly large areas or challenging lighting/distance conditions beyond what a standard PTZ handles well." },
    ],
    faqs: [
      { q: "Does a PTZ camera need someone actively controlling it?", a: "It can be actively controlled by security staff for real-time monitoring, or set to preset patrol patterns/auto-tracking depending on the configuration - your Captain can advise on the right setup for your use case." },
      { q: "Is a PTZ camera a replacement for several fixed cameras?", a: "In some large open areas, yes - one PTZ can cover ground that would otherwise need multiple fixed units, though it trades off simultaneous full coverage for active flexibility." },
      { q: "What's the difference between standard and specialty PTZ?", a: "Specialty PTZ models offer greater zoom range, better low-light performance, or coverage distance for particularly demanding sites - standard PTZ suits most typical commercial coverage needs." },
    ],
  },
  "cctv.nvr": {
    intro: [
      "NVR and recording systems are where every camera's footage actually gets stored and managed - standalone NVR units and server-based VMS (video management software). PickTheBrick supplies and installs both, sized to your camera count and retention needs.",
      "The choice between the two comes down to scale: a standalone NVR suits a straightforward single-site camera system, while server-based VMS is built for larger deployments, multiple sites, or more advanced search and analytics needs.",
    ],
    benefits: [
      { title: "Sized to your actual camera count and retention needs", body: "Storage capacity and system type are calculated against how many cameras you have and how long footage needs to be retained, not a generic assumption." },
      { title: "Standalone or server-based, matched to scale", body: "A standalone NVR is simpler and more cost-effective for a single-site system; server-based VMS scales to larger or multi-site deployments with more advanced management needs." },
      { title: "Remote viewing configured as standard", body: "Basic remote viewing setup is included with installation, so footage can be checked off-site without an on-premises-only limitation." },
    ],
    faqs: [
      { q: "How much storage does a typical office CCTV system need?", a: "It depends on camera count, resolution, and how many days of footage you want retained - your Captain calculates this once your camera plan and retention requirement are confirmed." },
      { q: "When is server-based VMS worth it over a standalone NVR?", a: "Larger camera counts, multiple sites needing central management, or a need for advanced search/analytics are the typical reasons to step up to VMS rather than a standalone recorder." },
      { q: "Can an existing recording system be expanded rather than replaced?", a: "Depending on the existing system's capacity and compatibility, expansion is sometimes possible - your Captain can assess this against what's already installed on site." },
    ],
  },
  "cctv.accessControl": {
    intro: [
      "Access control integration ties CCTV into door entry systems - door controllers and turnstiles/barriers. PickTheBrick supplies and installs both, priced per point and integrated with your camera and recording system where relevant.",
      "This type is specced wherever an office needs more than a standard lock and key - card, fob, or biometric-controlled doors, and in higher-security or higher-traffic environments, full turnstile or barrier control at the main entrance.",
    ],
    benefits: [
      { title: "Controlled entry without managing physical keys", body: "Card, fob, or biometric access removes the operational overhead of physical key management and lets access be revoked instantly when needed." },
      { title: "Turnstiles and barriers for higher-traffic entrances", body: "Where a standard controlled door isn't enough - higher security requirements or heavy foot traffic - turnstile and barrier systems manage entry more robustly." },
      { title: "Integrates with your CCTV system", body: "Access control events can be tied to camera footage, giving a combined record of who accessed a door and what the camera captured at that moment." },
    ],
    faqs: [
      { q: "What's the difference between a door controller and a turnstile system?", a: "A door controller manages electronic locking on a standard door with card/fob/biometric access; turnstiles and barriers are physical entry-control hardware suited to higher-security or higher-traffic entrances like a main lobby." },
      { q: "Can access control be added to existing doors, or does it need new doors?", a: "It can generally be retrofitted to existing doors with compatible hardware and wiring - your Captain assesses this against your specific doors during scoping." },
      { q: "Does access control integration require its own recording system?", a: "It can share the same NVR/VMS system as your cameras, with access events logged alongside footage - this is a configuration decision made during system design." },
    ],
  },
  "cctv.analytics": {
    intro: [
      "Video analytics adds intelligence on top of raw camera footage - basic and advanced AI analytics. PickTheBrick supplies and configures both, layered onto your existing camera and recording system.",
      "Basic analytics covers common needs like motion detection and line-crossing alerts; advanced AI analytics goes further with capabilities like people counting, facial recognition, or behaviour pattern detection, depending on the specific product and use case.",
    ],
    benefits: [
      { title: "Turns passive footage into active alerts", body: "Analytics can flag events - motion in a restricted area, a line crossed after hours - rather than requiring someone to review footage manually to catch them." },
      { title: "Basic or advanced, matched to the actual need", body: "Simple motion and line-crossing detection covers most office security needs; advanced AI analytics is available for more specific requirements like occupancy counting or behaviour detection." },
      { title: "Layers onto your existing camera system", body: "Analytics is typically a software/configuration layer on top of your cameras and recording system, not a separate hardware installation." },
    ],
    faqs: [
      { q: "What's a realistic use case for basic analytics in an office?", a: "Motion detection alerts after hours, or line-crossing alerts at a restricted entrance, are common, straightforward use cases that add real value without much complexity." },
      { q: "Does advanced AI analytics need special cameras?", a: "Some advanced analytics features perform best with cameras and recording hardware specifically rated for it - your Captain confirms compatibility with your planned camera spec before this is added to a quote." },
      { q: "Can analytics be added to a system after the initial CCTV installation?", a: "In many cases yes, provided the existing cameras and recording system support it - this is assessed against what's already installed or planned." },
    ],
  },

  // ---------- Authority Approvals ----------
  "approvals.municipality": {
    intro: [
      "Dubai Municipality approval covers the fit-out permit and the inspections/NOCs that follow it - the foundational authority sign-off most commercial fit-outs need before work can legally begin, and again before occupancy. PickTheBrick manages both as a scoped, priced part of your project.",
      "This is typically the first approval in the sequence, since work generally can't start without a permit in hand - your Captain times the permit application against your project's actual start date so it isn't the thing holding up the schedule.",
    ],
    benefits: [
      { title: "Sequenced to not hold up your start date", body: "Permit applications are timed against your actual project schedule, so approval isn't the bottleneck delaying when work can begin." },
      { title: "Inspections and NOCs tracked as part of the same process", body: "Post-permit inspections and no-objection certificates are managed by the same team handling the initial permit, not handed off separately." },
      { title: "One Captain across the whole approval chain", body: "Your project Captain tracks Municipality approval alongside every other trade on the same timeline, rather than treating it as a disconnected side process." },
    ],
    faqs: [
      { q: "What does a Dubai Municipality fit-out permit actually cover?", a: "It's the base authorisation required to legally carry out fit-out construction work in most commercial buildings - specific requirements vary by building and scope, which your Captain confirms for your project." },
      { q: "How long does Municipality approval typically take?", a: "It varies by building and submission completeness - submitting a complete, well-documented application the first time is the biggest factor in avoiding delay, which is where your Captain's experience with the process helps." },
      { q: "What's the difference between the permit and the later inspections/NOCs?", a: "The permit authorises the work to begin; inspections and NOCs confirm the completed work meets requirements, typically needed before the space can be occupied - both are managed as one continuous process." },
    ],
  },
  "approvals.civilDefense": {
    intro: [
      "Civil Defense (fire) approval covers fire drawing approval and the inspection/certificate that follows construction - checking fire-rated doors, partition ratings, emergency lighting, and life-safety systems against UAE fire code. PickTheBrick manages both as a scoped, priced part of your project.",
      "This is one of the approvals most directly tied to specific product choices elsewhere in your quote - fire-rated doors, acoustic/fire partition ratings, and emergency lighting circuits all feed directly into what Civil Defense checks, which is why coordinating the approval against those trades matters.",
    ],
    benefits: [
      { title: "Tied directly to the trades it depends on", body: "Fire-rated doors, partition ratings, and emergency lighting are tracked against Civil Defense requirements as those trades are specced and installed, not reconstructed after the fact." },
      { title: "Drawing approval before construction, inspection after", body: "Fire strategy drawings are approved before work begins, and inspection happens once construction is complete - both stages managed on the same project timeline." },
      { title: "Reduces the risk of a failed inspection", body: "Because approval is coordinated with the actual trade specifications (not treated as a disconnected paperwork exercise), the risk of a mismatch being caught at inspection is significantly lower." },
    ],
    faqs: [
      { q: "What does Civil Defense actually check during inspection?", a: "Fire-rated doors and partitions, emergency lighting, fire alarm and detection systems, and general life-safety compliance are the typical focus areas - specifics depend on your building and fit-out scope." },
      { q: "Does every fit-out need Civil Defense approval?", a: "Requirements depend on the scope of work and your specific building - your Captain confirms what applies once your project details are known." },
      { q: "What happens if fire drawing approval requires changes to the design?", a: "Your Captain coordinates any required design changes with the relevant trades before construction proceeds, so the approved drawings and the actual build stay in sync." },
    ],
  },
  "approvals.dewa": {
    intro: [
      "DEWA approval covers electrical load approval and water & chiller approval - the utility-side sign-offs for a commercial fit-out's power and water/cooling infrastructure. PickTheBrick manages both as a scoped, priced part of your project.",
      "Electrical load approval in particular ties directly to your distribution board and power wiring specification, so this approval is coordinated with the electrical trade rather than treated as a separate administrative step.",
    ],
    benefits: [
      { title: "Coordinated with your actual electrical design", body: "Load approval is based on your real distribution board and circuit specification, not a generic assumption reconciled after the fact." },
      { title: "Covers both electrical and water/chiller where relevant", body: "Water and chiller approval is scoped alongside electrical load approval for fit-outs where both apply, rather than as two disconnected processes." },
      { title: "Managed on the same timeline as construction", body: "DEWA approval is sequenced against the electrical and HVAC trades' actual progress, not booked speculatively before the relevant work is ready." },
    ],
    faqs: [
      { q: "What is DEWA electrical load approval checking?", a: "That your fit-out's electrical demand is properly registered and within the capacity allocated to your unit/building, coordinated with your actual distribution board design." },
      { q: "When does water & chiller approval apply?", a: "It's relevant where your fit-out affects water supply or a chilled water HVAC system - your Captain confirms whether this applies to your specific project and building type." },
      { q: "Can DEWA approval be applied for before the electrical design is finalised?", a: "Generally the application needs your actual electrical load design, which is why this approval is coordinated with the electrical trade rather than started independently." },
    ],
  },
  "approvals.trakhees": {
    intro: [
      "Trakhees approval applies to fit-outs in Trakhees-governed free zones - design approval and completion approval, run in parallel to (or instead of) Dubai Municipality's process depending on your building's jurisdiction. PickTheBrick manages both as a scoped, priced part of your project.",
      "Getting the jurisdiction right at the start matters - a free zone building under Trakhees follows a different approval authority and process than a Municipality-governed building, and your Captain confirms which applies before anything is submitted.",
    ],
    benefits: [
      { title: "Matched to the right jurisdiction from the start", body: "Your Captain confirms whether your building falls under Trakhees or Dubai Municipality before any approval is submitted, avoiding a submission to the wrong authority." },
      { title: "Design approval before construction, completion approval after", body: "Both stages are managed as part of the same coordinated process, timed against your actual project schedule." },
      { title: "One point of contact across the whole process", body: "Your Captain tracks Trakhees approval the same way as any other authority approval, integrated with the rest of your project timeline." },
    ],
    faqs: [
      { q: "How do I know if my building falls under Trakhees rather than Dubai Municipality?", a: "It depends on which free zone or jurisdiction your building sits within - your Captain confirms this based on your building's address and ownership structure during project scoping." },
      { q: "Is the Trakhees approval process different from Municipality's?", a: "The specific documentation and process steps differ by authority, though the overall shape (design approval before construction, completion approval after) is similar - your Captain manages the specifics for whichever authority applies." },
      { q: "Can a fit-out need both Trakhees and Dubai Municipality approval?", a: "Generally a building falls under one primary authority, but specific circumstances vary - this is confirmed for your project during scoping rather than assumed." },
    ],
  },
  "approvals.asBuilt": {
    intro: [
      "As-built drawings document what was actually constructed, not just what was originally designed - architectural and MEP as-builts. PickTheBrick prepares both as a scoped, priced part of your project, typically required for final handover and future facilities management.",
      "Construction rarely matches the original drawing set exactly - minor adjustments happen on site - so as-built documentation exists specifically to give an accurate record of the completed space for anyone maintaining or modifying it later.",
    ],
    benefits: [
      { title: "An accurate record of what was actually built", body: "As-builts capture the real, final condition of the space, not the original design intent, which matters for anyone working on the space in future." },
      { title: "Architectural and MEP, both covered", body: "Both the architectural layout and the mechanical/electrical/plumbing systems are documented, giving a complete record rather than a partial one." },
      { title: "Prepared as construction completes, not reconstructed later", body: "As-built documentation is captured as the relevant trades finish, rather than attempted retrospectively from memory once the project is long closed out." },
    ],
    faqs: [
      { q: "Why do I need as-built drawings if I already have the original design drawings?", a: "Site conditions and minor adjustments during construction almost always mean the finished space differs slightly from the original drawings - as-builts capture the actual final condition, which matters for future maintenance, alterations, or authority requirements." },
      { q: "Are as-built drawings required by any authority?", a: "Some authority completion/handover processes expect as-built documentation - your Captain confirms specific requirements for your building and jurisdiction." },
      { q: "Who typically needs as-built drawings after handover?", a: "Facilities management teams, future contractors doing any alteration work, and sometimes the landlord or authority records all rely on accurate as-built documentation." },
    ],
  },
  "approvals.completionCert": {
    intro: [
      "The completion certificate is the final sign-off confirming your fit-out is finished and compliant - authority completion certificate and handover documentation. PickTheBrick manages both as a scoped, priced part of your project, closing out the authority approval chain that began with the initial permit.",
      "This is the last step in the approvals sequence, and typically what allows the space to be legally occupied - your Captain sequences it once every other trade and approval stage is genuinely complete, not before.",
    ],
    benefits: [
      { title: "Closes out the full approval chain", body: "The completion certificate follows directly from the permit, inspections, and any interim approvals earlier in the process - it's the final confirmation, not a standalone step." },
      { title: "Bundled with full handover documentation", body: "Completion certification is delivered alongside the broader handover package, giving you one complete record at project close rather than scattered documents." },
      { title: "Sequenced only once genuinely ready", body: "Your Captain confirms every relevant trade and prior approval stage is actually complete before this is submitted, avoiding a rejected or delayed final sign-off." },
    ],
    faqs: [
      { q: "What's needed before a completion certificate can be issued?", a: "Generally, all relevant construction and prior authority approval stages (permit, inspections) need to be complete and passed - your Captain confirms the specific sequence for your building and jurisdiction." },
      { q: "Does the completion certificate cover fire and electrical sign-off too?", a: "It typically follows and references the relevant individual approvals (Civil Defense, DEWA, Municipality) rather than replacing them - it's the final confirmation that the full chain is complete." },
      { q: "What's included in the handover documentation package?", a: "As-built drawings, warranty information, and relevant certificates are typically bundled together at handover - your Captain confirms exactly what's included for your specific project." },
    ],
  },

  // ---------- Lighting ----------
  "lighting.recessed": {
    intro: [
      "Recessed downlights are the workhorse of general office ceiling lighting - LED downlight and adjustable/gimbal variants. PickTheBrick supplies and installs both, priced per fixture with fitting and circuit connection included.",
      "Standard LED downlights give even, general illumination across open-plan areas; adjustable/gimbal fixtures can be aimed, useful for highlighting a specific wall, reception feature, or artwork rather than just lighting the floor evenly.",
    ],
    benefits: [
      { title: "Even, efficient general illumination", body: "LED downlights are the standard, cost-effective way to light an open-plan floor evenly and efficiently." },
      { title: "Adjustable fixtures for accent needs", body: "Gimbal downlights can be aimed after installation, useful for highlighting features without needing a separate track lighting system." },
      { title: "Circuit connection included in the fixture price", body: "Each fixture's rate covers wiring back to the relevant circuit, coordinated with the electrical trade already in your quote." },
    ],
    faqs: [
      { q: "Are LED downlights bright enough for a full open-plan office on their own?", a: "Standard LED downlights are specified and spaced to meet commercial office illumination levels - your Captain confirms fixture count and spacing against your specific floor plate." },
      { q: "What's the benefit of adjustable/gimbal downlights over standard?", a: "Gimbal fixtures can be aimed to highlight a specific wall, feature, or reception element after installation, giving more flexibility than a fixed straight-down beam." },
      { q: "Can downlights be dimmed or zoned separately?", a: "Yes - dimming and zoned circuits can be specified as part of the electrical layout; flag this preference when your lighting design is being scoped." },
    ],
  },
  "lighting.pendant": {
    intro: [
      "Pendant lights hang down from the ceiling as a deliberate design feature, not just a source of illumination - single pendant and cluster/multi-drop configurations. PickTheBrick supplies and installs both, priced per fixture with fitting and circuit connection included.",
      "These are typically specced for reception desks, breakout areas, or above a boardroom table - anywhere the light fixture itself is meant to be noticed, not just felt.",
    ],
    benefits: [
      { title: "A genuine design feature, not just illumination", body: "Pendant fixtures are chosen and positioned as a visible part of the interior design, distinct from the general downlight grid." },
      { title: "Single or cluster/multi-drop configurations", body: "A single statement pendant suits a reception desk; a cluster of multiple drops at varying heights suits a larger feature area like a breakout zone." },
      { title: "Positioned against your actual furniture layout", body: "Pendant placement is planned against where the feature furniture (reception desk, boardroom table) actually sits, not a generic ceiling grid position." },
    ],
    faqs: [
      { q: "Where do pendant lights typically get specified in an office?", a: "Reception desks, breakout/lounge areas, and above boardroom tables are the most common locations - anywhere the fixture itself is meant to be a visible design element." },
      { q: "Do pendant lights need a higher ceiling than downlights?", a: "Pendants need enough drop height to hang properly without interfering with circulation or furniture below - your Captain confirms feasibility against your specific ceiling height and layout." },
      { q: "Can pendant fixtures be dimmed independently of the general lighting?", a: "Yes - pendant circuits are commonly specified on their own dimmable zone so feature lighting can be adjusted independently of general office illumination." },
    ],
  },
  "lighting.track": {
    intro: [
      "Track lighting mounts fixtures onto a continuous rail that can be repositioned along its length - single circuit and magnetic track systems. PickTheBrick supplies and installs both, priced per fixture/run with fitting and circuit connection included.",
      "This type is specced wherever lighting needs genuine flexibility - a gallery-style wall, a retail-adjacent display area, or any space where what's being highlighted might change over time.",
    ],
    benefits: [
      { title: "Fixtures reposition without rewiring", body: "Individual heads slide and rotate along the track, letting lighting focus change as the space's use or displayed content changes, with no electrical rework needed." },
      { title: "Magnetic track for faster reconfiguration", body: "Magnetic track systems let fixtures be added, removed, or repositioned even more easily than a standard single-circuit track." },
      { title: "Suits feature walls and changing displays", body: "Track lighting is well suited to any wall or area where what's being highlighted - artwork, branding, a rotating display - might change over the life of the fit-out." },
    ],
    faqs: [
      { q: "What's the difference between single circuit and magnetic track?", a: "Single circuit track uses a standard rail with fixtures wired along one circuit; magnetic track uses a low-voltage magnetic rail that makes adding, removing, or repositioning fixtures even faster and more flexible." },
      { q: "Where does track lighting make more sense than fixed downlights?", a: "Anywhere the lighting focus might need to change over time - a feature wall, gallery-style display, or an area with rotating content or branding." },
      { q: "Can track lighting be the primary light source for a room?", a: "It's more commonly used as accent/feature lighting alongside general downlights, rather than as the sole illumination for a whole room - your Captain can advise based on the specific space." },
    ],
  },
  "lighting.linear": {
    intro: [
      "Linear and profile lighting runs as a continuous line rather than individual point fixtures - surface-mounted and recessed profile systems. PickTheBrick supplies and installs both, priced per run with fitting and circuit connection included.",
      "This type is common along corridors, over workstation runs, or as a clean architectural detail at the edge of a ceiling feature - a linear light reads as considerably more contemporary than a row of individual downlights.",
    ],
    benefits: [
      { title: "Continuous, even illumination along a run", body: "A linear profile avoids the pooling and shadowing effect of spaced-out point fixtures, giving smooth light along its length." },
      { title: "Surface-mounted or recessed, matched to the ceiling", body: "Surface-mounted profiles suit a visible architectural line; recessed profiles integrate flush into a gypsum ceiling for an even cleaner look." },
      { title: "A contemporary alternative to standard downlights", body: "Linear lighting reads as more architectural and considered than a repeated grid of round downlights, often specced for corridors and feature ceiling edges." },
    ],
    faqs: [
      { q: "Where does linear lighting typically get used in an office?", a: "Corridors, above workstation runs, and as an edge detail on feature ceiling elements (coves, bulkheads) are the most common applications." },
      { q: "What's the difference between surface-mounted and recessed profile lighting?", a: "Surface-mounted profiles sit on top of the ceiling as a visible line; recessed profiles are built into the ceiling for a flush, integrated look - recessed generally suits a gypsum ceiling design better than a suspended grid." },
      { q: "Can linear lighting be used instead of a full grid of downlights?", a: "It can supplement or, in some layouts, substitute for point downlights along a defined run - your Captain can advise on the right mix for your ceiling design and illumination needs." },
    ],
  },
  "lighting.panel": {
    intro: [
      "Panel lights are flat, even fixtures that drop into a suspended grid ceiling or mount to the surface - ceiling panel and office/task panel variants. PickTheBrick supplies and installs both, priced per fixture with fitting and circuit connection included.",
      "This is a straightforward, efficient option for general office illumination, particularly where a suspended grid ceiling is already specced - the panel simply replaces a standard tile in the same grid.",
    ],
    benefits: [
      { title: "Drops directly into a suspended grid ceiling", body: "Panel lights are sized to fit standard grid ceiling modules, making them a simple, coordinated fit where a grid ceiling is already specced." },
      { title: "Even, glare-controlled illumination", body: "Panel lights are designed to spread light evenly across their surface, reducing glare compared with a bare point-source fixture." },
      { title: "Task panel option for focused work areas", body: "Office/task panel variants are suited to areas needing more focused, consistent light for detailed work, distinct from general ceiling panel illumination." },
    ],
    faqs: [
      { q: "Do panel lights only work with a suspended grid ceiling?", a: "Grid-mounted panels are designed for suspended grid ceilings specifically, but surface-mounted panel options are also available for gypsum or other ceiling types - your Captain confirms the right product for your ceiling spec." },
      { q: "What's the difference between a ceiling panel and an office/task panel?", a: "Both are flat panel fixtures; task panels are typically specified with light output and distribution suited to focused work areas, while general ceiling panels prioritise even area-wide illumination." },
      { q: "Are panel lights dimmable?", a: "Dimmable panel options are available - flag this requirement when your lighting layout is being specified." },
    ],
  },
  "lighting.decorative": {
    intro: [
      "Decorative and feature lighting exists purely to make a design statement - wall sconces and larger feature installations. PickTheBrick supplies and installs both, priced per fixture or per installation with fitting and circuit connection included.",
      "This type is where an office's lighting design gets a genuine point of visual interest - reception, a feature stair, or a boardroom wall are typical locations for a fixture chosen as much for how it looks as what it illuminates.",
    ],
    benefits: [
      { title: "A genuine design statement, not just illumination", body: "Decorative fixtures are chosen for visual impact first, illumination second - a deliberate contrast to the functional lighting elsewhere on the floor." },
      { title: "Wall sconces or larger feature installations", body: "Sconces suit corridors and smaller accent moments; larger feature installations (a sculptural fixture, a lit feature wall) suit reception or a signature space." },
      { title: "Positioned as part of the interior design, not an afterthought", body: "Decorative lighting placement is planned alongside the interior design and furniture layout, not bolted on after the rest of the fit-out is finished." },
    ],
    faqs: [
      { q: "Where does decorative lighting typically get specified?", a: "Reception, feature walls, boardrooms, and breakout areas are the most common locations - wherever the space is meant to make a design impression." },
      { q: "Can a feature lighting installation be custom-designed?", a: "Custom or bespoke feature lighting can be scoped for a specific space - raise this with your Captain early, since custom pieces typically need longer lead times than catalog fixtures." },
      { q: "Does decorative lighting need its own dimmer or circuit?", a: "It's common to put decorative fixtures on their own dimmable zone so they can be adjusted independently of general office lighting - flag this when your electrical layout is being planned." },
    ],
  },

  // ---------- Furniture ----------
  "furniture.workstations": {
    intro: [
      "Workstations are where the majority of an office's headcount actually sits every day - single desk and cluster/bench desk configurations. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "Cluster/bench desking has become the dominant format for open-plan Dubai offices because it uses floor space more efficiently than individual single desks, while single desks remain the right call for private offices or lower-density layouts.",
    ],
    benefits: [
      { title: "Cluster desking maximises open-plan density", body: "Bench-style clusters seat more people per square metre than individual single desks, which matters directly for how many desks a given floor plate can hold." },
      { title: "Single desks for private offices and lower density", body: "Where an open-plan cluster isn't the right fit - private offices, lower headcount areas - single desks are quoted on the same straightforward per-unit basis." },
      { title: "Delivery and assembly included", body: "The rate per desk covers getting it into the building and assembled on site, with no separate delivery or installation crew to arrange." },
    ],
    faqs: [
      { q: "How much floor space does a typical cluster desk configuration need per person?", a: "It varies by desk size and cluster configuration - your Captain can advise on a layout that fits your actual headcount and floor plate during the design stage." },
      { q: "Can workstations include cable management and power built in?", a: "Yes - integrated cable management and power/data modules are standard specification options for most desk ranges; flag this requirement when selecting products." },
      { q: "Is it possible to mix single desks and cluster desking on the same floor?", a: "Yes - it's common to use cluster desking for the main open-plan area and single desks for private offices or lower-density zones within the same fit-out." },
    ],
  },
  "furniture.chairs": {
    intro: [
      "Office chairs are the piece of furniture people spend the most hours in contact with all day - task chairs and visitor/meeting chairs. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "Task chairs are specified for ergonomics above all else, given eight-hour daily use; visitor and meeting chairs prioritise a cleaner look and shorter-duration comfort, since they're not sat in continuously the way a desk chair is.",
    ],
    benefits: [
      { title: "Task chairs built for all-day ergonomic use", body: "Task seating is specified with adjustability and support suited to eight-hour daily use, not a chair designed primarily to look good." },
      { title: "Visitor/meeting chairs for shorter-duration comfort", body: "Meeting and visitor seating prioritises a cleaner aesthetic and stackability/space efficiency, appropriate for shorter-duration use." },
      { title: "Delivery and assembly included in every price", body: "The rate per chair covers getting it into the building and assembled - no separate delivery fee to arrange." },
    ],
    faqs: [
      { q: "Is ergonomic seating worth specifying for every desk?", a: "For any desk used for a full working day, yes - ergonomic task seating is a reasonable baseline specification given how much time is spent in it; visitor/meeting areas can use a more design-led, lower-adjustability chair since duration of use is much shorter." },
      { q: "Can chair fabric or finish be customised?", a: "Many ranges offer fabric and finish options - check the specific product detail or flag a requirement to your Captain when building your quote." },
      { q: "How many meeting/visitor chairs does a typical boardroom need?", a: "This is scoped against your actual room size and expected capacity - your Captain confirms quantities as part of the furniture layout for each room." },
    ],
  },
  "furniture.meetingTables": {
    intro: [
      "Meeting tables are sized to the room they're going into - small meeting (4-6 person) and boardroom (8+ person) configurations. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "Getting table size right against the actual room dimensions matters more than people expect - an oversized table cramps circulation space, while an undersized one leaves a boardroom feeling empty.",
    ],
    benefits: [
      { title: "Sized to match the room, not just the headcount", body: "Table dimensions are considered against the actual room's floor area and circulation space, not chosen on capacity alone." },
      { title: "Small meeting and boardroom formats, one supplier", body: "Both scales of meeting table are quoted through the same catalog, so furnishing every meeting room on a floor doesn't mean juggling separate vendors." },
      { title: "Cable management options for AV-equipped rooms", body: "Tables with integrated power/data and cable management are available for rooms that need video conferencing or presentation setups." },
    ],
    faqs: [
      { q: "How do I know what size table fits a specific meeting room?", a: "Your Captain can advise on table dimensions against your actual room measurements, factoring in circulation space around the table, not just the number of seats needed." },
      { q: "Do boardroom tables come with built-in power and AV cable management?", a: "Integrated power/data modules and cable management are available as a specification option on boardroom tables - flag this requirement if the room will host video conferencing or presentations." },
      { q: "Can a meeting table be custom-sized for an unusual room shape?", a: "Custom sizing can be scoped for non-standard rooms - raise this with your Captain, since custom tables typically need a longer lead time than standard catalog sizes." },
    ],
  },
  "furniture.storage": {
    intro: [
      "Storage and cabinets keep an office from accumulating clutter around the desks - pedestals & lockers and cabinets & shelving. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "Pedestals and lockers are typically personal storage tied to a specific desk or team member; cabinets and shelving serve shared storage needs - stationery, files, equipment - distributed around the floor plate.",
    ],
    benefits: [
      { title: "Personal and shared storage, both covered", body: "Pedestals/lockers handle individual desk-level storage; cabinets and shelving cover shared team or floor-wide storage needs, quoted through the same range." },
      { title: "Keeps desks and open-plan areas clutter-free", body: "Properly planned storage is what keeps an open-plan floor looking as clean in year two as it did on move-in day." },
      { title: "Lockable options for secure personal storage", body: "Lockable pedestals and lockers are available where individual secure storage matters, not just open shelving." },
    ],
    faqs: [
      { q: "How much storage does a typical open-plan floor actually need?", a: "It depends heavily on how paper-based the team's workflow still is and whether desks are assigned or hot-desked - your Captain can advise on a reasonable storage ratio based on your headcount and working style." },
      { q: "Are pedestals fixed to a specific desk, or mobile?", a: "Both fixed and mobile pedestal options are available - mobile pedestals suit hot-desking or flexible layouts, fixed pedestals suit assigned desks." },
      { q: "Can storage units be locked individually?", a: "Yes - lockable options are available on both pedestals/lockers and cabinets where secure personal or team storage is needed." },
    ],
  },
  "furniture.receptionDesks": {
    intro: [
      "Reception desks are the first piece of furniture a visitor actually interacts with - standard and custom feature reception. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "A standard reception desk covers the functional brief reliably and cost-effectively; a custom feature reception desk is specced where the desk itself needs to make a brand statement as part of the first impression a visitor gets.",
    ],
    benefits: [
      { title: "Sets the tone for a visitor's first impression", body: "The reception desk is one of the first things a visitor sees - specifying it well is a disproportionately high-impact furniture decision relative to its footprint." },
      { title: "Standard or custom feature, one process", body: "Both a straightforward standard desk and a fully custom feature build go through the same quote and project timeline as the rest of your furniture." },
      { title: "Cable management and power built in", body: "Reception desks are specified with integrated power and data for the equipment a reception desk actually needs - phone, computer, badge printer." },
    ],
    faqs: [
      { q: "How long does a custom feature reception desk take to produce?", a: "Custom joinery pieces take considerably longer than a standard catalog desk - your Captain gives an accurate lead time once the design is finalised, and it's worth flagging early if reception is a priority for opening day." },
      { q: "Can a reception desk incorporate branding or a logo?", a: "Yes - branded elements (a lit logo, specific brand colours or materials) are commonly incorporated into a custom feature reception build." },
      { q: "Does a reception desk need to be wheelchair accessible?", a: "Accessibility requirements can be specified as part of the reception desk design - flag this early, since it affects desk height and layout." },
    ],
  },
  "furniture.loungeSeating": {
    intro: [
      "Soft seating and lounge furniture cover the informal spaces of an office - sofas & armchairs and breakout/pod seating. PickTheBrick supplies and installs both, priced per unit with delivery and assembly included.",
      "This type has grown in importance as more offices build in genuine breakout and informal collaboration space rather than treating every square metre as desk space - a comfortable lounge area does real work in how a team actually uses an office day to day.",
    ],
    benefits: [
      { title: "Built for informal, collaborative use", body: "Sofas, armchairs, and pod seating are specified for comfort and casual collaboration, distinct from task seating built for focused desk work." },
      { title: "Pod seating for semi-private breakout moments", body: "Breakout/pod formats give a degree of acoustic and visual separation within an open breakout area, useful for informal calls or small group conversations." },
      { title: "Delivery and assembly included", body: "The rate per piece covers getting it into the building and assembled on site, same as every other furniture type in the catalog." },
    ],
    faqs: [
      { q: "How much breakout/lounge space should an office actually budget for?", a: "It depends on team culture and working style - your Captain can advise based on how the space is expected to be used, but even a modest, well-furnished breakout zone tends to get real daily use." },
      { q: "What's the benefit of pod seating over a standard sofa arrangement?", a: "Pod formats give a degree of acoustic and visual enclosure within an open area, useful for informal calls or small conversations without needing a fully enclosed room." },
      { q: "Can lounge furniture be specified in brand colours?", a: "Many ranges offer a choice of upholstery colours and finishes - check the specific product or flag a brand-matching requirement to your Captain." },
    ],
  },
};

export function getTypeContent(categoryKey: string, typeKey: string, typeLabel: string, categoryLabel: string): TypeContent {
  return TYPE_CONTENT[`${categoryKey}.${typeKey}`] ?? GENERIC(typeLabel, categoryLabel);
}
