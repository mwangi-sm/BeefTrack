# Slaughterhouse API contract

All endpoints require a valid Supabase Bearer JWT with the `slaughterhouse`
role. The server resolves the organization only from
`slaughterhouse_officers.profile_id -> organization_id`; request bodies never
select an organization.

Responses use `{ "success": boolean, "message": string, "data": ... }`.
Validation failures return `400` or `422`, an absent/malformed session returns
`401`, a role or organization failure returns `403`, unavailable scoped records
return `404`, and invalid workflow transitions return `409`.

| Method | Path | Contract |
|---|---|---|
| GET, POST | `/api/slaughterhouse/reception` | Lists/creates organization receptions. A create always starts `pending`; the server sets `slaughterhouse_id`. |
| PATCH | `/api/slaughterhouse/reception/{tag}/status` | `pending -> accepted` or `pending -> rejected`. |
| GET, POST | `/api/slaughterhouse/inspection` | Lists/creates ante-mortem inspections for organization receptions. A create starts `pending`. |
| PATCH | `/api/slaughterhouse/inspection/{id}/outcome` | `pending -> approved` or `pending -> rejected`. |
| GET, POST | `/api/slaughterhouse/slaughter` | Lists/creates slaughter operations. Creation requires an approved ante-mortem inspection and starts `waiting`. |
| PATCH | `/api/slaughterhouse/slaughter/{id}/stage` | `waiting -> in_progress -> completed`; the server records stage timestamps. |
| GET, POST | `/api/slaughterhouse/carcasses` | Lists/creates carcasses. Creation requires a completed operation for the same tag. |
| GET, POST | `/api/slaughterhouse/carcass-inspections` | Lists/creates post-mortem inspections. Outcomes: `passed`, `conditionally_passed`, `condemned`. |
| GET, POST | `/api/slaughterhouse/shipments` | Lists/creates shipments. Creation starts `scheduled` and requires an acceptable carcass inspection. |
| PATCH | `/api/slaughterhouse/shipments/{id}/status` | `scheduled -> in_transit -> delivered`; `delayed` is supported before delivery. |
| GET | `/api/slaughterhouse/traceability?tag={tag}` | Returns an authenticated, organization-scoped chain keyed by `animal_receptions.tag_id`. |
| GET | `/api/slaughterhouse/notifications` | Lists notifications addressed to the authenticated user. |
| PATCH | `/api/slaughterhouse/notifications/{id}/read` | Marks only the authenticated recipient's notification as read. |
| GET, PATCH | `/api/slaughterhouse/profile` | Reads/updates the authenticated profile. `id` and `organization_id` are ignored on writes. |

Reports, settings, documents, and facility onboarding are deliberately not
exposed as production contracts until their persistence, authorization, and
storage schema are implemented and tested.
