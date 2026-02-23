const { KustoClient, KustoConnectionStringBuilder } = require("azure-kusto-data");

module.exports = async function (context, req) {
    
    if (req.method === "OPTIONS") {
        context.res = {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: ""
        };
        return;
    }

    const clusterUrl = process.env.ADX_CLUSTER_URL;
    const database = process.env.ADX_DATABASE || "iotdb";
    const range = req.query.range || "1h";
    
    const allowedRanges = ["1h", "6h", "12h", "1d", "7d"];
    if (!allowedRanges.includes(range)) {
        context.res = { status: 400, body: { error: "Invalid range" } };
        return;
    }

    try {
        const kcsb = KustoConnectionStringBuilder.withAzLoginIdentity(clusterUrl);
        const client = new KustoClient(kcsb);

        const query = `
            telemetry
            | where TimeGenerated > ago(${range})
            | order by TimeGenerated asc
            | project TimeGenerated, temp, hum, deviceTime
        `;

        const results = await client.execute(database, query);
        const rows = results.primaryResults[0].rows();
        
        const data = [];
        for (const row of rows) {
            data.push({
                time: row["TimeGenerated"],
                temp: row["temp"],
                hum: row["hum"],
                deviceTime: row["deviceTime"]
            });
        }

        context.res = {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: { success: true, count: data.length, data: data }
        };

    } catch (err) {
        context.log.error("ADX query failed:", err.message);
        context.res = {
            status: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: { success: false, error: err.message }
        };
    }
};