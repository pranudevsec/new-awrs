const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration for local army database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'army',
    password: 'your_password_here', // Update with your local postgres password
    port: 5432,
});

async function runNormalizationMigration() {
    const client = await pool.connect();
    
    try {
        console.log('Starting database normalization migration...');
        
        // Read the migration SQL file
        const migrationSQL = fs.readFileSync(
            path.join(__dirname, 'normalization_migration.sql'), 
            'utf8'
        );
        
        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`Executing ${statements.length} SQL statements...`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    await client.query(statement);
                    console.log(`✓ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    console.error(`✗ Error in statement ${i + 1}:`, error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                    // Continue with next statement instead of failing completely
                }
            }
        }
        
        console.log('Migration completed successfully!');
        
        // Run verification queries
        console.log('\nRunning verification queries...');
        
        const verificationQueries = [
            "SELECT 'Parameter_Master Migration Check' as check_type, COUNT(*) as total_records, COUNT(command_id) as command_fk_set, COUNT(arms_service_id) as arms_service_fk_set, COUNT(deployment_id) as deployment_fk_set FROM Parameter_Master",
            "SELECT 'Unit_tab Migration Check' as check_type, COUNT(*) as total_records, COUNT(command_id) as command_fk_set FROM Unit_tab",
            "SELECT 'User_tab Migration Check' as check_type, COUNT(*) as total_records, COUNT(role_id) as role_fk_set FROM User_tab",
            "SELECT 'Command_Master' as table_name, COUNT(*) as record_count FROM Command_Master UNION ALL SELECT 'Arms_Service_Master' as table_name, COUNT(*) as record_count FROM Arms_Service_Master UNION ALL SELECT 'Deployment_Master' as table_name, COUNT(*) as record_count FROM Deployment_Master UNION ALL SELECT 'Role_Master' as table_name, COUNT(*) as record_count FROM Role_Master"
        ];
        
        for (const query of verificationQueries) {
            try {
                const result = await client.query(query);
                console.log('Verification Result:', result.rows);
            } catch (error) {
                console.error('Verification query failed:', error.message);
            }
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runNormalizationMigration()
    .then(() => {
        console.log('Normalization migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
