// Editorial copy for the public category "showroom" landing pages
// (app/landing/[category]) - written once per catalog category key so the
// page has enough real, category-specific text for on-page SEO rather than
// just a product grid. Keyed the same as Category.key (see prisma/seed.ts's
// categoryMeta block) with a generic fallback for any category added later
// that hasn't had copy written for it yet.
export type LandingContent = {
  intro: string[];
  benefits: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
};

const GENERIC = (label: string): LandingContent => ({
  intro: [
    `${label} is one of the trades PickTheBrick supplies and installs as part of a Dubai office fitout - priced, ordered, and scheduled the same way as everything else in your quote, with no separate installation line item.`,
    `Every product on this page ships with our standard workmanship warranty and is fitted by a vetted PickTheBrick contractor, coordinated by your assigned Captain from first measurement through handover.`,
  ],
  benefits: [
    { title: "Supply and installation, one price", body: "The rate shown per item already includes fitting - there's no separate install quote to chase down or reconcile later." },
    { title: "Vetted contractors only", body: "Every installer working under a PickTheBrick quote has been through our partner application and category-approval process before they're allowed on a project." },
    { title: "One Captain, start to finish", body: "A single point of contact tracks this trade alongside every other one on your fitout, so nothing falls through the cracks between suppliers." },
  ],
  faqs: [
    { q: "Is installation really included in the price?", a: "Yes - every rate on this page is a supply-and-install price. There's no separate installation invoice." },
    { q: "Can I mix products from this category with others in one quote?", a: "Yes. Add items from as many categories as you need and they'll all sit in the same quote and timeline." },
    { q: "How is this scheduled against the rest of my fitout?", a: "Your Captain sequences every trade on a single project timeline, so this work is coordinated with everything else happening on site." },
    { q: "What if I don't see the exact product I need?", a: "Get in touch after adding a placeholder item to your quote - our team can source close matches or custom specs for most requests." },
  ],
});

