import type {
  BodyType,
  Fuel,
  Language,
  LeadSource,
  LeadStatus,
  Transmission,
  UsedCarStatus,
} from "../generated/prisma/enums";

// A1
export const CITIES = ["Lucknow", "Kanpur", "Barabanki"] as const;
export type CityName = (typeof CITIES)[number];

// A2
export const SHOWROOMS = [
  { name: "Gomti Nagar", address: "Plot 12, Vibhuti Khand, Gomti Nagar, Lucknow 226010" },
  { name: "Alambagh", address: "45 Kanpur Road, Alambagh, Lucknow 226005" },
  { name: "Hazratganj", address: "8 Mahatma Gandhi Marg, Hazratganj, Lucknow 226001" },
] as const;
export type ShowroomName = (typeof SHOWROOMS)[number]["name"];

type VariantSeed = {
  code: string;
  name: string;
  fuel: Fuel;
  transmission: Transmission;
  exShowroomRupees: number;
  lucknowInsuranceRupees: number;
  specs: Record<string, number | string>;
};

type ModelSeed = {
  slug: string;
  name: string;
  bodyType: BodyType;
  description: string;
  featured: boolean;
  colours: { name: string; hex: string; photo: string }[];
  accessories: { name: string; rupees: number; items: string[] };
  variants: VariantSeed[];
};

