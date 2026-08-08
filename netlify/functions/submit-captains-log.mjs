import { getStore } from "@netlify/blobs";

export default async (request) => {

  if (request.method !== "POST") {
    return Response.json(
      {
        success: false,
        error: "POST requests only."
      },
      {
        status: 405
      }
    );
  }

  try {

    const log = await request.json();

    if (!log.captain?.name) {
      throw new Error("Captain name is required.");
    }

    if (!log.voyage?.departureTime) {
      throw new Error("Departure time is required.");
    }

    if (!log.voyage?.arrivalTime) {
      throw new Error("Arrival time is required.");
    }

    const logId =
      "LOG-" +
      Date.now().toString() +
      "-" +
      Math.random().toString(36).slice(2, 7);

    const storedLog = {
      logId,
      storedAt: new Date().toISOString(),
      verified: false,
      status: "stored",
      ...log
    };

    const store = getStore("captains-logs");

    await store.setJSON(
      logId,
      storedLog,
      {
        metadata: {
          captainName: log.captain.name,
          departureTime: log.voyage.departureTime,
          storedAt: storedLog.storedAt
        }
      }
    );

    return Response.json({
      success: true,
      logId,
      message: "Captain's Log saved successfully."
    });

  } catch (error) {

    console.error(error);

    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 400
      }
    );

  }

}
