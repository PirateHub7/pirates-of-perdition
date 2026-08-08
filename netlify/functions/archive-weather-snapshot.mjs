import { getStore } from "@netlify/blobs";

const handler = async () => {

  try {

    const response = await fetch(
      "https://piratesofperdition.com/.netlify/functions/get-model-comparison"
    );

    if (!response.ok) {
      throw new Error(
        `Model comparison request failed: ${response.status}`
      );
    }

    const comparison = await response.json();

    const snapshotTime =
      new Date().toISOString();

    const snapshotId =
      "WEATHER-" +
      Date.now().toString();


    const snapshot = {

      snapshotId,

      snapshotTime,

      sourceFunction:
        "get-model-comparison",

      data:
        comparison

    };


    const store =
      getStore("weather-history");


    await store.setJSON(
      snapshotId,
      snapshot,
      {
        metadata: {
          snapshotTime,
          type: "weather-snapshot"
        }
      }
    );


    console.log(
      `Weather snapshot archived: ${snapshotId}`
    );


    return {
      statusCode: 200
    };


  } catch (error) {

    console.error(
      "Weather archive failed:",
      error
    );


    return {
      statusCode: 500
    };

  }

};


// Runs every hour

export const config = {
  schedule: "0 * * * *"
};


export default handler;
