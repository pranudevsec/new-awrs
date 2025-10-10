const { Pool } = require("pg");
const bcrypt = require("bcrypt");

// Database configuration for army-2
const config = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "12345678",
  database: "army-2",
  ssl: false,
};

const pool = new Pool(config);

async function createDummyUsers() {
  const client = await pool.connect();

  try {
    console.log("🚀 Starting dummy user creation...");

    // Get role IDs
    const roleQuery = await client.query(
      "SELECT role_id, role_name FROM Role_Master"
    );
    const roles = {};
    roleQuery.rows.forEach((role) => {
      roles[role.role_name] = role.role_id;
    });

    console.log("📋 Available roles:", roles);

    // Dummy users data
    const users = [
      // Brigade users
      {
        rank: "Brig Gen",
        name: "Brigade Commander 1",
        user_role: "brigade",
        username: "brigade1",
        password: "password123",
        pers_no: "BRG001",
      },
      {
        rank: "Brig Gen",
        name: "Brigade Commander 2",
        user_role: "brigade",
        username: "brigade2",
        password: "password123",
        pers_no: "BRG002",
      },

      // Corps users
      {
        rank: "Lt Gen",
        name: "Corps Commander 1",
        user_role: "corps",
        username: "corps1",
        password: "password123",
        pers_no: "CRP001",
      },
      {
        rank: "Lt Gen",
        name: "Corps Commander 2",
        user_role: "corps",
        username: "corps2",
        password: "password123",
        pers_no: "CRP002",
      },

      // Command users
      {
        rank: "Gen",
        name: "Command Chief 1",
        user_role: "command",
        username: "command1",
        password: "password123",
        pers_no: "CMD001",
      },
      {
        rank: "Gen",
        name: "Command Chief 2",
        user_role: "command",
        username: "command2",
        password: "password123",
        pers_no: "CMD002",
      },

      // Division users
      {
        rank: "Maj Gen",
        name: "Division Commander 1",
        user_role: "division",
        username: "division1",
        password: "password123",
        pers_no: "DIV001",
      },
      {
        rank: "Maj Gen",
        name: "Division Commander 2",
        user_role: "division",
        username: "division2",
        password: "password123",
        pers_no: "DIV002",
      },

      // CW2 user
      {
        rank: "CW2",
        name: "Chief Warrant Officer",
        user_role: "unit",
        username: "cw2",
        password: "password123",
        pers_no: "CW2001",
      },

      // MO user
      {
        rank: "Col",
        name: "Medical Officer",
        user_role: "unit",
        username: "mo",
        password: "password123",
        pers_no: "MO001",
      },

      // OL user
      {
        rank: "Lt Col",
        name: "Operations Leader",
        user_role: "unit",
        username: "ol",
        password: "password123",
        pers_no: "OL001",
      },
    ];

    console.log(`📝 Creating ${users.length} dummy users...`);

    for (const user of users) {
      try {
        console.log(`\n👤 Creating user: ${user.name} (${user.user_role})`);

        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Get role ID
        const roleId = roles[user.user_role];
        if (!roleId) {
          console.log(
            `❌ Role ${user.user_role} not found, skipping ${user.name}`
          );
          continue;
        }

        // Insert into User_tab
        const userQuery = `
          INSERT INTO User_tab (pers_no, rank, name, username, password, role_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING user_id
        `;

        const userResult = await client.query(userQuery, [
          user.pers_no,
          user.rank,
          user.name,
          user.username,
          hashedPassword,
          roleId,
        ]);

        const userId = userResult.rows[0].user_id;
        console.log(` User created with ID: ${userId}`);

        // Create entries in respective master tables
        if (user.user_role === "brigade") {
          await client.query(
            `
            INSERT INTO Brigade_Master (brigade_name, brigade_code)
            VALUES ($1, $2)
          `,
            [user.name, user.pers_no]
          );
          console.log(` Brigade entry created for ${user.name}`);
        } else if (user.user_role === "corps") {
          await client.query(
            `
            INSERT INTO Corps_Master (corps_name, corps_code)
            VALUES ($1, $2)
          `,
            [user.name, user.pers_no]
          );
          console.log(` Corps entry created for ${user.name}`);
        } else if (user.user_role === "command") {
          await client.query(
            `
            INSERT INTO Command_Master (command_name, command_code)
            VALUES ($1, $2)
          `,
            [user.name, user.pers_no]
          );
          console.log(` Command entry created for ${user.name}`);
        } else if (user.user_role === "division") {
          await client.query(
            `
            INSERT INTO Division_Master (division_name, division_code)
            VALUES ($1, $2)
          `,
            [user.name, user.pers_no]
          );
          console.log(` Division entry created for ${user.name}`);
        } else if (user.user_role === "unit") {
          await client.query(
            `
            INSERT INTO Unit_tab (name, unit_type, sos_no, location)
            VALUES ($1, $2, $3, $4)
          `,
            [user.name, "Regular", user.pers_no, "Not Specified"]
          );
          console.log(` Unit entry created for ${user.name}`);
        }
      } catch (error) {
        console.log(`❌ Error creating user ${user.name}:`, error.message);
      }
    }

    console.log("\n🎉 Dummy user creation completed!");

    // Verify creation
    console.log("\n📊 Verification:");

    const userCount = await client.query("SELECT COUNT(*) FROM User_tab");
    console.log(`👥 Total users: ${userCount.rows[0].count}`);

    const brigadeCount = await client.query(
      "SELECT COUNT(*) FROM Brigade_Master"
    );
    console.log(`🏛️ Brigade entries: ${brigadeCount.rows[0].count}`);

    const corpsCount = await client.query("SELECT COUNT(*) FROM Corps_Master");
    console.log(`🏛️ Corps entries: ${corpsCount.rows[0].count}`);

    const commandCount = await client.query(
      "SELECT COUNT(*) FROM Command_Master"
    );
    console.log(`🏛️ Command entries: ${commandCount.rows[0].count}`);

    const divisionCount = await client.query(
      "SELECT COUNT(*) FROM Division_Master"
    );
    console.log(`🏛️ Division entries: ${divisionCount.rows[0].count}`);

    const unitCount = await client.query("SELECT COUNT(*) FROM Unit_tab");
    console.log(`🏛️ Unit entries: ${unitCount.rows[0].count}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

createDummyUsers();
