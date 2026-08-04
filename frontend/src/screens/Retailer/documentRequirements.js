/**
 * Comprehensive Document Verification Checklist for Retailers
 * Organized by category with validation rules and UI copy
 */

export const DOCUMENT_REQUIREMENTS = {
  businessIdentity: {
    title: 'Business Identity',
    description: 'Verify ownership and legal business registration',
    documents: [
      {
        id: 'business-registration',
        name: 'Business Registration Certificate',
        category: 'businessIdentity',
        description:
          'Official government-issued certificate confirming your business is legally registered and operating under the provided business name.',
        whyNeeded:
          "We need this to confirm your retail business is registered with the appropriate authorities and that you're legally authorized to operate.",
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Document expiration',
            description: 'Verify the certificate has not expired',
            action: 'Flag if expiration date has passed',
          },
          {
            check: 'Business name match',
            description: 'Ensure the name on certificate matches your registered store name',
            action: 'Compare with profile store name field',
          },
          {
            check: 'Registration number',
            description: 'Confirm a valid registration number is visible and legible',
            action: 'Verify number format matches country standards',
          },
          {
            check: 'Document clarity',
            description: 'All text and official seals must be clearly visible',
            action: 'Request re-upload if illegible',
          },
        ],
        uiCopy:
          'Upload your Business Registration Certificate to verify your retail operation is legally registered.',
      },
      {
        id: 'trading-license',
        name: 'Trading License',
        category: 'businessIdentity',
        description:
          'Municipal or local government license permitting your business to trade goods (specifically food/meat products).',
        whyNeeded:
          'This confirms you have explicit permission from your local authority to operate a meat retail business in your location.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'License validity period',
            description: 'Confirm license is current and has not expired',
            action: 'Check expiration date against current date',
          },
          {
            check: 'Business activity match',
            description: 'Verify license covers meat/food retail operations',
            action: 'Look for "meat", "food retail", or "butchery" classification',
          },
          {
            check: 'Location match',
            description: 'Ensure licensed location matches your registered address',
            action: 'Compare address with profile location',
          },
          {
            check: 'License number visibility',
            description: 'License number must be clearly visible and legible',
            action: 'Request re-upload if number cannot be read',
          },
        ],
        uiCopy:
          'Upload your Trading License to confirm you are authorized to operate a meat retail business in your area.',
      },
      {
        id: 'ownership-proof',
        name: 'Proof of Ownership / Management',
        category: 'businessIdentity',
        description:
          'Document proving the applicant owns or manages the retail business (e.g., lease agreement, deed, partnership certificate).',
        whyNeeded:
          'We need to confirm that you have the authority to represent and make decisions on behalf of this retail business.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Name match',
            description: 'Applicant name must appear on the document as owner or manager',
            action: 'Compare with user profile contact name',
          },
          {
            check: 'Business name match',
            description: 'Document must reference the correct business',
            action: 'Verify business name consistency',
          },
          {
            check: 'Document date',
            description: 'Document should be recent (within last 2-3 years)',
            action: 'Flag if document is older than current business registration',
          },
          {
            check: 'Authority signature',
            description: 'Must bear official signatures or seals where applicable',
            action: 'Verify authenticity markers are present',
          },
        ],
        uiCopy:
          'Upload a document proving your ownership or management of this retail business (lease, deed, partnership certificate, etc.).',
      },
    ],
  },

  taxLegal: {
    title: 'Tax & Legal',
    description: 'Verify tax compliance and legal obligations',
    documents: [
      {
        id: 'tax-id',
        name: 'Tax Identification Number (TIN) / VAT Certificate',
        category: 'taxLegal',
        description:
          'Government-issued tax identification or VAT registration certificate showing your business tax number and compliance status.',
        whyNeeded:
          'We need to verify your business is registered for taxation and can issue invoices for beef product sales.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'TIN/VAT number visibility',
            description: 'Tax ID number must be clearly visible',
            action: 'Verify number is legible and complete',
          },
          {
            check: 'Registration status',
            description: 'Status should show "Active" or "Current"',
            action: 'Flag if marked as "Inactive" or "Suspended"',
          },
          {
            check: 'Business name match',
            description: 'Name on tax certificate should match business profile',
            action: 'Compare with registered store name',
          },
          {
            check: 'Issue and expiry dates',
            description: 'Document should be current and not expired',
            action: 'Check issue date is reasonable (not too old) and expiry is in future',
          },
        ],
        uiCopy:
          'Upload your Tax ID or VAT certificate to confirm your business is registered for tax purposes.',
      },
      {
        id: 'bank-account',
        name: 'Bank Account Statement / Proof of Banking',
        category: 'taxLegal',
        description:
          'Recent bank statement (last 3 months) or letter from bank confirming the business has an active bank account.',
        whyNeeded:
          'This verifies your business has legitimate banking facilities for receiving payments and managing funds.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '15MB',
        validationChecks: [
          {
            check: 'Account holder name',
            description: 'Account must be under the business name or authorized person',
            action: 'Verify name matches business profile',
          },
          {
            check: 'Recent statement',
            description: 'Bank statement must be from the last 3 months',
            action: 'Check statement date is recent',
          },
          {
            check: 'Account status',
            description: 'Account should show active status with recent transactions',
            action: 'Flag accounts with no activity or "frozen" status',
          },
          {
            check: 'Bank details clarity',
            description: 'Bank name, account number (partially visible), and dates must be clear',
            action: 'Request re-upload if critical information is obscured',
          },
          {
            check: 'PII masking',
            description: 'Full account numbers should be masked or partially obscured for security',
            action: 'Verify sensitive account details are protected',
          },
        ],
        uiCopy:
          'Upload a recent bank statement to verify your business has active banking facilities for payments and transactions.',
      },
      {
        id: 'insurance',
        name: 'Business Insurance Certificate',
        category: 'taxLegal',
        description:
          'Proof of active business liability or product liability insurance covering meat retail operations.',
        whyNeeded:
          'Insurance protects both your business and customers. We require proof of coverage for food retail liability.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Coverage type',
            description: 'Policy should cover general liability or product liability for food/meat retail',
            action: 'Verify "meat", "food", "retail", or "liability" appears in coverage description',
          },
          {
            check: 'Policy validity',
            description: 'Insurance policy must be currently active',
            action: 'Check expiration date is in the future',
          },
          {
            check: 'Business name match',
            description: 'Insured party should be your retail business',
            action: 'Compare business name with policy details',
          },
          {
            check: 'Coverage amount',
            description: 'Coverage limit should be reasonable for retail operations',
            action: 'Flag if coverage appears unusually low (< minimum threshold)',
          },
          {
            check: 'Policy holder details',
            description: 'Policy document must clearly state insured party and coverage period',
            action: 'Verify all key information is legible',
          },
        ],
        uiCopy:
          'Upload your business insurance certificate to prove you have adequate coverage for meat retail operations.',
      },
    ],
  },

  foodSafety: {
    title: 'Food Safety Compliance',
    description: 'Meet health and safety regulations for food handling',
    documents: [
      {
        id: 'health-permit',
        name: 'Health & Safety Permit / Food Handling License',
        category: 'foodSafety',
        description:
          'Government health department permit authorizing the operation of a food retail establishment (specifically meat/butchery).',
        whyNeeded:
          'This is legally required to handle and sell meat products. It shows your store meets sanitation and food safety standards.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Permit type',
            description: 'Should be specifically for meat/butchery or food retail',
            action: 'Verify permit classification includes meat handling',
          },
          {
            check: 'Validity period',
            description: 'Permit must be current and not expired',
            action: 'Check issue and expiration dates',
          },
          {
            check: 'Business location match',
            description: 'Permit address must match your registered store location',
            action: 'Compare permitted address with profile location',
          },
          {
            check: 'Issuing authority',
            description: 'Must be issued by recognized health/food safety authority',
            action: 'Verify issuing organization is legitimate government entity',
          },
          {
            check: 'Permit number',
            description: 'Clear permit number must be visible for verification',
            action: 'Confirm number is legible and complete',
          },
        ],
        uiCopy:
          'Upload your Health & Safety Permit to confirm your store is licensed to handle and sell meat products safely.',
      },
      {
        id: 'food-handler-cert',
        name: 'Food Handler Certificate(s)',
        category: 'foodSafety',
        description:
          'Training certificate for store owner/manager and staff showing completion of food safety/hygiene training.',
        whyNeeded:
          'Food safety training ensures you and your staff know proper handling procedures to prevent contamination and foodborne illness.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Training type',
            description: 'Should be food safety, hygiene, or HACCP training',
            action: 'Verify training name includes relevant keywords',
          },
          {
            check: 'Certificate validity',
            description: 'Certificate should be current (typically valid 1-3 years)',
            action: 'Check expiration date is in the future',
          },
          {
            check: 'Trainee name',
            description: 'At minimum, store owner/manager should have current certification',
            action: 'Verify owner/manager name appears on certificate',
          },
          {
            check: 'Training organization',
            description: 'Certificate should be from recognized food safety training provider',
            action: 'Verify training organization is legitimate',
          },
          {
            check: 'Completion date',
            description: 'Training should be recent and relevant',
            action: 'Flag certificates that are extremely old (> 5 years)',
          },
        ],
        uiCopy:
          'Upload Food Handler Certificate(s) showing you and key staff have completed food safety training.',
      },
      {
        id: 'inspection-record',
        name: 'Recent Health Inspection Report',
        category: 'foodSafety',
        description:
          'Most recent government health department inspection report for your retail establishment (typically from last 6-12 months).',
        whyNeeded:
          'Inspection records show your store has been audited for food safety compliance by government authorities and passed required standards.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '15MB',
        validationChecks: [
          {
            check: 'Inspection recency',
            description: 'Report should be from within the last 6-12 months',
            action: 'Flag if inspection is older than 12 months',
          },
          {
            check: 'Inspection result',
            description: 'Should show "Pass", "Compliant", or "Satisfactory"',
            action: 'Flag critical violations or "Fail" results',
          },
          {
            check: 'Location match',
            description: 'Inspected address must match your registered store location',
            action: 'Verify location consistency',
          },
          {
            check: 'Inspector details',
            description: 'Report must show inspector name/ID and official authority seal',
            action: 'Verify official documentation markers',
          },
          {
            check: 'Inspection scope',
            description: 'Report should cover food handling, storage, and sanitation practices',
            action: 'Confirm inspection covers meat/butchery operations',
          },
        ],
        uiCopy:
          'Upload your most recent health inspection report to show your store meets food safety compliance standards.',
      },
      {
        id: 'cold-chain-cert',
        name: 'Cold Chain / Refrigeration Certification',
        category: 'foodSafety',
        description:
          'Certification or inspection report confirming proper refrigeration equipment and temperature control for meat storage.',
        whyNeeded:
          'Proper cold chain management is critical to prevent bacterial growth and keep beef products safe for consumers.',
        acceptedFormats: ['PDF', 'JPEG', 'PNG'],
        maxFileSize: '10MB',
        validationChecks: [
          {
            check: 'Equipment certification',
            description: 'Should confirm refrigeration units meet food safety standards',
            action: 'Verify equipment types and capacities are documented',
          },
          {
            check: 'Temperature control',
            description: 'Report must confirm proper temperature monitoring and maintenance',
            action: 'Verify temperature ranges are appropriate for meat storage',
          },
          {
            check: 'Recency',
            description: 'Certification should be from within the last 12 months',
            action: 'Flag certifications older than 12 months',
          },
          {
            check: 'Maintenance records',
            description: 'Evidence of regular maintenance and cleaning procedures',
            action: 'Verify maintenance schedule is documented',
          },
          {
            check: 'Facility match',
            description: 'Certification must be for your specific retail location',
            action: 'Confirm facility address matches profile',
          },
        ],
        uiCopy:
          'Upload certification confirming your refrigeration and cold chain systems maintain proper temperatures for meat storage.',
      },
    ],
  },
}

/**
 * Get all documents organized by category
 */
export function getDocumentsByCategory() {
  return {
    businessIdentity: DOCUMENT_REQUIREMENTS.businessIdentity,
    taxLegal: DOCUMENT_REQUIREMENTS.taxLegal,
    foodSafety: DOCUMENT_REQUIREMENTS.foodSafety,
  }
}

/**
 * Get a single document by ID
 */
export function getDocumentById(docId) {
  for (const category of Object.values(DOCUMENT_REQUIREMENTS)) {
    const doc = category.documents.find((d) => d.id === docId)
    if (doc) return doc
  }
  return null
}

/**
 * Get all required documents as a flat list
 */
export function getAllDocuments() {
  const all = []
  for (const category of Object.values(DOCUMENT_REQUIREMENTS)) {
    all.push(...category.documents)
  }
  return all
}