// A3 and A11: fictional Brand X line-up with sample prices. NEW-H-02 is the brief's row.
// A12: each colour has its own free-licence photo; credits are in the README.
export const MODELS: ModelSeed[] = [
  {
    slug: "model-h",
    featured: true,
    name: "Model H",
    bodyType: "SUV",
    description: "A mid-size SUV with a quiet cabin, high seating and room for five.",
    colours: [
      { name: "Oxford White", hex: "#F2F1EC", photo: "/cars/model-h-1.webp" },
      { name: "Midnight Black", hex: "#1B1C1E", photo: "/cars/model-h-black.webp" },
    ],
    accessories: {
      name: "Urban pack",
      rupees: 18_000,
      items: ["Floor mats", "Mud flaps", "Body side moulding", "Dash camera"],
    },
    variants: [
      {
        code: "NEW-H-01",
        name: "VX",
        fuel: "PETROL",
        transmission: "MANUAL",
        exShowroomRupees: 10_95_000,
        lucknowInsuranceRupees: 46_000,
        specs: { engine: "1.5 L petrol", powerBhp: 119, mileageKmpl: 17.2, seats: 5, bootLitres: 458 },
      },
      {
        code: "NEW-H-02",
        name: "ZX",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 12_45_000,
        lucknowInsuranceRupees: 52_000,
        specs: { engine: "1.5 L petrol", powerBhp: 119, mileageKmpl: 16.1, seats: 5, bootLitres: 458 },
      },
      {
        code: "NEW-H-03",
        name: "ZX",
        fuel: "DIESEL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 13_80_000,
        lucknowInsuranceRupees: 57_500,
        specs: { engine: "1.5 L diesel", powerBhp: 114, mileageKmpl: 19.4, seats: 5, bootLitres: 458 },
      },
    ],
  },
  {
    slug: "model-c",
    featured: true,
    name: "Model C",
    bodyType: "SEDAN",
    description: "A long-wheelbase sedan built for highway comfort and a large boot.",
    colours: [
      { name: "Pearl White", hex: "#F2F1EC", photo: "/cars/model-c-1.webp" },
      { name: "Deep Teal", hex: "#1F3A3D", photo: "/cars/model-c-teal.webp" },
    ],
    accessories: {
      name: "Comfort pack",
      rupees: 15_000,
      items: ["Seat covers", "Floor mats", "Sunshades", "Boot organiser"],
    },
    variants: [
      {
        code: "NEW-C-01",
        name: "SX",
        fuel: "PETROL",
        transmission: "MANUAL",
        // Exactly on the ₹10 lakh slab boundary, so the higher road-tax slab applies (A4).
        exShowroomRupees: 10_00_000,
        lucknowInsuranceRupees: 43_000,
        specs: { engine: "1.5 L petrol", powerBhp: 119, mileageKmpl: 18.0, seats: 5, bootLitres: 506 },
      },
      {
        code: "NEW-C-02",
        name: "VX",
        fuel: "DIESEL",
        transmission: "MANUAL",
        exShowroomRupees: 11_30_000,
        lucknowInsuranceRupees: 48_000,
        specs: { engine: "1.5 L diesel", powerBhp: 99, mileageKmpl: 23.1, seats: 5, bootLitres: 506 },
      },
    ],
  },
  {
    slug: "model-s",
    featured: true,
    name: "Model S",
    bodyType: "HATCHBACK",
    description: "A compact hatchback that is easy to park and cheap to run in the city.",
    colours: [
      { name: "Pure White", hex: "#F2F2EF", photo: "/cars/model-s-1.webp" },
      { name: "Tornado Red", hex: "#C8102E", photo: "/cars/model-s-red.webp" },
    ],
    accessories: {
      name: "Essentials pack",
      rupees: 9_500,
      items: ["Floor mats", "Mud flaps", "Steering cover"],
    },
    variants: [
      {
        code: "NEW-S-01",
        name: "LX",
        fuel: "PETROL",
        transmission: "MANUAL",
        exShowroomRupees: 5_60_000,
        lucknowInsuranceRupees: 26_000,
        specs: { engine: "1.2 L petrol", powerBhp: 82, mileageKmpl: 20.9, seats: 5, bootLitres: 268 },
      },
      {
        code: "NEW-S-02",
        name: "LX",
        fuel: "CNG",
        transmission: "MANUAL",
        exShowroomRupees: 6_45_000,
        lucknowInsuranceRupees: 29_000,
        specs: { engine: "1.2 L petrol + CNG", powerBhp: 69, mileageKmpl: 27.5, seats: 5, bootLitres: 120 },
      },
      {
        code: "NEW-S-03",
        name: "ZX",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 7_25_000,
        lucknowInsuranceRupees: 32_000,
        specs: { engine: "1.2 L petrol", powerBhp: 82, mileageKmpl: 19.6, seats: 5, bootLitres: 268 },
      },
    ],
  },
  {
    slug: "model-v",
    featured: true,
    name: "Model V",
    bodyType: "MPV",
    description: "A seven-seat MPV with three usable rows and sliding second-row seats.",
    colours: [
      { name: "Graphite Grey", hex: "#4A4D52", photo: "/cars/model-v-1.webp" },
      { name: "Pearl White", hex: "#F2F1EC", photo: "/cars/model-v-white.webp" },
    ],
    accessories: {
      name: "Family pack",
      rupees: 14_000,
      items: ["Seat covers", "Floor mats", "Roof rails", "Rear sunshades"],
    },
    variants: [
      {
        code: "NEW-V-01",
        name: "GX",
        fuel: "PETROL",
        transmission: "MANUAL",
        exShowroomRupees: 9_80_000,
        lucknowInsuranceRupees: 41_000,
        specs: { engine: "1.5 L petrol", powerBhp: 103, mileageKmpl: 17.0, seats: 7, bootLitres: 209 },
      },
      {
        code: "NEW-V-02",
        name: "GX",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 11_40_000,
        lucknowInsuranceRupees: 47_000,
        specs: { engine: "1.5 L petrol", powerBhp: 103, mileageKmpl: 16.2, seats: 7, bootLitres: 209 },
      },
    ],
  },
  {
    slug: "model-t",
    name: "Model T",
    bodyType: "SUV",
    description: "A full-size off-road SUV with a ladder-tough body and room for seven.",
    featured: false,
    colours: [
      { name: "Gondwana Stone", hex: "#8A7D6B", photo: "/cars/model-t-1.webp" },
      { name: "Slate Blue", hex: "#4F6475", photo: "/cars/model-t-blue.webp" },
    ],
    accessories: {
      name: "Expedition pack",
      rupees: 32_000,
      items: ["Roof rack", "All-weather mats", "Underbody protection", "Rear ladder"],
    },
    variants: [
      {
        code: "NEW-T-01",
        name: "SE",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 17_20_000,
        lucknowInsuranceRupees: 71_000,
        specs: { engine: "2.0 L turbo petrol", powerBhp: 197, mileageKmpl: 11.8, seats: 7, bootLitres: 297 },
      },
      {
        code: "NEW-T-02",
        name: "HSE",
        fuel: "DIESEL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 18_50_000,
        lucknowInsuranceRupees: 76_000,
        specs: { engine: "2.2 L diesel", powerBhp: 197, mileageKmpl: 14.1, seats: 7, bootLitres: 297 },
      },
    ],
  },
  {
    slug: "model-g",
    name: "Model G",
    bodyType: "COUPE",
    description: "A two-door grand tourer with a long bonnet and a cabin built for the open road.",
    featured: false,
    colours: [
      { name: "Mineral Grey", hex: "#6E7377", photo: "/cars/model-g-1.webp" },
      { name: "Marina Blue", hex: "#1F3FA0", photo: "/cars/model-g-blue.webp" },
    ],
    accessories: {
      name: "Grand touring pack",
      rupees: 26_000,
      items: ["Carbon mirror caps", "Floor mats", "Boot liner"],
    },
    variants: [
      {
        code: "NEW-G-01",
        name: "GT",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 22_40_000,
        lucknowInsuranceRupees: 92_000,
        specs: { engine: "2.0 L turbo petrol", powerBhp: 255, mileageKmpl: 13.4, seats: 4, bootLitres: 440 },
      },
      {
        code: "NEW-G-02",
        name: "GT Sport",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 26_80_000,
        lucknowInsuranceRupees: 1_08_000,
        specs: { engine: "3.0 L turbo petrol", powerBhp: 382, mileageKmpl: 10.6, seats: 4, bootLitres: 440 },
      },
    ],
  },
  {
    slug: "model-m",
    name: "Model M",
    bodyType: "MPV",
    description: "A boxy, practical people-carrier with sliding rear doors and a tall cabin.",
    featured: false,
    colours: [
      { name: "Pearl White", hex: "#F2F1EC", photo: "/cars/model-m-1.webp" },
      { name: "Onyx Black", hex: "#16171A", photo: "/cars/model-m-black.webp" },
    ],
    accessories: {
      name: "Weekender pack",
      rupees: 12_000,
      items: ["Roof bars", "Seat covers", "Floor mats"],
    },
    variants: [
      {
        code: "NEW-M-01",
        name: "LX",
        fuel: "PETROL",
        transmission: "MANUAL",
        exShowroomRupees: 8_90_000,
        lucknowInsuranceRupees: 37_000,
        specs: { engine: "1.5 L petrol", powerBhp: 103, mileageKmpl: 17.8, seats: 7, bootLitres: 250 },
      },
      {
        code: "NEW-M-02",
        name: "VX",
        fuel: "DIESEL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 11_60_000,
        lucknowInsuranceRupees: 48_500,
        specs: { engine: "1.5 L diesel", powerBhp: 114, mileageKmpl: 20.2, seats: 7, bootLitres: 250 },
      },
    ],
  },
  {
    slug: "model-r",
    name: "Model R",
    bodyType: "HATCHBACK",
    description: "A performance hatchback with all-wheel drive and a quick-shifting gearbox.",
    featured: false,
    colours: [
      { name: "Oryx White", hex: "#EEEDEA", photo: "/cars/model-r-1.webp" },
      { name: "Indium Grey", hex: "#4B5563", photo: "/cars/model-r-grey.webp" },
    ],
    accessories: {
      name: "Track pack",
      rupees: 21_000,
      items: ["Sports floor mats", "Gear knob", "Boot organiser"],
    },
    variants: [
      {
        code: "NEW-R-01",
        name: "R",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 14_90_000,
        lucknowInsuranceRupees: 62_000,
        specs: { engine: "2.0 L turbo petrol", powerBhp: 241, mileageKmpl: 13.9, seats: 5, bootLitres: 343 },
      },
      {
        code: "NEW-R-02",
        name: "R Performance",
        fuel: "PETROL",
        transmission: "AUTOMATIC",
        exShowroomRupees: 16_40_000,
        lucknowInsuranceRupees: 68_000,
        specs: { engine: "2.0 L turbo petrol", powerBhp: 296, mileageKmpl: 12.7, seats: 5, bootLitres: 343 },
      },
    ],
  },
];

