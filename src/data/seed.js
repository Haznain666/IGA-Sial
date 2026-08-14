// Seed / demo data for the IGA Sial Farm site. Everything here can be
// created, edited, and deleted from Super Admin; this is only the starting
// content so the site is populated on first load.
import { DEFAULT_FX } from '../lib/currency.js'

// Image record: { url, zoom, posX, posY } — displayed in a fixed portrait
// frame with per-image adjustment. posY nudged where a portrait crop of a
// (wide) cow photo frames the animal better.
const IMG = (id, adj = {}) => ({
  url: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&h=1250&q=80`,
  zoom: adj.zoom ?? 1,
  posX: adj.posX ?? 50,
  posY: adj.posY ?? 50,
})

export const ANIMAL_TYPES = ['Calf', 'Heifer', 'Cow', 'Bull']

export const seedProducts = [
  {
    id: 'cow_noor',
    name: 'Noor',
    images: [IMG('1502590464431-3b66d77494d7'), IMG('1570042225831-d98fa7577f1e'), IMG('1500595046743-cd271d694d30')],
    details:
      'A young calf full of energy, just beginning her life on the farm. Curious, playful, and already a favourite with the caretakers.',
    breed: 'Sahiwal',
    age: '8 months',
    weight: '180 kg',
    type: 'Calf',
    valuePKR: 120000,
    owner: { ownedByFarm: true, firstName: '', lastName: '', cnic: '', phone: '', email: '' },
    status: 'available',
    reservation: null,
    donation: null,
    createdAt: '2026-06-01T09:00:00.000Z',
  },
  {
    id: 'cow_champa',
    name: 'Champa',
    images: [IMG('1596733430284-f7437764b1a9'), IMG('1564085352725-08da0272627d'), IMG('1561043394-9f7d16d9ae37'), IMG('1580570598977-4b2412d01bbc')],
    details:
      'A gentle young heifer settling well into farm life under our team’s care. Calm around people and steadily growing stronger each week.',
    breed: 'Cholistani',
    age: '1.5 years',
    weight: '320 kg',
    type: 'Heifer',
    valuePKR: 180000,
    owner: {
      ownedByFarm: false,
      firstName: 'Rukhsana',
      lastName: 'Bibi',
      cnic: '35202-1234567-8',
      phone: '+92 300 1234567',
      email: '',
    },
    status: 'available',
    reservation: null,
    donation: null,
    createdAt: '2026-06-03T09:00:00.000Z',
  },
  {
    id: 'cow_sabz',
    name: 'Sabz',
    images: [IMG('1527153857715-3908f2bae5e8'), IMG('1595664652035-0956d50e0311'), IMG('1595365691689-6b7b4e1970cf')],
    details:
      'A calm, steady milking cow — one of the herd’s most reliable mothers. Her fresh milk helps sustain the families the farm supports.',
    breed: 'Sahiwal',
    age: '4 years',
    weight: '420 kg',
    type: 'Cow',
    valuePKR: 260000,
    owner: { ownedByFarm: true, firstName: '', lastName: '', cnic: '', phone: '', email: '' },
    status: 'available',
    reservation: null,
    donation: null,
    createdAt: '2026-06-05T09:00:00.000Z',
  },
  {
    id: 'cow_bijli',
    name: 'Bijli',
    images: [IMG('1618080206739-14e8ac105472'), IMG('1593768697824-f31b967e6c55'), IMG('1620811004671-40b81b6f6978'), IMG('1604860428762-f55cea62b7a0')],
    details:
      'A relaxed, well-fed cow who loves fresh fodder at the feed trough. Healthy, content, and thriving in the farm’s managed care.',
    breed: 'Red Sindhi',
    age: '5 years',
    weight: '450 kg',
    type: 'Cow',
    valuePKR: 240000,
    owner: { ownedByFarm: true, firstName: '', lastName: '', cnic: '', phone: '', email: '' },
    status: 'available',
    reservation: null,
    donation: null,
    createdAt: '2026-06-07T09:00:00.000Z',
  },
  {
    id: 'cow_sultan',
    name: 'Sultan',
    images: [IMG('1589248529232-69c286cf2cb4'), IMG('1545407263-7ff5aa2ad921'), IMG('1546445317-29f4545e9d53')],
    details:
      'A confident, strong bull — a steady presence and the pride of the herd. Well cared for and central to the farm’s growing legacy.',
    breed: 'Nili-Ravi cross',
    age: '3 years',
    weight: '520 kg',
    type: 'Bull',
    valuePKR: 300000,
    owner: {
      ownedByFarm: false,
      firstName: 'Ghulam',
      lastName: 'Akbar',
      cnic: '35202-7654321-1',
      phone: '+92 321 7654321',
      email: 'akbar@example.com',
    },
    status: 'available',
    reservation: null,
    donation: null,
    createdAt: '2026-06-09T09:00:00.000Z',
  },
]

export const seedBanks = [
  {
    id: 'bank_hbl',
    bankName: 'Habib Bank Limited (HBL)',
    accountTitle: 'IGA Sial Farm',
    accountNumber: '0001-79001234567',
    iban: 'PK36HABB0001790012345670',
    swift: 'HABBPKKA',
    branch: 'Waryam Wala, Punjab',
    currency: 'PKR',
  },
  {
    id: 'bank_meezan',
    bankName: 'Meezan Bank',
    accountTitle: 'IGA Sial Farm',
    accountNumber: '0102-0110123456',
    iban: 'PK24MEZN0102011012345600',
    swift: 'MEZNPKKA',
    branch: 'Lahore Main',
    currency: 'PKR',
  },
  {
    id: 'bank_wise',
    bankName: 'Wise (USD)',
    accountTitle: 'IGA Sial Farm',
    accountNumber: '8310 1234 5678',
    iban: '',
    swift: 'TRWIUS35XXX',
    branch: 'International wire (USD)',
    currency: 'USD',
  },
]

export const defaultTerms = `By proceeding with a donation to IGA Sial Farm, you acknowledge and agree to the following:

1. Your donation supports the Donate-a-Cow program and the wider work of IGA Sial Farm, a not-for-profit, community-first initiative in Punjab, Pakistan.

2. Donations are voluntary contributions. Once an animal is donated on your behalf to a needy family, the donation is final and non-refundable.

3. The donation value shown for each animal is indicative. Foreign-currency amounts (USD, AUD, SAR) are converted from PKR at periodically updated exchange rates and may vary slightly at the time of transfer.

4. You will receive a personalised donation certificate and periodic welfare updates for the animal you support, subject to availability.

5. IGA Sial Farm reinvests 100% of program profits into education, jobs, animal care, and community development.

6. The details you provide (name, email, phone) are used solely to process your donation, issue your certificate, and keep you updated. They are never sold or shared for marketing.

7. Please transfer your donation to one of the bank accounts listed below and retain your transfer receipt. Our team will confirm receipt and complete the donation on your behalf.`

export const defaultSettings = {
  multiSelect: true,
  gatherRecipientInfo: true,
  collectOwnerInfo: true,
  reservationDays: 7, // auto-release a reserved animal after this many days (0 = never)
  terms: defaultTerms,
  banks: seedBanks,
  fxRates: { ...DEFAULT_FX },
}

export const initialState = {
  version: 2,
  products: seedProducts,
  settings: defaultSettings,
  cart: [],
  donations: [],
}
