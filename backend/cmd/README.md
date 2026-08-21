# BEEFTRACK — FARMER DASHBOARD PRODUCTIONIZATION
# FULL FRONTEND → GO API → SUPABASE IMPLEMENTATION & SECURITY AUDIT

You are working on the BeefTrack/BeefTrace application.

Your task is to take the EXISTING FARMER DASHBOARD from its current frontend/prototype/local-state implementation and make it production-ready through complete integration with the existing Go backend and Supabase PostgreSQL database.

This is NOT a request to create a new Farmer dashboard.

You must work with the existing application, existing UI, existing authentication system, existing backend architecture, and existing Supabase schema.

============================================================
                    NON-NEGOTIABLE ARCHITECTURE
============================================================

The production architecture MUST remain:

    React PWA
        ↓
    Go REST API
        ↓
    Supabase PostgreSQL

Supabase Auth may be accessed directly from the frontend for authentication/session operations.

Application/business data MUST NOT be accessed directly from React using:

    supabase.from(...)
    supabase.rpc(...)
    direct Supabase REST calls
    direct database calls
    service-role keys
    anonymous database access

For Farmer application data, React must communicate with the Go API.

Correct:

    Farmer React screen
        ↓
    Farmer frontend API service
        ↓
    authenticated Go endpoint
        ↓
    Go handler
        ↓
    Go service/business logic
        ↓
    Go repository
        ↓
    Supabase PostgreSQL

Do NOT bypass Go simply because a Supabase query would be easier.

Do NOT introduce a second architecture.

Do NOT move business logic into React.

Do NOT expose Supabase service-role credentials to the browser.

============================================================
                         PRIMARY OBJECTIVE
============================================================

Make EVERY existing Farmer dashboard feature production-ready.

The following areas must be investigated and integrated:

1. Farmer profile
2. Farmer dashboard overview
3. Farms
4. Farm creation
5. Farm editing
6. Farm deletion, if supported by business rules
7. Animals
8. Animal registration
9. Animal details
10. Animal editing
11. Animal health records
12. Veterinary visits
13. Traceability
14. Notifications
15. Settings, if applicable
16. Any Farmer-related onboarding/setup screens
17. Any Farmer-related dashboard statistics
18. Any Farmer-related empty/loading/error states
19. Any Farmer-related local/mock persistence
20. Any Farmer-related navigation or protected routes

Do not assume every feature should be implemented exactly as currently designed.

Audit the current code and database first.

If a frontend feature has no valid backend/database representation, identify that explicitly and determine the safest production implementation.

============================================================
                 PHASE 1 — FULL REPOSITORY AUDIT
============================================================

BEFORE modifying code, inspect the repository thoroughly.

Inspect:

    frontend/
    backend/
    database/migrations/
    SQL/schema files
    Supabase configuration
    authentication middleware
    authorization middleware
    API client
    Farmer screens
    Farmer contexts
    Farmer hooks
    Farmer services
    Farmer components
    Farmer routes
    Farmer models/types
    Go routes
    Go handlers
    Go services
    Go repositories
    database package
    existing tests

Search specifically for:

    Farmer
    farmer
    useFarmerFlow
    farms
    animals
    health_records
    vet_visits
    traceability
    notifications
    profiles

