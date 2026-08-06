
export const roles = [
  {
    name: 'Farmer',
    desc: 'Register farms and animals, keep health,veterinary and breeding records, list stock for sale.',
    screen: 'farmer',
    icon: (
      <path d="M3 10l9-6 9 6v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z" />
    ),
  },
  {
    name: 'Vet',
    desc: 'Inspect and treat animals, record visits and vaccinations directly against a farmer\'s animal records.',
    screen: 'veterinary_officer',
    icon: (
      <>
        <path d="M12 21s-7-4.5-7-10a4.9 4.9 0 018.5-3.3A4.9 4.9 0 0119 8c0 5.5-7 13-7 13z" />
        <path d="M9 9h6M12 6v6" />
      </>
    ),
  },
  {
    name: 'Agent',
    desc: 'Buy from farmers, hold and dispatch stock, track ownership transfers.',
    screen: 'agent',
    icon: (
      <>
        <path d="M18 8a3 3 0 10-3-3M6 8a3 3 0 103-3" />
        <path d="M2 21c0-3.3 2.7-6 6-6M22 21c0-3.3-2.7-6-6-6" />
        <path d="M9 21v-4a3 3 0 016 0v4" />
      </>
    ),
  },
  {
    name: 'Transporter',
    desc: 'Move animals between actors, log routes, GPS trails and vehicle details.',
    screen: 'transporter',
    icon: (
      <>
        <rect x="1" y="8" width="14" height="8" rx="1" />
        <path d="M15 11h4l3 3v2h-7" />
        <circle cx="5.5" cy="18.5" r="1.5" />
        <circle cx="16.5" cy="18.5" r="1.5" />
      </>
    ),
  },
  {
    name: 'SlaughterHouse',
    desc: 'Record slaughter method and inspection, assign carcass ID, link back to the animal.',
    screen: 'slaughterhouse',
    icon: (
      <>
        <path d="M3 21h18M5 21V10a7 7 0 0114 0v11" />
        <path d="M9 21v-5h6v5" />
      </>
    ),
  },
  {
    name: 'Processor',
    desc: 'Cut, package and label product, create batches, generate QR codes for consumers.',
    screen: 'processor',
    icon: <path d="M6 3v18M18 3v18M6 8h12M6 16h12" />,
  },
  {
    name: 'Distributor',
    desc: 'Manage inventory and deliveries, track warehousing across the supply chain.',
    screen: 'distributor',
    icon: (
      <>
        <rect x="1" y="7" width="15" height="10" rx="1" />
        <path d="M16 10h3l3 3v4h-6" />
        <circle cx="6" cy="19" r="1.6" />
        <circle cx="17.5" cy="19" r="1.6" />
      </>
    ),
  },

  {
    name: 'Retailer',
    desc: 'Verify incoming batches, manage shelf stock, present traceable product to shoppers.',
    screen: 'retailer',
    icon: (
      <path d="M3 9l1-5h16l1 5M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9M4 9h16" />
    ),
  },
  {
    name: 'Consumer',
    desc: 'Scan a QR code, view the full farm-to-plate history, verify authenticity.',
    screen: 'consumer',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </>
    ),
  },
]
