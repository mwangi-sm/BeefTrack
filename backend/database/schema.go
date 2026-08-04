package database

// Migrations is am array containing the schema of the database
// we run the migrations to ensure the database is up to date when creating a new DB
var Migrations = []string{

	// Organizations
	// Farms, Markets, Slaughterhouses, Retailers, etc

	`
	CREATE TABLE IF NOT EXISTS organizations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		location TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`,

	// Animals

	`
	CREATE TABLE IF NOT EXISTS animals (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		tag_number TEXT NOT NULL UNIQUE,
		breed TEXT,
		sex TEXT,
		date_of_birth DATE,
		status TEXT NOT NULL DEFAULT 'alive',
		current_owner INTEGER,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

		FOREIGN KEY(current_owner)
			REFERENCES organizations(id)
	);
	`,

	// Animal Events
	// Every change in an animal's life is recorded here

	`
	CREATE TABLE IF NOT EXISTS animal_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		animal_id INTEGER NOT NULL,

		event_type TEXT NOT NULL,
		event_date DATETIME NOT NULL,

		from_org INTEGER,
		to_org INTEGER,

		location TEXT,
		notes TEXT,

		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

		FOREIGN KEY(animal_id) REFERENCES animals(id),
		FOREIGN KEY(from_org) REFERENCES organizations(id),
		FOREIGN KEY(to_org) REFERENCES organizations(id)
	);
	`,

	// Transport Trips

	`
	CREATE TABLE IF NOT EXISTS transport_trips (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		animal_id INTEGER NOT NULL,

		vehicle_registration TEXT,
		driver_name TEXT,

		origin TEXT,
		destination TEXT,

		departure_time DATETIME,
		arrival_time DATETIME,

		FOREIGN KEY(animal_id)
			REFERENCES animals(id)
	);
	`,

	// Slaughter Records

	`
	CREATE TABLE IF NOT EXISTS slaughter_records (
		id INTEGER PRIMARY KEY AUTOINCREMENT,

		animal_id INTEGER NOT NULL UNIQUE,

		slaughterhouse_id INTEGER NOT NULL,

		carcass_id TEXT UNIQUE NOT NULL,

		slaughter_date DATETIME NOT NULL,

		FOREIGN KEY(animal_id)
			REFERENCES animals(id),

		FOREIGN KEY(slaughterhouse_id)
			REFERENCES organizations(id)
	);
	`,

	// Product Batches
	`
	CREATE TABLE IF NOT EXISTS product_batches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,

		carcass_id TEXT NOT NULL,

		batch_code TEXT NOT NULL UNIQUE,

		product_name TEXT NOT NULL,

		produced_at DATETIME DEFAULT CURRENT_TIMESTAMP,

		FOREIGN KEY(carcass_id)
			REFERENCES slaughter_records(carcass_id)
	);
	`,

	// Indexes

	`CREATE INDEX IF NOT EXISTS idx_animals_tag ON animals(tag_number);`,

	`CREATE INDEX IF NOT EXISTS idx_events_animal ON animal_events(animal_id);`,

	`CREATE INDEX IF NOT EXISTS idx_transport_animal ON transport_trips(animal_id);`,

	`CREATE INDEX IF NOT EXISTS idx_batches_code ON product_batches(batch_code);`,
}