Also search for:

    supabase.from(
    supabase.rpc(
    USE_MOCK
    mock
    TODO
    FIXME
    localStorage
    sessionStorage
    setFarms(
    setAnimals(
    setTraceabilityHistory(
    farmerId
    profileId

Create an internal mapping of:

FRONTEND SCREEN
→ FRONTEND FUNCTION
→ API CALL
→ GO ROUTE
→ GO HANDLER
→ GO SERVICE
→ GO REPOSITORY
→ SUPABASE TABLE
→ DATABASE COLUMNS

Do not modify anything until you understand this chain.

============================================================
                  PHASE 2 — SUPABASE SCHEMA AUDIT
============================================================

The actual Supabase schema is the source of truth for database fields.

Inspect the live schema for all Farmer-related tables.

At minimum inspect:

    profiles
    farmers
    farms
    animals
    health_records
    vet_visits

Also inspect related tables needed for:

    traceability
    animal ownership
    animal transfers
    notifications
    verification
    authentication
    organizations
    veterinary activity

For every relevant table document:

    table name
    primary key
    foreign keys
    required columns
    nullable columns
    default values
    enum/check constraints
    unique constraints
    indexes
    created_at
    updated_at
    ownership fields
    relationship to authenticated user
    RLS status
    existing policies

DO NOT GUESS column names.

DO NOT assume the frontend field name equals the database column name.

For example:

    frontend: farmerId
    backend: farmer_id
    database: farmer_id

is acceptable only if the Go API deliberately maps those fields.

The frontend should not need to know the database implementation.

============================================================
                 PHASE 3 — AUTHENTICATION MODEL
============================================================

Use the existing Supabase Auth system.

The authenticated Supabase JWT identifies the current user.

The backend must derive the current user from the JWT.

Do NOT trust these values from the frontend:

    farmerId
    profileId
    userId
    ownerId
    organizationId

when they are being used to establish ownership.

The backend must resolve:

    JWT subject
        ↓
    profiles.id
        ↓
    farmers record
        ↓
    authenticated Farmer

Determine exactly how the existing project represents this relationship.

If the project uses another established pattern, follow that pattern.

Do not create duplicate identity logic.

============================================================
                    ROLE AUTHORIZATION
============================================================

The Farmer API must verify that the authenticated user is actually authorized to use Farmer endpoints.

A user with another role must not be able to perform Farmer operations simply by calling:

    /api/farmer/...

Do not rely only on frontend route protection.

Frontend route protection is UX.

Backend authorization is security.

Implement/extend backend role middleware as necessary.

Respect the existing role names in BeefTrack.

Do not rename roles unless absolutely necessary.

============================================================
              PHASE 4 — FARMER API CONTRACT
============================================================

Create or complete a consistent API under:

    /api/farmer

Follow the existing Go API conventions.

Do not introduce inconsistent naming.

At minimum investigate and implement:

    GET    /api/farmer/profile
    PATCH  /api/farmer/profile

    GET    /api/farmer/overview

    GET    /api/farmer/farms
    POST   /api/farmer/farms
    GET    /api/farmer/farms/:id
    PATCH  /api/farmer/farms/:id
    DELETE /api/farmer/farms/:id

    GET    /api/farmer/animals
    POST   /api/farmer/animals
    GET    /api/farmer/animals/:id
    PATCH  /api/farmer/animals/:id

    GET    /api/farmer/animals/:id/health-records
    POST   /api/farmer/animals/:id/health-records

    GET    /api/farmer/animals/:id/vet-visits
    POST   /api/farmer/animals/:id/vet-visits

    GET    /api/farmer/traceability
    GET    /api/farmer/notifications

Only create endpoints where the underlying business operation is supported.

If an endpoint already exists, reuse it.

Do not duplicate existing functionality.

============================================================
                    API DESIGN REQUIREMENTS
============================================================

Every endpoint must:

    authenticate request
    authorize Farmer role
    identify current farmer from JWT
    validate request payload
    validate ownership
    execute business logic
    access Supabase through Go
    return consistent JSON
    return appropriate HTTP status codes
    avoid exposing database internals

Use appropriate status codes:

    200 OK
    201 Created
    204 No Content
    400 Bad Request
    401 Unauthorized
    403 Forbidden
    404 Not Found
    409 Conflict
    422 Unprocessable Entity
    500 Internal Server Error

Do not return raw PostgreSQL/Supabase errors to the frontend.

============================================================
                      OWNERSHIP SECURITY
============================================================

THIS IS CRITICAL.

Every Farmer resource must be scoped to the authenticated Farmer.

Farmer A must NEVER be able to access Farmer B's:

    profile
    farms
    animals
    health records
    veterinary records
    notifications
    traceability information

Do not rely on:

    frontend filtering
    URL obscurity
    hidden fields
    disabled buttons
    React state
    route guards

The backend must enforce ownership.

For example:

GET:

    /api/farmer/farms/:id

must verify:

    farm.id
        ↓
    farm.farmer_id
        ↓
    authenticated farmer

before returning the farm.

For animal access:

    animal.id
        ↓
    animal.farm_id
        ↓
    farm.farmer_id
        ↓
    authenticated farmer

must be verified.

Do not simply query:

    animals WHERE id = ?

without ownership validation.

============================================================
                  FARMER PROFILE INTEGRATION
============================================================

Inspect the current Farmer profile screen.

Remove mock/hardcoded profile information.

Load profile information from the backend.

Implement:

    GET /api/farmer/profile

and, if supported:

    PATCH /api/farmer/profile

Determine which fields belong to:

    Supabase Auth metadata
    profiles
    farmers

Do not mix these responsibilities.

Do not allow the frontend to modify protected fields such as:

    role
    account status
    verification status
    approval status
    user ID
    farmer ID
    ownership fields

unless an explicitly authorized workflow exists.

If the existing profile implementation updates Supabase Auth metadata directly, determine whether the backend profile record must also be synchronized.

Prevent inconsistent names/profile data between Auth and application profile data.

============================================================
                      FARM MANAGEMENT
============================================================

Replace local-only farm persistence.

Existing functions such as:

    saveNewFarm()
    updateFarm()
    deleteFarm()

must use the backend.

Implement:

    GET    /api/farmer/farms
    POST   /api/farmer/farms
    GET    /api/farmer/farms/:id
    PATCH  /api/farmer/farms/:id
    DELETE /api/farmer/farms/:id

where supported.

When creating a farm:

The backend must determine the authenticated farmer.

Do NOT accept:

    farmer_id

from the browser as an ownership authority.

If the frontend sends it for some legacy reason, ignore it or reject it.

The server should set the correct ownership value.

When updating/deleting:

verify the farm belongs to the authenticated farmer.

============================================================
                    FARM PAYLOAD AUDIT
============================================================

Inspect the existing Farmer farm form.

For every field:

    identify frontend name
    identify API field
    identify database field
    determine required/optional
    determine data type
    determine validation
    determine server-generated fields

Do not silently discard fields.

If a field has no database representation:

    do not pretend it is saved.

Either:

    map it correctly,
    change the UI,
    or implement the required schema/backend support.

Do not alter the database simply to accommodate a poorly designed frontend field.

============================================================
                    ANIMAL MANAGEMENT
============================================================

Replace local animal state with persistent API operations.

Implement:

    GET    /api/farmer/animals
    POST   /api/farmer/animals
    GET    /api/farmer/animals/:id
    PATCH  /api/farmer/animals/:id

Do not create DELETE unless business rules permit animal deletion.

Animals must belong to farms owned by the authenticated farmer.

When creating an animal:

1. authenticate user
2. identify farmer
3. validate farm
4. verify farm belongs to farmer
5. validate animal payload
6. create animal
7. return created animal

The browser must not be able to attach an animal to another farmer's farm.

============================================================
                 ANIMAL REGISTRATION AUDIT
============================================================

Inspect the existing Animal Registration UI.

Compare every field against the actual animals table.

For every field classify it as:

    REQUIRED
    OPTIONAL
    SERVER GENERATED
    NOT SUPPORTED

Examples may include:

    tag number
    breed
    sex
    age
    date of birth
    weight
    color
    farm
    status

BUT DO NOT ASSUME THESE EXIST.

Inspect the real schema first.

Ensure:

    frontend validation
    backend validation
    database constraints

are consistent.

If the database requires a field, the backend must enforce it even if frontend validation is bypassed.

============================================================
                     DUPLICATE ANIMALS
============================================================

Inspect existing unique constraints around animal identification/tag numbers.

If a tag must be unique:

    enforce it in database
    enforce it in backend
    provide a clean 409 response

Do not rely on:

    SELECT then INSERT

alone because of race conditions.

Use the database constraint as the final authority.

============================================================
                     HEALTH RECORDS
============================================================

Replace local health record state.

Implement:

    GET /api/farmer/animals/:id/health-records
    POST /api/farmer/animals/:id/health-records

Before accessing records:

    verify animal belongs to authenticated farmer.

Do not allow a Farmer to forge server-controlled fields.

Fields such as:

    created_at
    created_by
    record ownership

should be server-controlled where appropriate.

Inspect the actual health_records schema before implementing.

Do not invent fields.

============================================================
                   VETERINARY VISITS
============================================================

Inspect:

    vet_visits

and the existing veterinary workflow.

Determine whether:

    Farmer creates a veterinary visit
OR
    Veterinary officer creates the official visit
OR
    Farmer requests a visit and veterinarian completes it

Do NOT give Farmer permissions that conflict with the business model.

If Farmer is allowed to create/request visits, implement only the permitted fields.

If official veterinary information must be entered by a veterinary officer, enforce that at the backend.

Never trust frontend role checks.

============================================================
                    TRACEABILITY
============================================================

The Farmer traceability feature must use the application's canonical traceability system.

Do not create a separate Farmer-specific traceability algorithm if one already exists.

Inspect existing:

    Admin traceability
    Slaughterhouse traceability
    animal movement
    transport movement
    processing
    product batches
    distributor
    retailer
    QR

services.

Reuse shared backend services where possible.

The Farmer should be able to trace animals/products they are authorized to see.

Do not expose unrelated users' data.

Determine the correct query parameter/identifier from the existing schema.

Do not create fake traceability events.

============================================================
                    NOTIFICATIONS
============================================================

Inspect the existing notification architecture.

If Farmer notifications have a real backend table/service:

    GET /api/farmer/notifications

Implement read operations if supported.

For example:

    PATCH /api/farmer/notifications/:id/read

Notifications must be scoped to the authenticated Farmer.

Do not generate fake notifications in React.

Do not store authoritative notifications only in React state.

============================================================
                    DASHBOARD OVERVIEW
============================================================

Inspect the Farmer dashboard overview cards/statistics.

Determine what they currently display.

Examples may include:

    number of farms
    number of animals
    health status
    recent activities
    pending actions
    notifications

Do not assume these metrics are correct.

Create:

    GET /api/farmer/overview

only if appropriate.

The backend should calculate authoritative metrics.

Do not calculate security-sensitive/authoritative counts only from incomplete frontend state.

Avoid N+1 database queries.

If possible, aggregate efficiently.

============================================================
                FRONTEND API SERVICE
============================================================

Create or extend a dedicated Farmer API service.

Follow the project's existing structure.

For example:

    frontend/src/services/farmer/
        farmerApi.js

or the repository's established equivalent.

Do not place repeated fetch calls directly inside every component.

Use the existing authenticated API client.

The API service should provide clean functions such as:

    getProfile()
    updateProfile()

    getOverview()

    getFarms()
    getFarm(id)
    createFarm(data)
    updateFarm(id, data)
    deleteFarm(id)

    getAnimals()
    getAnimal(id)
    createAnimal(data)
    updateAnimal(id, data)

    getHealthRecords(animalId)
    createHealthRecord(animalId, data)

    getVetVisits(animalId)
    createVetVisit(animalId, data)

    getTraceability(params)

    getNotifications()
    markNotificationRead(id)

Use the project's actual conventions.

Do not duplicate API client/authentication logic.

============================================================
                REMOVE MOCK DATA
============================================================

Find ALL Farmer mock/local data.

Search for:

    USE_MOCK
    mock
    demo
    sample
    placeholder
    fake
    setFarms
    setAnimals
    setTraceabilityHistory

React state is allowed for:

    loading
    modal visibility
    selected item
    form state
    UI filters
    temporary optimistic state

React state must NOT be the authoritative source of Farmer application data.

After refresh:

    farms
    animals
    health records
    veterinary records
    notifications
    traceability

must be retrieved from the backend.

============================================================
                     LOADING STATES
============================================================

Every production API-backed Farmer screen must handle:

    initial loading
    refresh loading
    create loading
    update loading
    delete loading

Prevent duplicate submissions.

Disable submit buttons while requests are active.

Avoid race conditions when rapidly switching animals/farms.

Cancel/ignore stale requests where appropriate.

============================================================
                    ERROR STATES
============================================================

Implement consistent error handling.

401:
    session expired/authentication required

403:
    insufficient permissions

404:
    resource not found

409:
    conflict/duplicate resource

422:
    validation error

500:
    server error

network:
    backend unavailable/network failure

Do not expose:

    SQL
    PostgreSQL
    Supabase internals
    stack traces
    tokens
    secrets

to the user.

Use the project's existing toast/error UI conventions.

============================================================
                    FORM VALIDATION
============================================================

Frontend validation is for UX.

Backend validation is authoritative.

Inspect all Farmer forms.

Validate:

    required fields
    data types
    UUIDs
    numeric values
    date values
    string lengths
    valid ranges
    duplicate identifiers
    relationships

Do not rely on HTML validation alone.

Do not trust client-provided values.

============================================================
                 API RESPONSE CONTRACTS
============================================================

Ensure Go responses are consistent.

Avoid returning raw Supabase responses directly if that leaks internal schema.

Use stable DTOs where appropriate.

Frontend should consume predictable JSON.

Example:

    {
      "data": {...}
    }

or whatever convention already exists in BeefTrack.

Do not create a completely new response convention if the project already has one.

============================================================
                   DATABASE INTEGRITY
============================================================

Do NOT casually change the Supabase schema.

If a required feature cannot work because of a schema deficiency:

1. identify the exact deficiency
2. explain it
3. determine whether migration is justified
4. create a safe migration if required
5. preserve existing data
6. add appropriate constraints/indexes
7. update Go repository
8. update API DTOs
9. update frontend
10. test migration

Never drop production data.

Never make destructive changes.

============================================================
                       RLS AUDIT
============================================================

Inspect RLS for Farmer-related tables:

    profiles
    farmers
    farms
    animals
    health_records
    vet_visits

and related traceability/notification tables.

Report:

    RLS enabled/disabled
    policies
    anonymous access
    authenticated access
    service-role access
    whether direct PostgREST access is possible

The Go API remains the intended application-data boundary.

Do not blindly add permissive RLS policies such as:

    USING (true)

Do not weaken security simply to make the frontend work.

If a table is publicly exposed unnecessarily, fix it safely.

============================================================
                  BACKEND CODE ORGANIZATION
============================================================

Follow the existing Go structure.

Prefer:

    routes
      ↓
    handlers
      ↓
    services
      ↓
    repositories
      ↓
    Supabase

Do not put database queries directly into HTTP handlers if the project architecture already separates repository/service layers.

Reuse existing database helpers.

Reuse existing authentication middleware.

Reuse existing error handling.

Reuse existing DTO conventions.

============================================================
                  TRANSACTIONAL OPERATIONS
============================================================

Identify operations that modify multiple related tables.

Examples may include:

    creating related Farmer records
    animal registration + associated records
    profile setup

If an operation requires multiple writes, determine whether it needs transactional handling.

Do not implement a multi-step operation that can leave inconsistent state without considering rollback/transaction behavior.

If Supabase/Postgres transaction support is required, implement it using the existing backend database mechanism.

============================================================
                  CONCURRENCY / RACE CONDITIONS
============================================================

Consider:

    duplicate animal tags
    concurrent farm updates
    duplicate health records
    repeated form submission
    double clicks
    stale updates

Use database constraints where appropriate.

Do not rely solely on frontend checks.

============================================================
                    AUDIT / LOGGING
============================================================

Inspect the existing audit logging architecture.

For security-sensitive Farmer operations, determine whether actions should be logged.

Examples:

    animal creation
    animal update
    farm creation
    farm update
    profile update

Follow existing project conventions.

Do not log:

    passwords
    JWTs
    access tokens
    secrets

============================================================
                  FRONTEND ROUTING
============================================================

Verify Farmer route protection.

A non-authenticated user must not access Farmer dashboard pages.

A user with another role must not access Farmer pages as an authorized Farmer.

However:

Frontend route protection is NOT a replacement for backend authorization.

Verify the role mapping against the actual BeefTrack role names.

Do not invent new role names.

============================================================
                 FARMER ONBOARDING
============================================================

Inspect Farmer signup/onboarding.

The Farmer signup currently includes fields such as identity/farm information.

Audit the complete flow:

    signup
      ↓
    Supabase Auth
      ↓
    profile creation
      ↓
    farmer creation
      ↓
    farm creation if applicable
      ↓
    Farmer dashboard

Identify any current mismatch between:

    frontend signup payload
    Supabase Auth
    profiles
    farmers
    farms

Fix the integration.

Do not create duplicate Farmer records when the user refreshes or retries signup.

Handle partial signup failure safely.

============================================================
               IMPORTANT: PHONE/EMAIL AUTH
============================================================

Do not change the authentication model blindly.

Inspect how Farmer signup currently determines whether the user is using:

    email
    phone

and ensure it matches the configured Supabase Auth settings.

Do not re-enable phone signup in Supabase merely to hide a frontend bug.

If the application requires email authentication, make the Farmer signup payload consistent with that requirement.

If phone authentication is intended, verify the Supabase configuration and OTP/verification flow.

============================================================
                   API ENDPOINT AUDIT
============================================================

For EVERY Farmer frontend operation create a table during your audit:

    Screen
    User action
    Frontend function
    HTTP method
    Endpoint
    Go route
    Go handler
    Go service
    Repository method
    Supabase table
    Payload
    Response
    Auth requirement
    Ownership check
    Status

Identify each operation as:

    WORKING
    MISSING
    WRONG ENDPOINT
    WRONG METHOD
    WRONG PAYLOAD
    WRONG RESPONSE
    DIRECT SUPABASE BYPASS
    LOCAL ONLY
    SECURITY ISSUE
    SCHEMA MISMATCH

Fix all actionable issues.

============================================================
                DIRECT SUPABASE SEARCH
============================================================

After implementation, run a complete search of Farmer code for:

    supabase.from(
    supabase.rpc(
    createClient(
    VITE_SUPABASE
    SUPABASE_SERVICE_ROLE
    localStorage
    sessionStorage

Any direct application-data Supabase usage must be removed from Farmer frontend code unless there is a documented, legitimate reason.

If any remain, report every occurrence and explain why it remains.

============================================================
                    SECURITY TESTING
============================================================

Create tests for horizontal privilege escalation.

At minimum:

TEST 1:
Farmer A can get own farms.

TEST 2:
Farmer A cannot get Farmer B's farm.

TEST 3:
Farmer A cannot update Farmer B's farm.

TEST 4:
Farmer A cannot delete Farmer B's farm.

TEST 5:
Farmer A can get own animals.

TEST 6:
Farmer A cannot get Farmer B's animal.

TEST 7:
Farmer A cannot update Farmer B's animal.

TEST 8:
Farmer A cannot create an animal attached to Farmer B's farm.

TEST 9:
Farmer A cannot access Farmer B's health records.

TEST 10:
Farmer A cannot access Farmer B's veterinary visits.

TEST 11:
Farmer A cannot access Farmer B's notifications.

TEST 12:
Unauthenticated request returns 401.

TEST 13:
Authenticated non-Farmer returns 403 where applicable.

TEST 14:
Invalid UUID returns appropriate validation error.

TEST 15:
Duplicate animal tag returns 409.

TEST 16:
Invalid required field returns 400/422.

============================================================
                 FRONTEND INTEGRATION TESTING
============================================================

Verify the actual UI.

FLOW 1:

    Login as Farmer
    ↓
    Farmer dashboard
    ↓
    dashboard data loads from API

FLOW 2:

    Create farm
    ↓
    API request
    ↓
    database record
    ↓
    UI updates
    ↓
    browser refresh
    ↓
    farm still exists

FLOW 3:

    Edit farm
    ↓
    API
    ↓
    refresh
    ↓
    change persists

FLOW 4:

    Register animal
    ↓
    API
    ↓
    database
    ↓
    refresh
    ↓
    animal persists

FLOW 5:

    Open animal
    ↓
    health records load

FLOW 6:

    Add health record
    ↓
    backend
    ↓
    refresh
    ↓
    record persists

FLOW 7:

    Open veterinary history
    ↓
    backend
    ↓
    correct data

FLOW 8:

    Open traceability
    ↓
    backend
    ↓
    correct chain

FLOW 9:

    Login as Farmer B
    ↓
    Farmer A data must NOT appear

============================================================
                    BUILD / TESTING
============================================================

Run the appropriate frontend commands.

At minimum:

    npm install
    npm run build

Run appropriate lint/typecheck/test commands if they exist.

For Go:

    go test ./...
    go build ./...

or the project's appropriate equivalents.

Do not ignore existing test failures.

Distinguish:

    pre-existing failures
    failures caused by your changes
    newly discovered failures

Fix failures caused by your implementation.

============================================================
                NO MOCKING / NO FAKE SUCCESS
============================================================

DO NOT:

    return hardcoded Farmer data
    create fake API responses
    fake successful POST requests
    silently swallow database errors
    update React state without persistence
    create endpoints that do nothing
    return 200 for unimplemented functionality
    pretend data was saved when it wasn't

If something cannot safely be implemented:

    return an appropriate error
    document the blocker
    explain the exact missing dependency/schema/business rule

Production readiness requires real persistence.

============================================================
                  DO NOT OVER-REFACTOR
============================================================

This task is specifically the Farmer dashboard.

Do not unnecessarily rewrite:

    Admin
    Transporter
    Slaughterhouse
    Processor
    Distributor
    Retailer

However, if a shared authentication/API/database utility must be fixed, do so carefully.

Do not break existing working dashboards.

Run regression tests after shared changes.

============================================================
                 CODE QUALITY REQUIREMENTS
============================================================

Use the existing project style.

Avoid:

    duplicated API code
    duplicated authorization logic
    giant handlers
    giant React components
    magic strings where constants already exist
    hardcoded IDs
    hardcoded URLs
    secrets in source code

Use:

    reusable services
    reusable middleware
    typed/validated DTOs where appropriate
    centralized API handling
    clear error handling
    clear ownership checks
    database constraints
    indexes where justified

Keep changes maintainable.

============================================================
              PRODUCTION ENVIRONMENT VARIABLES
============================================================

Inspect Farmer API configuration.

Do not hardcode:

    Supabase URL
    Supabase keys
    JWT secrets
    API URLs
    credentials

Use existing environment-variable conventions.

Verify that frontend only receives public-safe configuration.

The Supabase service-role key MUST NEVER be exposed to Vite/frontend code.

============================================================
                    FINAL AUDIT
============================================================

After implementation, perform a second full audit.

For every Farmer feature verify:

    React
      ↓
    API service
      ↓
    HTTP endpoint
      ↓
    Go route
      ↓
    Go handler
      ↓
    Go service
      ↓
    Go repository
      ↓
    Supabase
      ↓
    database constraints
      ↓
    authenticated ownership

No missing link.

============================================================
                     FINAL REPORT
============================================================

When finished, DO NOT simply say "done".

Return a comprehensive implementation report containing:

1. EXECUTIVE SUMMARY

State whether the Farmer dashboard is:

    PRODUCTION READY
    CONDITIONALLY READY
    NOT READY

Do not claim production readiness if critical blockers remain.

2. FILES CHANGED

List every modified/created file.

Group them:

    Frontend
    Backend
    Database/migrations
    Tests

3. API ENDPOINTS

Provide a table:

    Method
    Endpoint
    Purpose
    Auth
    Role
    Ownership check
    Supabase table

4. FRONTEND MAPPING

Provide:

    Screen
    Action
    API function
    Endpoint
    Persistence

5. DATABASE MAPPING

For each feature:

    Frontend field
    API field
    Database column
    Type
    Required?
    Validation

6. SECURITY

Report:

    authentication
    authorization
    ownership enforcement
    IDOR/horizontal privilege escalation protection
    direct Supabase frontend access
    RLS
    service-role exposure
    protected fields

7. TESTS

Report every test run and result.

8. BUILD

Report:

    npm run build
    Go build
    Go tests
    lint/typecheck if available

9. REMAINING ISSUES

List every unresolved issue.

Categorize:

    P0 — production blocker
    P1 — high priority
    P2 — non-blocking

10. SCHEMA ISSUES

List any database/schema limitations discovered.

11. API CONTRACT ISSUES

List any frontend/backend mismatches discovered and fixed.

12. SECURITY ISSUES

List any security weaknesses discovered and fixed.

13. MANUAL TEST CHECKLIST

Give me a short checklist I can manually execute in the browser.

============================================================
                    DEFINITION OF DONE
============================================================

The Farmer dashboard is ONLY considered complete when:

[ ] Farmer authentication works
[ ] Farmer role is enforced
[ ] Farmer profile loads from backend
[ ] Farmer profile updates persist
[ ] Dashboard statistics are real
[ ] Farms load from backend
[ ] Farms can be created
[ ] Farm updates persist
[ ] Farm deletion follows business rules
[ ] Animals load from backend
[ ] Animals can be registered
[ ] Animal updates persist
[ ] Animal ownership is enforced
[ ] Health records load from backend
[ ] Health records persist
[ ] Veterinary visits follow correct permissions
[ ] Traceability uses real backend data
[ ] Notifications use real backend data
[ ] No Farmer application-data path directly accesses Supabase from React
[ ] No Farmer production path relies on mock data
[ ] No Farmer production path relies on local-only state
[ ] Browser refresh preserves data
[ ] Farmer A cannot access Farmer B data
[ ] Non-Farmer cannot use Farmer endpoints
[ ] Unauthenticated users receive 401
[ ] Invalid requests are validated
[ ] Duplicate records are handled
[ ] Database constraints are respected
[ ] No secrets are exposed
[ ] RLS/security exposure has been reviewed
[ ] Backend tests pass
[ ] Frontend build passes
[ ] Go build passes
[ ] Regression tests pass
[ ] Final endpoint audit completed

============================================================
                         FINAL RULE
============================================================

Do not optimize for "making the UI work".

Optimize for:

    CORRECTNESS
    SECURITY
    DATA INTEGRITY
    AUTHORIZATION
    PERSISTENCE
    MAINTAINABILITY
    PRODUCTION READINESS

The final system must behave as a real multi-user application.

A Farmer must only see and modify resources they are authorized to access.

The frontend must be a client of the Go API, not a second database client.

Do not hide incomplete functionality.

Do not fabricate functionality.

Inspect → design → implement → test → audit → report.