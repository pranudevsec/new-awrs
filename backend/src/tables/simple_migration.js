const { Pool } = require('pg');

// Database configurations
const armyConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'army',
    password: '', // No password for local postgres
    port: 5432,
};

const army2Config = {
    user: 'postgres',
    host: 'localhost',
    database: 'army-2',
    password: '', // No password for local postgres
    port: 5432,
};

async function migrateParameterMasterData() {
    let armyPool, army2Pool;
    
    try {
        console.log('🚀 Starting Parameter_Master data migration...');
        
        // Connect to army database
        armyPool = new Pool(armyConfig);
        const armyClient = await armyPool.connect();
        
        console.log('📋 Getting data from army database...');
        
        // Get all Parameter_Master data
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
        
        // Connect to army-2 database
        army2Pool = new Pool(army2Config);
        const army2Client = await army2Pool.connect();
        
        console.log('📝 Inserting data into army-2 database...');
        
        let insertedCount = 0;
        let errorCount = 0;
        
        for (const row of result.rows) {
            try {
                // Get or create command reference
                let commandId;
                const commandResult = await army2Client.query(
                    'SELECT command_id FROM Command_Master WHERE command_name = $1',
                    [row.comd]
                );
                
                if (commandResult.rows.length > 0) {
                    commandId = commandResult.rows[0].command_id;
                } else {
                    const insertResult = await army2Client.query(
                        'INSERT INTO Command_Master (command_name) VALUES ($1) RETURNING command_id',
                        [row.comd]
                    );
                    commandId = insertResult.rows[0].command_id;
                }
                
                // Get or create arms service reference
                let armsServiceId;
                const armsServiceResult = await army2Client.query(
                    'SELECT arms_service_id FROM Arms_Service_Master WHERE arms_service_name = $1',
                    [row.arms_service]
                );
                
                if (armsServiceResult.rows.length > 0) {
                    armsServiceId = armsServiceResult.rows[0].arms_service_id;
                } else {
                    const insertResult = await army2Client.query(
                        'INSERT INTO Arms_Service_Master (arms_service_name) VALUES ($1) RETURNING arms_service_id',
                        [row.arms_service]
                    );
                    armsServiceId = insertResult.rows[0].arms_service_id;
                }
                
                // Get or create deployment reference
                let deploymentId;
                const deploymentResult = await army2Client.query(
                    'SELECT deployment_id FROM Deployment_Master WHERE deployment_name = $1',
                    [row.location]
                );
                
                if (deploymentResult.rows.length > 0) {
                    deploymentId = deploymentResult.rows[0].deployment_id;
                } else {
                    const insertResult = await army2Client.query(
                        'INSERT INTO Deployment_Master (deployment_name) VALUES ($1) RETURNING deployment_id',
                        [row.location]
                    );
                    deploymentId = insertResult.rows[0].deployment_id;
                }
                
                // Insert the record
                await army2Client.query(`
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
        
        // Update sequence
        await army2Client.query(`
            SELECT setval('parameter_master_param_id_seq', COALESCE((SELECT MAX(param_id) FROM Parameter_Master), 1))
        `);
        
        console.log(`✅ Migration completed: ${insertedCount} records inserted, ${errorCount} errors`);
        
        // Verification
        const verificationResult = await army2Client.query(`
            SELECT 
                COUNT(*) as total_records,
                COUNT(command_id) as command_fk_set,
                COUNT(arms_service_id) as arms_service_fk_set,
                COUNT(deployment_id) as deployment_fk_set
            FROM Parameter_Master
        `);
        
        console.log('📊 Verification Results:', verificationResult.rows[0]);
        
        // Show sample data
        const sampleResult = await army2Client.query(`
            SELECT 
                pm.param_id,
                pm.category,
                pm.name,
                cm.command_name,
                asm.arms_service_name,
                dm.deployment_name
            FROM Parameter_Master pm
            LEFT JOIN Command_Master cm ON pm.command_id = cm.command_id
            LEFT JOIN Arms_Service_Master asm ON pm.arms_service_id = asm.arms_service_id
            LEFT JOIN Deployment_Master dm ON pm.deployment_id = dm.deployment_id
            ORDER BY pm.param_id
            LIMIT 5
        `);
        
        console.log('📋 Sample migrated data:');
        console.table(sampleResult.rows);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        if (armyClient) armyClient.release();
        if (army2Client) army2Client.release();
        if (armyPool) await armyPool.end();
        if (army2Pool) await army2Pool.end();
    }
}

// Run the migration
migrateParameterMasterData()
    .then(() => {
        console.log('🎉 Parameter_Master migration completed successfully!');
        console.log('📊 You can now see army-2 database in pgAdmin with all your data');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    });