// A3 and A4: sample slab rates in basis points, the same in every city (one state).
const TEN_LAKH_RUPEES = 10_00_000;
export const ROAD_TAX_SLABS: { fuel: Fuel; minRupees: number; maxRupees: number | null; basisPoints: number }[] = [
  { fuel: "PETROL", minRupees: 0, maxRupees: TEN_LAKH_RUPEES, basisPoints: 800 },
  { fuel: "PETROL", minRupees: TEN_LAKH_RUPEES, maxRupees: null, basisPoints: 1000 },
  { fuel: "DIESEL", minRupees: 0, maxRupees: TEN_LAKH_RUPEES, basisPoints: 1000 },
  { fuel: "DIESEL", minRupees: TEN_LAKH_RUPEES, maxRupees: null, basisPoints: 1200 },
  { fuel: "CNG", minRupees: 0, maxRupees: TEN_LAKH_RUPEES, basisPoints: 700 },
  { fuel: "CNG", minRupees: TEN_LAKH_RUPEES, maxRupees: null, basisPoints: 900 },
];

// A5: premiums differ by city. Barabanki has no Model V rates on purpose, so the
// "on-road price not available for this city yet" state is visible in the demo.
export const INSURANCE_OFFSET_FROM_LUCKNOW_RUPEES: Record<CityName, number> = {
  Lucknow: 0,
  Kanpur: -1_000,
  Barabanki: -2_000,
};
export const INSURANCE_GAPS: { city: CityName; modelSlug: string }[] = [
  { city: "Barabanki", modelSlug: "model-v" },
];

