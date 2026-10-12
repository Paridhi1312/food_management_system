const neo4j = require('neo4j-driver');

let driver = null;
let isConnected = false;
let connectionInfo = {};

const connectNeo4j = async () => {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || uri.includes('YOUR_') || !user || !password) {
    console.warn('⚠️  Neo4j credentials not configured in .env. Neo4j routes will respond with setup instructions.');
    return false;
  }

  try {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
      connectionTimeoutMs: 8000,
    });
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    connectionInfo = {
      address: serverInfo.address,
      agentInfo: serverInfo.agent,
      protocolVersion: serverInfo.protocolVersion,
    };
    console.log(`✅ Neo4j Connected: ${serverInfo.address}`);
    return true;
  } catch (err) {
    isConnected = false;
    driver = null;
    console.error('❌ Neo4j Connection Error:', err.message);
    return false;
  }
};

const getDriver = () => driver;

const getNeo4jStatus = () => ({
  isConnected,
  uri: process.env.NEO4J_URI || null,
  user: process.env.NEO4J_USER || null,
  ...connectionInfo,
});

const closeNeo4j = async () => {
  if (driver) {
    await driver.close();
    driver = null;
    isConnected = false;
  }
};

module.exports = { connectNeo4j, getDriver, getNeo4jStatus, closeNeo4j };
