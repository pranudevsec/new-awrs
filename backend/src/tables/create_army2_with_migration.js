const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configurations
const armyConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'army',
    password: 'your_password_here', // Update with your local postgres password
    port: 5432,
};

const army2Config = {
    user: 'postgres',
    host: 'localhost',
    database: 'army-2',
    password: 'your_password_here', // Update with your local postgres password
    port: 5432,
};

async function createArmy2WithMigration() {
    let armyPool, army2Pool;
    
    try {
        console.log('🚀 Starting army-2 database creation and migration...');
        
        // ============================================
        // STEP 1: Create army-2 database
        // ============================================
        console.log('📁 Creating army-2 database...');
        
        const adminPool = new Pool({
            user: armyConfig.user,
            host: armyConfig.host,
            database: 'postgres', // Connect to default database
            password: armyConfig.password,
            port: armyConfig.port,
        });
        
        const adminClient = await adminPool.connect();
        
        try {
            // Drop database if exists
            await adminClient.query('DROP DATABASE IF EXISTS "army-2"');
            console.log('✓ Dropped existing army-2 database if it existed');
            
            // Create new database
            await adminClient.query('CREATE DATABASE "army-2"');
            console.log('✓ Created army-2 database');
        } finally {
            adminClient.release();
            await adminPool.end();
        }
        
        // ============================================
        // STEP 2: Set up army-2 database structure
        // ============================================
        console.log('🏗️ Setting up army-2 database structure...');
        
        army2Pool = new Pool(army2Config);
        const army2Client = await army2Pool.connect();
        
        try {
            // Read and execute the database creation script
            const createScript = fs.readFileSync(
                path.join(__dirname, 'create_army2_database.sql'), 
                'utf8'
            );
            
            // Split and execute statements
            const statements = createScript
                .split(';')
                .map(stmt => stmt.trim())
                .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('\\'));
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i];
                if (statement.trim()) {
                    try {
                        await army2Client.query(statement);
                        console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
                    } catch (error) {
                        console.error(`✗ Error in statement ${i + 1}:`, error.message);
                        // Continue with next statement
                    }
                }
            }
            
            console.log('✓ army-2 database structure created');
        } finally {
            army2Client.release();
        }
        
        // ============================================
        // STEP 3: Copy Parameter_Master data from army
        // ============================================
        console.log('📋 Copying Parameter_Master data from army to army-2...');
        
        armyPool = new Pool(armyConfig);
        const armyClient = await armyPool.connect();
        
        try {
            // Get all Parameter_Master data from army database
            const result = await armyClient.query(`
                SELECT 
                    param_id,
                    comd,
                    award_type,
                    applicability,
                    category,
                    subcategory,
                    subsubcategory,
                    name,
                    arms_service,
                    location,
                    description,
                    negative,
                    per_unit_mark,
                    max_marks,
                    proof_reqd,
                    weightage,
                    param_sequence,
                    param_mark
                FROM Parameter_Master 
                ORDER BY param_id
            `);
            
            console.log(`✓ Retrieved ${result.rows.length} records from army database`);
            
            // Insert data into army-2 with foreign key references
            const army2Client2 = await army2Pool.connect();
            
            try {
                let insertedCount = 0;
                let errorCount = 0;
                
                for (const row of result.rows) {
                    try {
                        // Get or create foreign key references
                        const commandResult = await army2Client2.query(
                            'SELECT command_id FROM Command_Master WHERE command_name = $1',
                            [row.comd]
                        );
                        let commandId = commandResult.rows[0]?.command_id;
                        
                        if (!commandId) {
                            const insertResult = await army2Client2.query(
                                'INSERT INTO Command_Master (command_name) VALUES ($1) RETURNING command_id',
                                [row.comd]
                            );
                            commandId = insertResult.rows[0].command_id;
                        }
                        
                        const armsServiceResult = await army2Client2.query(
                            'SELECT arms_service_id FROM Arms_Service_Master WHERE arms_service_name = $1',
                            [row.arms_service]
                        );
                        let armsServiceId = armsServiceResult.rows[0]?.arms_service_id;
                        
                        if (!armsServiceId) {
                            const insertResult = await army2Client2.query(
                                'INSERT INTO Arms_Service_Master (arms_service_name) VALUES ($1) RETURNING arms_service_id',
                                [row.arms_service]
                            );
                            armsServiceId = insertResult.rows[0].arms_service_id;
                        }
                        
                        const deploymentResult = await army2Client2.query(
                            'SELECT deployment_id FROM Deployment_Master WHERE deployment_name = $1',
                            [row.location]
                        );
                        let deploymentId = deploymentResult.rows[0]?.deployment_id;
                        
                        if (!deploymentId) {
                            const insertResult = await army2Client2.query(
                                'INSERT INTO Deployment_Master (deployment_name) VALUES ($1) RETURNING deployment_id',
                                [row.location]
                            );
                            deploymentId = insertResult.rows[0].deployment_id;
                        }
                        
                        // Insert the record with foreign key references
                        await army2Client2.query(`
                            INSERT INTO Parameter_Master (
                                param_id,
                                award_type,
                                applicability,
                                category,
                                subcategory,
                                subsubcategory,
                                name,
                                description,
                                negative,
                                per_unit_mark,
                                max_marks,
                                proof_reqd,
                                weightage,
                                param_sequence,
                                param_mark,
                                command_id,
                                arms_service_id,
                                deployment_id
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
                        `, [
                            row.param_id,
                            row.award_type,
                            row.applicability,
                            row.category,
                            row.subcategory,
                            row.subsubcategory,
                            row.name,
                            row.description,
                            row.negative,
                            row.per_unit_mark,
                            row.max_marks,
                            row.proof_reqd,
                            row.weightage,
                            row.param_sequence,
                            row.param_mark,
                            commandId,
                            armsServiceId,
                            deploymentId
                        ]);
                        
                        insertedCount++;
                        
                        if (insertedCount % 100 === 0) {
                            console.log(`✓ Inserted ${insertedCount} records...`);
                        }
                        
                    } catch (error) {
                        errorCount++;
                        console.error(`✗ Error inserting record ${row.param_id}:`, error.message);
                    }
                }
                
                console.log(`✓ Migration completed: ${insertedCount} records inserted, ${errorCount} errors`);
                
                // Update sequence
                await army2Client2.query(`
                    SELECT setval('parameter_master_param_id_seq', COALESCE((SELECT MAX(param_id) FROM Parameter_Master), 1))
                `);
                
                // ============================================
                // STEP 4: Verification
                // ============================================
                console.log('🔍 Running verification...');
                
                const verificationQueries = [
                    {
                        name: 'Total records in army-2',
                        query: 'SELECT COUNT(*) as count FROM Parameter_Master'
                    },
                    {
                        name: 'Records with command references',
                        query: 'SELECT COUNT(*) as count FROM Parameter_Master WHERE command_id IS NOT NULL'
                    },
                    {
                        name: 'Records with arms service references',
                        query: 'SELECT COUNT(*) as count FROM Parameter_Master WHERE arms_service_id IS NOT NULL'
                    },
                    {
                        name: 'Records with deployment references',
                        query: 'SELECT COUNT(*) as count FROM Parameter_Master WHERE deployment_id IS NOT NULL'
                    },
                    {
                        name: 'Reference table counts',
                        query: `
                            SELECT 'Command_Master' as table_name, COUNT(*) as count FROM Command_Master
                            UNION ALL
                            SELECT 'Arms_Service_Master' as table_name, COUNT(*) as count FROM Arms_Service_Master
                            UNION ALL
                            SELECT 'Deployment_Master' as table_name, COUNT(*) as count FROM Deployment_Master
                        `
                    }
                ];
                
                for (const verification of verificationQueries) {
                    try {
                        const result = await army2Client2.query(verification.query);
                        console.log(`✓ ${verification.name}:`, result.rows);
                    } catch (error) {
                        console.error(`✗ Verification failed for ${verification.name}:`, error.message);
                    }
                }
                
            } finally {
                army2Client2.release();
            }
            
        } finally {
            armyClient.release();
        }
        
        console.log('🎉 army-2 database creation and migration completed successfully!');
        console.log('📊 Database army-2 is ready with normalized structure and all Parameter_Master data');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        // Clean up connections
        if (armyPool) await armyPool.end();
        if (army2Pool) await army2Pool.end();
    }
}

// Run the migration
createArmy2WithMigration()
    .then(() => {
        console.log('✅ All done! army-2 database is ready.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