export const LANDING_CONTENT: Record<string, LandingContent> = {
  flooring: {
    intro: [
      "Flooring sets the tone for an office before a single desk goes in - it's the first surface anyone notices and the one that takes the most daily wear. PickTheBrick supplies and installs porcelain and ceramic tile, natural stone, carpet tile, luxury vinyl and laminate, and raised access flooring for the technical spaces that need it, all priced per square metre with fitting included.",
      "Every option here is chosen for Dubai's commercial environment - materials that hold up under heavy foot traffic, resist the wear of rolling office chairs, and are sourced from suppliers our team already has a working relationship with, so lead times stay predictable instead of becoming the thing that delays your fit-out.",
    ],
    benefits: [
      { title: "Built for how an office actually gets used", body: "Every range on this page is rated for commercial foot traffic, not residential - so it still looks new after twelve months of daily use, rolling chairs included." },
      { title: "One rate, tiles and labour both in it", body: "The AED figure next to each product already covers levelling, adhesive, and skilled fitting - what you see in the quote is what you pay, no install line item to negotiate separately." },
      { title: "Raised access flooring when the space needs it", body: "Server rooms, trading floors, and heavily-cabled open-plan areas can spec raised access panels alongside standard tile or carpet in the same quote." },
    ],
    faqs: [
      { q: "How long does office flooring installation take?", a: "Most standard tile or carpet tile fit-outs run 3-7 working days depending on floor area and whether the existing floor needs to be stripped first - your Captain confirms an exact timeline once your quote is scheduled." },
      { q: "Can I mix flooring types across different rooms?", a: "Yes - it's common to spec porcelain tile for reception and wet areas, carpet tile for open-plan desks, and raised access flooring for a server room, all within one quote." },
      { q: "Do you handle removal of existing flooring?", a: "Strip-out of existing flooring can be scoped as part of your project - flag it to your Captain when your quote is being finalised so it's costed and scheduled correctly." },
      { q: "What's the difference between porcelain and ceramic tile pricing?", a: "Porcelain is denser and more wear-resistant, which is reflected in a higher per-sqm rate than standard ceramic - both are shown side by side under the Tiles style so you can compare." },
    ],
  },
  partitions: {
    intro: [
      "Partitions are how an open floor plate becomes cabins, meeting rooms, and corridors - and in a Dubai office, that usually means glass. PickTheBrick supplies and installs single and double-glazed glass partitions, aluminium-framed systems, and gypsum partition walls, priced per square metre of wall with fitting included.",
      "Glass partitioning in particular has become close to standard in the region's commercial fit-outs, since it keeps natural light moving through the floor plate while still giving teams acoustic and visual separation - and because DEWA and Civil Defense inspections tend to move faster when partition specs are documented clearly from the start, which is something your Captain handles as part of the project.",
    ],
    benefits: [
      { title: "Glass systems that keep daylight moving", body: "Single and double-glazed framed partitions let light travel across the floor plate instead of carving it into dark, boxed-in rooms." },
      { title: "Framed or frameless, priced per sqm", body: "Aluminium-framed and full-glass options are quoted on the same per-square-metre basis, so comparing them against a gypsum wall is a straight like-for-like number." },
      { title: "Acoustic ratings that match the room's use", body: "Meeting rooms and private cabins can be specced with higher-STC glass or gypsum builds where confidentiality matters more than daylight." },
    ],
    faqs: [
      { q: "Is glass partitioning more expensive than gypsum?", a: "Per square metre, framed glass typically costs more than a standard gypsum wall, but it doesn't need painting or patching later and holds resale value on the fit-out better - your Captain can walk through the trade-off for your specific layout." },
      { q: "Can partitions be moved later if we reorganise the floor?", a: "Demountable and framed glass systems are generally easier to reconfigure than a built gypsum wall - mention future flexibility needs when scoping your quote so the right system gets specced." },
      { q: "Do glass partitions meet Dubai fire and safety codes?", a: "Yes - all glass and framing systems we install are specified to meet UAE Civil Defense requirements, and your Captain documents this as part of the authority approvals process if your fit-out needs one." },
      { q: "How much does partitioning add to a typical office timeline?", a: "Partition installation usually runs in parallel with ceiling and electrical works rather than adding standalone time to the schedule - your Captain sequences it into the overall project timeline." },
    ],
  },
  ceiling: {
    intro: [
      "The ceiling is where lighting, HVAC diffusers, sprinklers, and cabling all have to meet without looking like it - which is why it's usually one of the last trades finished and one of the first things clients notice if it's done badly. PickTheBrick supplies and installs suspended grid ceilings, gypsum board ceilings, and specialty acoustic and feature ceiling systems, priced per square metre with fitting included.",
      "Because the ceiling has to coordinate with electrical, HVAC, and CCTV trades all running above it, this is one of the categories where having a single Captain sequencing every supplier on the same project timeline matters most - it's the trade most likely to get delayed by someone else's work if nobody's tracking the whole floor plate at once.",
    ],
    benefits: [
      { title: "Suspended grid for fast, serviceable ceilings", body: "Standard suspended ceiling tile gives easy access to cabling and ductwork above for future maintenance, without a full gypsum rebuild." },
      { title: "Gypsum and feature ceilings for reception and boardrooms", body: "Bulkheads, coves, and feature drops are available where the ceiling itself needs to make a design statement, not just hide services." },
      { title: "Sequenced with everything running above it", body: "Ceiling installation is coordinated against electrical, HVAC, and lighting on the same project timeline, since all four trades share the same void." },
    ],
    faqs: [
      { q: "What's the difference between suspended grid and gypsum ceilings?", a: "Suspended grid tile drops into a metal frame and is easy to remove for maintenance; gypsum board is fixed and finished flush, giving a cleaner look at a higher labour cost - both are priced per sqm on this page." },
      { q: "Does ceiling work happen before or after electrical and HVAC?", a: "Ceiling installation is typically sequenced after first-fix electrical and ductwork are in place, then closed up once everything above it is confirmed working - your Captain manages this order across trades." },
      { q: "Can acoustic ceiling tiles help with noise in an open-plan office?", a: "Yes - specialty acoustic ceiling systems are specifically rated to cut down sound transfer in open-plan areas and can be specced alongside standard tile in the same quote." },
      { q: "Will the ceiling need to be repainted or patched after other trades finish?", a: "Any patching from cabling or duct penetrations is included as part of the ceiling scope, so the finished ceiling is handed over complete, not left for a separate touch-up." },
    ],
  },
  doors: {
    intro: [
      "Doors are a small line item that a client notices every single day - the swing, the hardware, the sound it makes closing. PickTheBrick supplies and installs interior doors, frames, and ironmongery, priced per door with fitting included, from standard flush doors through to glazed and fire-rated options for spaces that need them.",
      "Because door specs are one of the things Civil Defense checks during authority approvals - particularly fire rating on doors leading into stairwells or corridors - getting the right door on the right opening the first time avoids a rejected inspection and a second site visit later in the project.",
    ],
    benefits: [
      { title: "Fire-rated where the code requires it", body: "Doors on egress routes and stairwells can be specced to the correct fire rating from the outset, rather than caught and swapped out at inspection stage." },
      { title: "Ironmongery matched to the door, not an afterthought", body: "Handles, hinges, and closers are quoted with the door itself, so hardware quality matches the door instead of being value-engineered down separately." },
      { title: "Priced per door, easy to compare across a floor plate", body: "Every option is quoted per door including fitting, so specifying twelve doors across a floor is a simple multiplication, not twelve separate negotiations." },
    ],
    faqs: [
      { q: "Do you supply fire-rated doors for stairwells and corridors?", a: "Yes - fire-rated doors are available and are specced to meet UAE Civil Defense requirements wherever the code calls for them on your floor plate." },
      { q: "Can door hardware be upgraded separately from the door itself?", a: "Ironmongery is priced as part of the per-door rate, but higher-spec handles, closers, or access-control-ready hardware can be quoted as an upgrade on individual doors." },
      { q: "How long does door installation take per unit?", a: "A standard door and frame installation is typically half a day per opening, though glazed and fire-rated doors with more hardware can take longer." },
      { q: "Are glazed interior doors available for meeting rooms?", a: "Yes - glazed doors are available to match glass partition systems for meeting rooms and cabins where visual continuity with the surrounding glazing matters." },
    ],
  },
  electrical: {
    intro: [
      "Electrical is the trade every other category quietly depends on - lighting, HVAC, CCTV, and workstations all draw off the same distribution and cabling that goes in first. PickTheBrick supplies and installs wiring, outlets, and distribution boards for office fit-outs, priced per square metre and coordinated as the first trade sequenced into the ceiling void and walls.",
      "Because electrical work happens early and gets closed up behind ceilings and walls, it's the category where getting the layout right the first time matters most - your Captain works from your space and desk-count plan to size distribution correctly before anything is closed in, rather than discovering a shortfall after the ceiling's already up.",
    ],
    benefits: [
      { title: "Sized to your actual desk and equipment count", body: "Distribution and outlet layout is planned against your real headcount and equipment plan, not a generic per-sqm assumption that runs short on power points." },
      { title: "First trade in, so nothing gets closed up wrong", body: "Electrical is sequenced before ceiling and partition close-up, so cabling and outlet positions are locked in before they become invisible." },
      { title: "DEWA-compliant as standard", body: "All wiring and distribution work is specified to meet DEWA requirements, which your Captain documents as part of any authority approval your fit-out needs." },
    ],
    faqs: [
      { q: "How is electrical pricing calculated for an office?", a: "Electrical is priced per square metre of floor area, scaled to a standard commercial outlet and lighting circuit density - higher equipment loads like a server room can be scoped as an addition." },
      { q: "Does electrical work need a DEWA inspection?", a: "Yes, DEWA typically inspects new commercial electrical installations - your Captain includes this in the authority approvals process if your fit-out requires it." },
      { q: "Can we add extra power outlets after the initial quote?", a: "Outlet count can be adjusted before installation begins, but changes after cabling is closed up behind ceilings or walls are more disruptive - it's worth over-specifying slightly at quote stage." },
      { q: "Is electrical installation sequenced before or after partitions go up?", a: "First-fix electrical typically runs before ceiling and partition close-up so cabling routes are accessible, then final connections happen once other trades are in place." },
    ],
  },
  hvac: {
    intro: [
      "Air conditioning is not optional in a Dubai office, and getting it wrong shows up immediately as complaints about hot corners or a system that can't keep up once the floor fills with people. PickTheBrick supplies and installs air conditioning, ducting, and ventilation for commercial fit-outs, priced per square metre and sized against your actual floor plate and occupancy.",
      "HVAC has to be coordinated tightly with the ceiling trade, since ducting and diffusers run through the same void as electrical cabling and ceiling grid - your Captain sequences this so the mechanical layout is agreed before the ceiling closes it in, rather than forcing a rework later.",
    ],
    benefits: [
      { title: "Sized to your floor plate, not a generic estimate", body: "Cooling load is calculated against your actual square metreage and occupancy plan, so the system is sized to keep up once desks fill in - not undersized to hit a lower quote." },
      { title: "Coordinated with the ceiling trade above it", body: "Ducting and diffuser layout is agreed with the ceiling installer before either trade closes up the void, avoiding rework once tiles are in place." },
      { title: "Zoned for meeting rooms and cabins separately", body: "Enclosed rooms can be given their own zone and controls, so a full boardroom doesn't leave the rest of the floor uncomfortably cold." },
    ],
    faqs: [
      { q: "How is HVAC pricing worked out for an office fit-out?", a: "HVAC is priced per square metre, calculated against standard commercial occupancy and cooling load for Dubai's climate - unusually high-heat equipment areas can be scoped separately." },
      { q: "Can meeting rooms have separate temperature control?", a: "Yes - enclosed rooms and cabins can be zoned with independent controls as part of the ducting layout, rather than sharing one setting with the open floor." },
      { q: "Does HVAC installation require a Civil Defense inspection?", a: "Ventilation and fire-life-safety interfaces (like duct dampers) are typically covered under the authority approvals your Captain manages if your fit-out requires formal sign-off." },
      { q: "How long does HVAC installation take?", a: "Ducting and unit installation is usually sequenced alongside ceiling works over several days to a couple of weeks depending on floor area - your Captain gives an exact timeline once the layout is finalised." },
    ],
  },
  cctv: {
    intro: [
      "Security is often the last thing specced and the first thing a client asks about once the office is occupied. PickTheBrick supplies and installs CCTV cameras and surveillance systems for commercial spaces, priced per camera with fitting, cabling, and basic configuration included.",
      "Camera placement matters more than camera count - covering entry points, reception, and server or storage rooms properly with fewer, well-positioned units usually beats blanketing a floor with cameras that overlap coverage. Your Captain can advise on placement as part of scoping this category into your quote.",
    ],
    benefits: [
      { title: "Priced per camera, cabling included", body: "Each unit's price covers the camera, cable run back to a recorder, and basic setup - no separate cabling contractor to bring in." },
      { title: "Placement planned around entry points and blind spots", body: "Coverage is planned against your actual floor plan - entrances, reception, and storage areas - rather than an even grid that leaves real blind spots." },
      { title: "Integrates with your building's existing access systems", body: "Where a building already has access control or an existing recorder, new cameras can typically be integrated rather than requiring a standalone system." },
    ],
    faqs: [
      { q: "How many cameras does a typical office need?", a: "It depends on floor plan and entry points more than square footage - your Captain can recommend a placement plan covering reception, entrances, and sensitive areas like server rooms once your layout is set." },
      { q: "Is footage storage included in the price?", a: "Camera and cabling pricing covers the hardware and installation; recorder and storage capacity are scoped separately based on how much footage retention you need." },
      { q: "Can CCTV be added after the rest of the fit-out is complete?", a: "Yes, but it's more efficient to install cabling alongside electrical first-fix while walls and ceilings are still open, so it's worth flagging CCTV needs early even if final placement is confirmed later." },
      { q: "Do you handle remote viewing setup?", a: "Basic configuration for remote viewing is included with installation - more advanced integrations with existing building security systems can be scoped as part of your quote." },
    ],
  },
  approvals: {
    intro: [
      "Every commercial fit-out in Dubai eventually runs into the same three names: Municipality, Civil Defense, and DEWA - and getting their sign-off out of sequence is one of the most common reasons a project timeline slips. PickTheBrick handles authority approvals as a scoped, priced part of your quote, coordinating documentation and inspection scheduling for the trades that need it.",
      "This isn't a separate consultancy relationship bolted onto your project - your Captain manages approvals against the same timeline as every other trade, so an inspection is booked when the relevant work (fire-rated doors, electrical distribution, ventilation) is actually ready for it, not before and not too late.",
    ],
    benefits: [
      { title: "Scheduled against your actual construction timeline", body: "Inspections are booked once the relevant trade is genuinely ready, not on a generic assumption that leads to a failed first visit." },
      { title: "One Captain across every authority, not three separate contacts", body: "Municipality, Civil Defense, and DEWA approvals are tracked by the same person managing your whole project, not handed off to a disconnected specialist." },
      { title: "Documentation prepared alongside the trades it covers", body: "Fire ratings, electrical compliance, and ventilation specs are documented as those trades are installed, rather than reconstructed after the fact for an inspection." },
    ],
    faqs: [
      { q: "Which authorities does this cover?", a: "Dubai Municipality, Civil Defense, and DEWA are the three most common authorities for a commercial office fit-out - your Captain scopes exactly which apply to your specific project and building." },
      { q: "How long does authority approval typically take?", a: "It varies by authority and building, but scheduling inspections against a coordinated project timeline - rather than after the fact - is usually the biggest factor in avoiding delays." },
      { q: "What happens if an inspection fails?", a: "Your Captain coordinates the fix with the relevant trade contractor and rebooks the inspection - because approvals are tracked against the same project timeline as construction, this is managed as part of the existing plan, not a separate escalation." },
      { q: "Do I need authority approval for every fit-out, or just larger ones?", a: "Requirements depend on the scope of work and your specific building/landlord - flag your project details when building your quote and your Captain will confirm what applies." },
    ],
  },
  lighting: {
    intro: [
      "Lighting does more to shape how an office feels than almost any other trade, and it's easy to get technically correct but visually flat. PickTheBrick supplies and installs ceiling, task, and accent lighting for commercial fit-outs, priced per fixture with fitting included, from standard panel lighting through to feature and accent pieces for reception and breakout areas.",
      "Good office lighting layers general ceiling lighting with task lighting at desks and accent lighting in reception or breakout zones, rather than relying on one flat grid of panels across the whole floor - your Captain can advise on layering as part of scoping this category.",
    ],
    benefits: [
      { title: "Layered lighting, not one flat grid", body: "General ceiling lighting, task lighting at desks, and accent lighting in feature areas are specced together for a floor that doesn't feel uniformly flat." },
      { title: "Fixture pricing includes fitting and circuit connection", body: "Each fixture's rate covers installation and wiring back to the relevant electrical circuit, coordinated with the electrical trade already in your quote." },
      { title: "Feature lighting for reception and breakout areas", body: "Accent and decorative fixtures are available for the spaces where lighting is doing double duty as part of the interior design, not just illumination." },
    ],
    faqs: [
      { q: "Is lighting priced per fixture or per square metre?", a: "Lighting is priced per fixture, since the mix of general, task, and accent lighting varies a lot by room type rather than scaling evenly with floor area." },
      { q: "Can lighting be zoned or dimmed separately by area?", a: "Zoned circuits and dimming can be specced for meeting rooms and breakout areas as part of the electrical layout - flag this need when your quote is being scoped." },
      { q: "Does lighting installation happen before or after the ceiling is closed up?", a: "Fixture positions and circuits are agreed and first-fixed before the ceiling closes, with final fixtures fitted once the ceiling trade has finished." },
      { q: "Can I specify decorative or feature lighting for reception?", a: "Yes - accent and feature fixtures are available for reception, breakout, and boardroom areas alongside standard ceiling lighting in the same quote." },
    ],
  },
  furniture: {
    intro: [
      "Furniture is the trade that actually gets sat in, opened, and moved every day, which is why the difference between a desk that lasts three years and one that lasts ten usually isn't obvious in a photo. PickTheBrick supplies and installs desks, chairs, storage, and reception furniture for commercial fit-outs, priced per unit with delivery and assembly included.",
      "Because furniture is typically the last trade into a finished space, it's also the easiest to get wrong on lead time - ordering it too late after everything else is complete leaves a finished office standing empty. Your Captain sequences furniture ordering early enough in the project timeline that it arrives ready for handover, not weeks after.",
    ],
    benefits: [
      { title: "Delivery and assembly included in every price", body: "The rate per item covers getting it into the building and assembled on site - no separate delivery fee or installation crew to arrange." },
      { title: "Ordered early enough to arrive for handover", body: "Furniture lead times are factored into the overall project timeline from the start, so the office isn't sitting finished and empty while desks are still in transit." },
      { title: "Reception through to workstation, one supplier", body: "Ergonomic task chairs, desks, storage, and reception pieces are all quoted through the same catalog, so furnishing the whole office doesn't mean juggling separate vendors." },
    ],
    faqs: [
      { q: "How far in advance should furniture be ordered?", a: "Furniture typically has the longest lead time of any trade in a fit-out - your Captain factors this into the overall project timeline from the start so it arrives ready for handover, not after." },
      { q: "Is assembly included in the furniture price?", a: "Yes - delivery and on-site assembly are included in the per-unit rate, so furniture arrives ready to use rather than flat-packed." },
      { q: "Can furniture be customised in colour or finish?", a: "Many pieces have colour and finish options - check the product detail for each item, or flag a specific requirement to your Captain when building your quote." },
      { q: "Do you offer ergonomic seating options?", a: "Yes - ergonomic task chairs are available alongside standard seating, priced and specced the same way as the rest of the furniture range." },
    ],
  },
};

export function getLandingContent(categoryKey: string, label: string): LandingContent {
  return LANDING_CONTENT[categoryKey] ?? GENERIC(label);
}