export const DEMO_PASSWORD = "BrandX-demo-2026";

export const ADMIN = { name: "Meera Joshi", email: "admin@brandx.example" };
export const DEMO_BUYER = { name: "Riya Sharma", email: "buyer@brandx.example", phone: "+919000000109" };

// Two per showroom with different models. Nobody at Hazratganj handles Model V, and nobody
// at Gomti Nagar handles Model G or R, so those leads land in the lead desk queue.
export const CONSULTANTS: { name: string; email: string; showroom: ShowroomName; modelSlugs: string[] }[] = [
  { name: "Rohan Verma", email: "rohan@brandx.example", showroom: "Gomti Nagar", modelSlugs: ["model-h", "model-c", "model-t"] },
  { name: "Priya Tiwari", email: "priya@brandx.example", showroom: "Gomti Nagar", modelSlugs: ["model-s", "model-v", "model-m"] },
  { name: "Kabir Saxena", email: "kabir@brandx.example", showroom: "Alambagh", modelSlugs: ["model-h", "model-s", "model-r"] },
  { name: "Ananya Mishra", email: "ananya@brandx.example", showroom: "Alambagh", modelSlugs: ["model-c", "model-v", "model-g"] },
  { name: "Vikram Singh", email: "vikram@brandx.example", showroom: "Hazratganj", modelSlugs: ["model-h", "model-c", "model-t", "model-g"] },
  { name: "Ishita Kapoor", email: "ishita@brandx.example", showroom: "Hazratganj", modelSlugs: ["model-h", "model-s", "model-r", "model-m"] },
];

// The Hazratganj Model H demo car is in service, so it offers no slots.
export const DEMO_CARS: { showroom: ShowroomName; variantCode: string; available: boolean }[] = [
  { showroom: "Gomti Nagar", variantCode: "NEW-H-02", available: true },
  { showroom: "Gomti Nagar", variantCode: "NEW-S-01", available: true },
  { showroom: "Alambagh", variantCode: "NEW-C-02", available: true },
  { showroom: "Alambagh", variantCode: "NEW-V-01", available: true },
  { showroom: "Hazratganj", variantCode: "NEW-H-01", available: false },
  { showroom: "Hazratganj", variantCode: "NEW-S-03", available: true },
  { showroom: "Gomti Nagar", variantCode: "NEW-M-01", available: true },
  { showroom: "Alambagh", variantCode: "NEW-G-01", available: true },
  { showroom: "Hazratganj", variantCode: "NEW-T-02", available: true },
  { showroom: "Hazratganj", variantCode: "NEW-R-01", available: true },
];

type UsedCarSeed = {
  stockId: string;
  modelSlug: string;
  showroom: ShowroomName;
  variantName: string;
  fuel: Fuel;
  transmission: Transmission;
  year: number;
  km: number;
  owners: number;
  regNumber: string;
  rupees: number;
  status: UsedCarStatus;
  inspectionScore: number;
  needsAttention: string[];
};

