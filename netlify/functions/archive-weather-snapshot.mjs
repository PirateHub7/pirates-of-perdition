import { getStore } from "@netlify/blobs";

export default async () => {

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

    const snapshotTime = new Date().toISOString();

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
          type:
            "weather-snapshot"
        }
      }
    );


    return Response.json({

      success: true,

      snapshotId,

      snapshotTime,

      message:
        "Weather snapshot archived successfully."

    });


  } catch (error) {

    console.error(error);

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );

  }

}
