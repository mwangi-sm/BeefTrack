//farmSeedData.jsx code
// Seed data for the Farmer's farms/animals. In a real app this all comes
// from the backend, keyed to the logged-in farmer — App.jsx just holds it
// in state and passes it down to whichever screen needs it.
//
// Kept deliberately minimal: one farm, one animal, one vet visit — just
// enough for every screen (My Farms, Farm Details, Animal Details, the
// Veterinary dashboard) to have something real to render, without the
// fabricated stats/activity feeds that used to live directly in the
// dashboards themselves.

export const SEED_FARMS = [
  {
    id: 'FM-1029',
    name: 'Kiambu Highlands Farm',
    county: 'Kiambu',
    subCounty: 'Ruiru',
    ward: 'Kahawa Wendani',
    village: 'Membley Estate',
    gps: '-1.1863, 36.9377',
    ownership: 'Owner',
    size: '25',
    waterSource: 'Borehole',
    feedSources: ['Pasture', 'Hay'],
    practice: 'Zero grazing',
    workers: '4',
    vetName: 'Dr. James Mwangi',
    vetNumber: '+254 722 456 789',
    photosCount: 6,
  },
]

export const SEED_ANIMALS = [
  {
    id: 'BT-000391',
    rfid: 'RFID-000391',
    altId: 'Ear tattoo KH-11',
    breed: 'Boran',
    gender: 'Female',
    dob: '2023-04-02',
    farmId: 'FM-1029',
    healthStatus: 'Healthy',
    weight: '320',
    vaccinations: ['FMD', 'Anthrax'],
    diseases: 'No known disease history',
    source: 'Born on farm',
    vetVisits: [
      { date: '2026-07-09', vetName: 'Dr. Achieng Otieno', notes: 'Routine checkup — no concerns.', healthStatus: 'Healthy' },
    ],
  },
]
