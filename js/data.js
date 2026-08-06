// All itinerary content, embedded directly (no external/live document links).
// Fields marked placeholder:true render as "details to follow" and must never
// be replaced with invented data.
//
// Data model: everything for one trip lives under TRIPS[<id>]. This app only
// ever shows CURRENT_TRIP_ID's trip - there is no trip switcher - but keeping
// the content nested like this (rather than as flat globals) means adding a
// second trip later is just adding another entry here, not restructuring the
// rendering code in js/app.js, which reads through the compatibility consts
// at the bottom of this file (TRIP, LEGS, PACKING_LIST, etc.).
//
// Storage keys in js/app.js (STORAGE_KEYS) are intentionally left as their
// original literal strings rather than derived from the trip id, so nothing
// already saved in a returning visitor's browser gets orphaned.

const APP_VERSION = "1.1";

const FOOTER_TEXT = `Made with love from Mum 🫶🏻 | Version ${APP_VERSION} • USA Adventure 2026`;

const CURRENT_TRIP_ID = "usa-2026";

const TRIPS = {
  "usa-2026": {
    meta: {
      id: "usa-2026",
      name: "Taylor's USA Adventure 2026",
      start: "2026-08-06",
      end: "2026-08-24",
      base: "Miami",
      homeTimeZone: { zone: "Pacific/Auckland", label: "New Zealand" },
    },

    // Real-world facts about each place this trip visits, keyed by the same
    // string each leg uses as `location` - used for the live time zone and
    // weather widgets without duplicating this data onto every leg.
    cities: {
      "Miami, Florida": {
        label: "Miami",
        zone: "America/New_York",
        lat: 25.7617,
        lon: -80.1918,
        salesTaxPct: 7,
        fallbackWeather: "Hot, humid, tropical",
      },
      "Austin, Texas": {
        label: "Austin",
        zone: "America/Chicago",
        lat: 30.2672,
        lon: -97.7431,
        salesTaxPct: 8.25,
        fallbackWeather: "Hot, dry to humid",
      },
      "Houston, Texas": {
        label: "Houston",
        zone: "America/Chicago",
        lat: 29.7604,
        lon: -95.3698,
        salesTaxPct: 8.25,
        fallbackWeather: "Hot, humid",
      },
    },

    legs: [
      {
        id: "leg-miami1",
        order: 1,
        short: "Miami",
        title: "Miami Stay",
        location: "Miami, Florida",
        start: "2026-08-06",
        end: "2026-08-17",
        dateLabel: "6 – 17 August 2026",
        property: {
          name: "Miami Shores Villa (Airbnb)",
          checkIn: "After 4:00 PM",
          checkOut: "Before 11:00 AM",
          confirmation: null, // placeholder
          address: { area: "Miami Shores", exact: null }, // exact placeholder
        },
        about:
          "Waterfront villa in Miami, minutes from the Design District, Wynwood and Miami Beach. Private sparkling pool, full movie theatre, pool table, outdoor bar and BBQ. 6 bedrooms, 4 bathrooms, 9 beds, sleeps up to 18.",
        amenities: [
          "Private swimming pool",
          "Full movie theatre",
          "Pool table",
          "Outdoor lounge with BBQ and dining area",
          "Bright living room with Smart TV",
          "Indoor and outdoor dining for up to 8 guests each",
          "Fully equipped kitchen",
        ],
        placeGroups: [
          {
            heading: "Nearby attractions",
            places: [
              { name: "Design District", time: "8 min" },
              { name: "Wynwood Walls", time: "10 min" },
              { name: "Bayside Marketplace", time: "12 min" },
              { name: "FTX Arena", time: "12 min" },
              { name: "South Beach", time: "20 min" },
              { name: "Brickell", time: "20 min" },
              { name: "Miami Beach Boardwalk", time: "15 min" },
              { name: "Little Havana", time: "15 min" },
              { name: "Miami International Airport", time: "15 min" },
              { name: "Everglades (alligator farms, boat tours)", time: "35 min" },
            ],
          },
          {
            heading: "Local dining favourites",
            places: [
              { name: "Blue Collar", time: "8 min" },
              { name: "Mandolin Aegean Bistro", time: "10 min" },
              { name: "Michael's Genuine Food & Drink", time: "10 min" },
              { name: "Amara at Paraiso", time: "12 min" },
              { name: "Kiki on the River", time: "15 min" },
              { name: "Komodo", time: "15 min" },
              { name: "Swan", time: "15 min" },
              { name: "Papi Steak", time: "15 min" },
              { name: "Nusr-Et Steakhouse (Salt Bae)", time: "15 min" },
            ],
          },
          {
            heading: "Shopping & entertainment",
            places: [
              { name: "Upper Buena Vista", time: "10 min" },
              { name: "Aventura Mall", time: "15 min" },
              { name: "Hurricane Cove Marina & Boatyard", time: "15 min" },
              { name: "Jet ski rental Miami", time: "15 min" },
              { name: "Ultimate Fishing Charters Miami", time: "15 min" },
              { name: "Lincoln Road Mall", time: "20 min" },
              { name: "Miami Beach Convention Center", time: "20 min" },
              { name: "Dolphin Mall", time: "30 min" },
            ],
          },
        ],
        houseRules: [
          "Pet-friendly, but pets must be added to reservation and pet fee applies",
          "No parties, events or unauthorised gatherings",
          "Starter toiletries only provided — plan to buy extra",
          "Subtropical climate means occasional bugs/critters — keep windows and doors closed, store food properly",
          "Pool and landscaping maintained 2–3 times weekly — minor debris may appear between cleans",
        ],
        dailySchedule: {
          confirmed: [
            { date: "2026-08-07", label: "Commitment" },
            { date: "2026-08-08", label: "Commitment" },
            { date: "2026-08-09", label: "Commitment" },
          ],
          structure: ["One day off", "Three further commitments", "Two more days off", "Holiday begins after the final commitment"],
          note:
            "Precise dates beyond 7–9 August are still to be confirmed. Structure shown above; update once confirmed.",
        },
      },
      {
        id: "leg-austin",
        order: 2,
        short: "Austin",
        title: "Austin, Texas",
        location: "Austin, Texas",
        start: "2026-08-19",
        end: "2026-08-22",
        dateLabel: "19 – 22 August 2026",
        property: {
          name: "Kasa Downtown Austin",
          address: {
            exact: "201 Lavaca St., Austin, TX, 78701, United States",
          },
          checkIn: "4:00 PM, Wednesday 19 August",
          checkOut: "11:00 AM, Saturday 22 August",
          minAge: 21,
          room: "Deluxe Apartment, 1 bedroom, balcony, non-smoking, private entrance",
          checkInMethod:
            "No front desk. Online registration + photo ID required in advance. Access code sent by email within 24 hours of arrival.",
          checkInFlag:
            "Action needed before arrival — complete the online registration and have photo ID ready.",
          cost: "NZD 711.58 total",
          cancellation: "Non-refundable",
          confirmation: null,
          confirmationPdf: "docs/austin-booking.pdf",
        },
        eventFlag: {
          name: "PBR Gambler Days, Moody Center",
          dates: "Fri 21, Sat 22, Sun 23 August",
          isoDates: ["2026-08-21", "2026-08-22", "2026-08-23"],
          venue: "Moody Center",
        },
        localContact: {
          name: "Deleigh Hermes",
          nickname: "Di-lee",
          whatsapp: "+1 (713) 410-2365",
          instagram: "instagram.com/deleigh.hermes.austintx",
          context: "Lifelong friend of Jeff, offered as a local touchpoint",
        },
      },
      {
        id: "leg-houston",
        order: 3,
        short: "Houston",
        title: "Houston, Texas",
        location: "Houston, Texas",
        start: "2026-08-22",
        end: "2026-08-23",
        dateLabel: "22 – 23 August 2026",
        property: {
          name: "Club Quarters Hotel Downtown, Houston",
          address: { exact: "1085 Rusk Street, Houston, TX, 77002, United States" },
          checkIn: "3:00 PM, Saturday 22 August (ends midnight — contact property if arriving after midnight)",
          checkOut: "12:00 PM, Sunday 23 August",
          minAge: 21,
          room: "Club Room, 1 Queen Bed, non-smoking",
          cost: "USD 111.26 total — payable at property",
          cancellation: "Free until 21 August 6:00 PM property time; 100% fee after",
          confirmation: null,
          confirmationNote:
            "Masked in source data. Taylor should carry the full confirmation number separately (Expedia app/email).",
          confirmationPdf: "docs/houston-booking.pdf",
        },
        eventFlag: {
          name: "Athletics @ Astros",
          dates: "Saturday 22 August, 6:10 PM CT",
          isoDates: ["2026-08-22"],
          venue: "Daikin Park",
        },
      },
      {
        id: "leg-miami2",
        order: 4,
        short: "Miami — Return",
        title: "Miami (Return, Pre-Flight)",
        location: "Miami, Florida",
        start: "2026-08-23",
        end: "2026-08-24",
        dateLabel: "23 – 24 August 2026",
        property: {
          name: "Hampton Inn & Suites Miami-Airport South-Blue Lagoon",
          address: { exact: "777 NW 57th Ave, Miami, FL, 33126, United States" },
          checkIn: "3:00 PM, 23 August",
          checkOut: "12:00 PM, 24 August",
          minAge: 21,
          room: "1 King Bed, non-smoking",
          cost: "USD 103.96 total — payable at property",
          cancellation: "Free until 11:59 PM 18 August property time; 100% fee after",
          transfers: "Airport transfers available — contact property with arrival details prior to travel.",
          confirmation: null,
          confirmationNote:
            "Masked in source data. Taylor should carry the full confirmation number separately.",
          confirmationPdf: "docs/miami-return-booking.pdf",
        },
      },
    ],

    packingList: [
      {
        category: "Travel Essentials",
        items: [
          "Passport",
          "Wallet",
          "Credit/Debit Cards",
          "Driver Licence",
          "Phone",
          "Phone Charger",
          "Power Bank",
          "AirPods / Headphones",
          "Travel Adapter (US Type A/B)",
          "Sunglasses",
          "Watch",
        ],
      },
      {
        category: "Clothing",
        items: [
          "Casual clothes",
          "Smart casual outfit",
          "Workout gear",
          "Swimwear",
          "Underwear & socks",
          "Sleepwear",
          "Light jacket",
          "Hat",
        ],
      },
      {
        category: "Health",
        items: ["Inhaler", "Prescription medications", "Toiletries"],
      },
      {
        category: "Bags",
        items: ["Suitcase", "Duffel Bag", "Backpack", "Tote Bag (for flights/day trips)"],
      },
      {
        category: "Shopping",
        note: "Leave room in suitcase for boots and purchases",
      },
    ],

    usefulInfo: [
      { heading: "Emergency", items: [{ text: "Emergency Number: 911", url: "tel:911" }] },
      { heading: "Currency", items: ["United States Dollar (USD)"] },
      {
        heading: "Time Zones",
        items: ["Miami (Florida): Eastern Time (ET)", "Austin & Houston (Texas): Central Time (CT)"],
      },
      {
        heading: "Power",
        items: ["Type A & Type B plugs", "110V / 60Hz", "Travel adapter required from New Zealand"],
      },
      {
        heading: "Transport",
        items: [
          { text: "Uber recommended", url: "https://m.uber.com/" },
          { text: "Google Maps", url: "https://maps.google.com/" },
          { text: "Apple Maps", url: "https://maps.apple.com/" },
        ],
      },
      {
        heading: "Weather",
        items: ["Miami: Hot, humid, tropical", "Austin/Houston: Hot, dry to humid depending on weather"],
      },
      {
        heading: "Tipping",
        items: [
          "Restaurants: 18–20%",
          "Bars: USD $1–2 per drink",
          "Hotel Housekeeping: USD $2–5 per day",
          "Uber: Optional but common",
        ],
      },
      {
        heading: "Useful Apps",
        items: [
          { text: "Uber", url: "https://m.uber.com/" },
          { text: "Google Maps", url: "https://maps.google.com/" },
          { text: "Airbnb", url: "https://www.airbnb.com/" },
          { text: "Expedia", url: "https://www.expedia.com/" },
          { text: "Airline App" },
          { text: "Weather App", url: "https://weather.com/" },
        ],
      },
    ],

    // Grouped by location so Taylor can add his own items under whichever leg
    // they belong to. Austin's list is the original confirmed content; Houston
    // and Key West start empty (or with only confirmed items) rather than
    // inventing things to do there.
    bucketList: [
      {
        location: "Austin",
        items: [
          { text: "Attend PBR Teams: Gambler Days" },
          { text: "Watch the Austin Gamblers compete" },
          { text: "Visit Boot Barn", map: "Boot Barn, Austin, TX" },
          { text: "Visit Sheplers", map: "Sheplers, Austin, TX" },
          { text: "Buy a quality pair of cowboy boots" },
          { text: "Eat authentic Texas BBQ" },
          { text: "Explore Downtown Austin", map: "Downtown Austin, TX" },
          { text: "Walk along South Congress", map: "South Congress Avenue, Austin, TX" },
          { text: "Visit the Texas State Capitol (if time permits)", map: "Texas State Capitol, Austin, TX" },
          { text: "Listen to live music" },
          { text: "Take photos at the Moody Center", map: "Moody Center, Austin, TX" },
          { text: "Buy one souvenir that reminds you of Texas" },
        ],
      },
      {
        location: "Houston",
        items: [{ text: "Watch Athletics @ Astros at Daikin Park", map: "Daikin Park, Houston, TX" }],
      },
      {
        location: "Key West",
        items: [],
      },
    ],

    // Confirmed values go here directly (never invented). Anything still null
    // renders as a placeholder with its own editable note in the UI so Taylor
    // can fill it in himself as details come through.
    flights: {
      airline: "United",
      flightNumbers: null,
      departureAirport: null,
      arrivalAirport: null,
      departureTimes: null,
      arrivalTimes: null,
      bookingReference: "LDY8D7",
      boardingPasses: null,
      seatNumbers: null,
    },

    flightFieldDefs: [
      { key: "airline", label: "Airline" },
      { key: "flightNumbers", label: "Flight Numbers" },
      { key: "departureAirport", label: "Departure Airport" },
      { key: "arrivalAirport", label: "Arrival Airport" },
      { key: "departureTimes", label: "Departure Times" },
      { key: "arrivalTimes", label: "Arrival Times" },
      { key: "bookingReference", label: "Booking Reference" },
      { key: "boardingPasses", label: "Boarding Passes" },
      { key: "seatNumbers", label: "Seat Numbers (if available)" },
    ],

    budgetCategories: ["Accommodation", "Food & Drinks", "Activities", "Shopping", "Transport", "Other"],
  },
};

// ---------- Compatibility layer ----------
// js/app.js reads these names. They're just the active trip's data, unpacked
// so the rendering code doesn't need to know about the TRIPS wrapper.
const ACTIVE_TRIP = TRIPS[CURRENT_TRIP_ID];
const TRIP = ACTIVE_TRIP.meta;
const CITIES = ACTIVE_TRIP.cities;
const LEGS = ACTIVE_TRIP.legs;
const PACKING_LIST = ACTIVE_TRIP.packingList;
const USEFUL_INFO = ACTIVE_TRIP.usefulInfo;
const BUCKET_LIST = ACTIVE_TRIP.bucketList;
const FLIGHTS = ACTIVE_TRIP.flights;
const FLIGHT_FIELD_DEFS = ACTIVE_TRIP.flightFieldDefs;
const BUDGET_CATEGORIES = ACTIVE_TRIP.budgetCategories;
