require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('Migration terminée : les tables ont été créées (ou existaient déjà).');