// UC-1182 and UC-1190 are the brief's rows. Registration numbers are fictional.
export const USED_CARS: UsedCarSeed[] = [
  { stockId: "UC-1182", modelSlug: "model-c", showroom: "Gomti Nagar", variantName: "VX", fuel: "DIESEL", transmission: "MANUAL", year: 2022, km: 41_200, owners: 1, regNumber: "UP32MN2741", rupees: 8_45_000, status: "AVAILABLE", inspectionScore: 92, needsAttention: [] },
  { stockId: "UC-1190", modelSlug: "model-s", showroom: "Alambagh", variantName: "LX", fuel: "PETROL", transmission: "MANUAL", year: 2021, km: 58_600, owners: 2, regNumber: "UP32KT9041", rupees: 5_12_000, status: "BOOKED", inspectionScore: 84, needsAttention: ["Tyres"] },
  { stockId: "UC-1201", modelSlug: "model-h", showroom: "Hazratganj", variantName: "VX", fuel: "PETROL", transmission: "MANUAL", year: 2023, km: 22_800, owners: 1, regNumber: "UP32PA1186", rupees: 9_75_000, status: "AVAILABLE", inspectionScore: 95, needsAttention: [] },
  { stockId: "UC-1205", modelSlug: "model-h", showroom: "Gomti Nagar", variantName: "ZX", fuel: "DIESEL", transmission: "AUTOMATIC", year: 2022, km: 47_500, owners: 1, regNumber: "UP78HJ5530", rupees: 12_10_000, status: "AVAILABLE", inspectionScore: 90, needsAttention: ["Body and paint"] },
  { stockId: "UC-1211", modelSlug: "model-s", showroom: "Alambagh", variantName: "ZX", fuel: "PETROL", transmission: "AUTOMATIC", year: 2023, km: 18_400, owners: 1, regNumber: "UP32RB6612", rupees: 6_35_000, status: "AVAILABLE", inspectionScore: 96, needsAttention: [] },
  { stockId: "UC-1214", modelSlug: "model-v", showroom: "Hazratganj", variantName: "GX", fuel: "PETROL", transmission: "MANUAL", year: 2021, km: 63_000, owners: 2, regNumber: "UP41AC3307", rupees: 7_40_000, status: "AVAILABLE", inspectionScore: 81, needsAttention: ["Suspension and brakes", "Interior"] },
  { stockId: "UC-1219", modelSlug: "model-c", showroom: "Gomti Nagar", variantName: "SX", fuel: "PETROL", transmission: "MANUAL", year: 2020, km: 71_300, owners: 2, regNumber: "UP32GZ8820", rupees: 6_20_000, status: "SOLD", inspectionScore: 79, needsAttention: ["Tyres", "Body and paint"] },
  { stockId: "UC-1223", modelSlug: "model-s", showroom: "Gomti Nagar", variantName: "LX", fuel: "CNG", transmission: "MANUAL", year: 2022, km: 39_900, owners: 1, regNumber: "UP32LD4458", rupees: 5_45_000, status: "AVAILABLE", inspectionScore: 88, needsAttention: [] },
  { stockId: "UC-1227", modelSlug: "model-v", showroom: "Alambagh", variantName: "GX", fuel: "PETROL", transmission: "AUTOMATIC", year: 2023, km: 26_700, owners: 1, regNumber: "UP78KF2093", rupees: 10_15_000, status: "BOOKED", inspectionScore: 94, needsAttention: [] },
  { stockId: "UC-1230", modelSlug: "model-h", showroom: "Hazratganj", variantName: "VX", fuel: "PETROL", transmission: "MANUAL", year: 2020, km: 82_100, owners: 3, regNumber: "UP32TS7715", rupees: 7_05_000, status: "SOLD", inspectionScore: 76, needsAttention: ["Engine and transmission", "Tyres"] },
];

export const INSPECTION_AREAS = [
  "Engine and transmission",
  "Suspension and brakes",
  "Body and paint",
  "Electricals",
  "Interior",
  "Tyres",
];

type LeadSeed = {
  buyerName: string;
  phone: string;
  language: Language;
  source: LeadSource;
  showroom: ShowroomName;
  city: CityName;
  car: { variantCode: string } | { stockId: string };
  consultantEmail: string | null;
  status: LeadStatus;
  minutesAgo: number;
  contactedAfterMinutes?: number;
  message?: string;
  lostReason?: string;
  booking?: { daysAhead: number; time: string; cancelled?: boolean };
  isDemoBuyer?: boolean;
};

