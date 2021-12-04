const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

app = express();
app.use(express.json());

dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// 1. Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `
    SELECT
    state_id AS stateId,
    state_name AS stateName,
    population AS population
    FROM
    state`;
  const dbResponse = await db.all(getAllStatesQuery);
  response.send(dbResponse);
});

// 2. Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    state_id AS stateId,
    state_name AS stateName,
    population AS population
    FROM
    state
    WHERE state_id = ${stateId}`;
  const getState = await db.get(getStateQuery);
  response.send(getState);
});

/*// OPTIONAL CODE FOR GETTING ALL DISTRICTS
app.get("/districts/", async (request, response) => {
  const getDistrictsQuery = `
    SELECT
    *
    FROM
    district`;
  const getDistricts = await db.all(getDistrictsQuery);
  response.send(getDistricts);
});*/

// 3. Create a district in the district table, `district_id` is auto-incremented
app.post("/districts/", async (request, response) => {
  const createDistrict = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = createDistrict;

  const createDistrictQuery = `
    INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths})`;
  const createDistrictDb = await db.run(createDistrictQuery);
  const district_id = createDistrictDb.lastID;
  response.send("District Successfully Added");
});

// 4. Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
    district_id AS districtId,
    district_name AS districtName,
    state_id AS stateId,
    cases AS cases,
    cured AS cured,
    active AS active,
    deaths AS deaths
    FROM
    district
    WHERE district_id = ${districtId}`;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(dbResponse);
});

// 5. Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE
    FROM
    district
    WHERE district_id = ${districtId}`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

// 6. Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
    UPDATE
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// 7. Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statisticsQuery = `
  SELECT
  SUM(cases) AS totalCases,
  SUM(cured) AS totalCured,
  SUM(active) AS totalActive,
  SUM(deaths) AS totalDeaths
  FROM
  district
  WHERE state_id = ${stateId}
  GROUP BY state_id`;
  const totalStatistics = await db.get(statisticsQuery);
  response.send(totalStatistics);
});

// 8. Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
    state.state_name AS stateName
    FROM
    state INNER JOIN district
    ON state.state_id = district.state_id
    WHERE district.district_id = ${districtId};`;
  const getStateName = await db.get(getStateNameQuery);
  response.send(getStateName);
});

module.exports = app;
