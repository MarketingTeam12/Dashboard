const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'crm.db'));

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS metadata_fields (
    module TEXT,
    api_name TEXT,
    field_label TEXT,
    data_type TEXT,
    picklist_values TEXT,
    is_read_only INTEGER,
    is_formula INTEGER,
    lookup_target TEXT,
    PRIMARY KEY(module, api_name)
  );

  CREATE TABLE IF NOT EXISTS metadata_layouts (
    module TEXT,
    layout_name TEXT,
    sections TEXT,
    PRIMARY KEY(module, layout_name)
  );

  CREATE TABLE IF NOT EXISTS metadata_stages (
    module TEXT,
    stage_name TEXT,
    sequence INTEGER,
    probability INTEGER,
    color_code TEXT,
    PRIMARY KEY(module, stage_name)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    Deal_Name TEXT,
    Stage TEXT,
    Amount REAL,
    Closing_Date TEXT,
    Owner_Id TEXT,
    Created_Time TEXT,
    Modified_Time TEXT,
    Approval_Status TEXT,
    custom_data TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_state (
    module TEXT PRIMARY KEY,
    last_sync_time TEXT
  );
`);

module.exports = db;

