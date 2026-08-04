export const PHONE_RE = /^(?:\+254|0)(7|1)\d{8}$/
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const KENYA_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
  'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
  'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu',
  'Machakos', 'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa',
  "Murang'a", 'Nairobi', 'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
  'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
  'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot',
]

// Icons not yet in the shared /components/icons.jsx set, reused across
// several signup screens. Paths mirror the matching entries in data/roles.jsx
// where one already exists (farm, truck, abattoir, cut, warehouse, storefront,
// search) so the badge on each signup screen matches its intro-page card.
export const buildingIcon = (
  <>
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M9 8h2M13 8h2M9 12h2M13 12h2M9 16h2M13 16h2" />
  </>
)
export const peopleIcon = (
  <>
    <path d="M18 8a3 3 0 10-3-3M6 8a3 3 0 103-3" />
    <path d="M2 21c0-3.3 2.7-6 6-6M22 21c0-3.3-2.7-6-6-6" />
    <path d="M9 21v-4a3 3 0 016 0v4" />
  </>
)
export const eyeIcon = (
  <>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </>
)
export const eyeOffIcon = (
  <>
    <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-7-11-7a18.53 18.53 0 015.06-5.94M9.9 4.24A10.4 10.4 0 0112 4c7 0 11 7 11 7a18.7 18.7 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
    <path d="M1 1l22 22" />
  </>
)