// Spread across every status and source; the newest ones sit inside the 5-minute
// window right after seeding, others are overdue, so the timer colours show at once.
export const LEADS: LeadSeed[] = [
  { buyerName: "Aditya Rao", phone: "+919000000101", language: "EN", source: "ENQUIRY", showroom: "Gomti Nagar", city: "Lucknow", car: { variantCode: "NEW-H-02" }, consultantEmail: "rohan@brandx.example", status: "NEW", minutesAgo: 2, message: "What is the on-road price of the ZX automatic in Lucknow? Is it available in white?" },
  { buyerName: "Sunita Yadav", phone: "+919000000102", language: "HI", source: "ENQUIRY", showroom: "Alambagh", city: "Lucknow", car: { variantCode: "NEW-S-02" }, consultantEmail: "kabir@brandx.example", status: "NEW", minutesAgo: 4, message: "CNG वाले मॉडल की ऑन-रोड कीमत बताइए। EMI का विकल्प है क्या?" },
  { buyerName: "Farhan Qureshi", phone: "+919000000103", language: "EN", source: "TEST_DRIVE", showroom: "Hazratganj", city: "Lucknow", car: { variantCode: "NEW-S-03" }, consultantEmail: "ishita@brandx.example", status: "NEW", minutesAgo: 9, booking: { daysAhead: 1, time: "11:00" } },
  { buyerName: "Pooja Agarwal", phone: "+919000000104", language: "EN", source: "ENQUIRY", showroom: "Gomti Nagar", city: "Lucknow", car: { stockId: "UC-1182" }, consultantEmail: "rohan@brandx.example", status: "NEW", minutesAgo: 13, message: "Is UC-1182 still available? Can I see the full service history?" },
  { buyerName: "Manoj Pandey", phone: "+919000000105", language: "HI", source: "ENQUIRY", showroom: "Alambagh", city: "Kanpur", car: { variantCode: "NEW-V-02" }, consultantEmail: "ananya@brandx.example", status: "NEW", minutesAgo: 45, message: "7 सीटर ऑटोमैटिक चाहिए, कानपुर में डिलीवरी हो जाएगी?" },
  { buyerName: "Sneha Kulkarni", phone: "+919000000106", language: "EN", source: "ENQUIRY", showroom: "Hazratganj", city: "Lucknow", car: { variantCode: "NEW-V-01" }, consultantEmail: null, status: "NEW", minutesAgo: 180, message: "Looking for a 7-seater for my parents. Do you have one I can see?" },
  { buyerName: "Arjun Khanna", phone: "+919000000107", language: "EN", source: "ENQUIRY", showroom: "Gomti Nagar", city: "Lucknow", car: { variantCode: "NEW-C-01" }, consultantEmail: "rohan@brandx.example", status: "CONTACTED", minutesAgo: 60, contactedAfterMinutes: 3, message: "Comparing the SX with a rival sedan. What is the final price?" },
  { buyerName: "Kavita Dubey", phone: "+919000000108", language: "HI", source: "TEST_DRIVE", showroom: "Gomti Nagar", city: "Lucknow", car: { variantCode: "NEW-H-02" }, consultantEmail: "rohan@brandx.example", status: "TEST_DRIVE_BOOKED", minutesAgo: 300, contactedAfterMinutes: 4, booking: { daysAhead: 2, time: "10:30" } },
  { buyerName: DEMO_BUYER.name, phone: DEMO_BUYER.phone, language: "EN", source: "TEST_DRIVE", showroom: "Gomti Nagar", city: "Lucknow", car: { variantCode: "NEW-S-01" }, consultantEmail: "priya@brandx.example", status: "TEST_DRIVE_BOOKED", minutesAgo: 1_440, contactedAfterMinutes: 2, booking: { daysAhead: 3, time: "15:00" }, isDemoBuyer: true },
  { buyerName: "Imran Siddiqui", phone: "+919000000110", language: "EN", source: "ENQUIRY", showroom: "Alambagh", city: "Kanpur", car: { variantCode: "NEW-C-02" }, consultantEmail: "ananya@brandx.example", status: "NEGOTIATION", minutesAgo: 4_320, contactedAfterMinutes: 7, message: "Diesel sedan for highway use. I have an old car to exchange." },
  { buyerName: "Deepak Chauhan", phone: "+919000000111", language: "HI", source: "ENQUIRY", showroom: "Hazratganj", city: "Barabanki", car: { variantCode: "NEW-H-03" }, consultantEmail: "vikram@brandx.example", status: "NEGOTIATION", minutesAgo: 2_880, contactedAfterMinutes: 12, message: "डीज़ल ZX का बाराबंकी में ऑन-रोड प्राइस क्या है?" },
  { buyerName: "Nisha Bhatt", phone: "+919000000112", language: "EN", source: "TEST_DRIVE", showroom: "Alambagh", city: "Lucknow", car: { variantCode: "NEW-V-01" }, consultantEmail: "ananya@brandx.example", status: "WON", minutesAgo: 10_080, contactedAfterMinutes: 4, booking: { daysAhead: -5, time: "12:00" } },
  { buyerName: "Gaurav Tripathi", phone: "+919000000113", language: "EN", source: "ENQUIRY", showroom: "Gomti Nagar", city: "Lucknow", car: { stockId: "UC-1223" }, consultantEmail: "priya@brandx.example", status: "WON", minutesAgo: 7_200, contactedAfterMinutes: 3, message: "Is the CNG kit on UC-1223 company-fitted?" },
  { buyerName: "Alok Srivastava", phone: "+919000000114", language: "HI", source: "ENQUIRY", showroom: "Alambagh", city: "Lucknow", car: { stockId: "UC-1190" }, consultantEmail: "kabir@brandx.example", status: "LOST", minutesAgo: 5_760, contactedAfterMinutes: 22, message: "UC-1190 की कंडीशन कैसी है?", lostReason: "Another buyer booked the car first" },
  { buyerName: "Tanvi Arora", phone: "+919000000115", language: "EN", source: "TEST_DRIVE", showroom: "Hazratganj", city: "Lucknow", car: { variantCode: "NEW-S-03" }, consultantEmail: "ishita@brandx.example", status: "LOST", minutesAgo: 4_320, contactedAfterMinutes: 6, booking: { daysAhead: 1, time: "11:00", cancelled: true }, lostReason: "Cancelled the test drive; plans to buy next year" },
  { buyerName: "Rahul Bansal", phone: "+919000000116", language: "EN", source: "ENQUIRY", showroom: "Hazratganj", city: "Lucknow", car: { variantCode: "NEW-H-01" }, consultantEmail: "vikram@brandx.example", status: "CONTACTED", minutesAgo: 120, contactedAfterMinutes: 9, message: "Does the VX have a sunroof?" },
  { buyerName: "Shalini Gupta", phone: "+919000000117", language: "HI", source: "ENQUIRY", showroom: "Gomti Nagar", city: "Barabanki", car: { variantCode: "NEW-V-02" }, consultantEmail: "priya@brandx.example", status: "CONTACTED", minutesAgo: 240, contactedAfterMinutes: 17, message: "बाराबंकी के लिए ऑन-रोड कीमत बताइए।" },
  { buyerName: "Vivek Malhotra", phone: "+919000000118", language: "EN", source: "ENQUIRY", showroom: "Alambagh", city: "Lucknow", car: { stockId: "UC-1211" }, consultantEmail: "kabir@brandx.example", status: "NEW", minutesAgo: 25, message: "Interested in UC-1211. Is finance available?" },
  { buyerName: "Ayesha Khan", phone: "+919000000119", language: "EN", source: "TEST_DRIVE", showroom: "Alambagh", city: "Lucknow", car: { variantCode: "NEW-C-02" }, consultantEmail: "ananya@brandx.example", status: "TEST_DRIVE_BOOKED", minutesAgo: 90, contactedAfterMinutes: 4, booking: { daysAhead: 1, time: "16:30" } },
  { buyerName: "Harsh Vardhan", phone: "+919000000120", language: "HI", source: "ENQUIRY", showroom: "Hazratganj", city: "Lucknow", car: { stockId: "UC-1214" }, consultantEmail: null, status: "NEW", minutesAgo: 30, message: "UC-1214 की फ़ोटो WhatsApp पर भेज दीजिए।" },
];
