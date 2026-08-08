import { getStore } from "@netlify/blobs";

export default async () => {

  try {

    const store = getStore("captains-logs");

    const { blobs } = await store.list();

    const logs = [];

    for (const blob of blobs) {

      const log = await store.get(blob.key, {
        type: "json"
      });

      if (log) {
        logs.push(log);
      }

    }

    logs.sort((a, b) => {

      const timeA =
        new Date(
          a.voyage?.departureTime ||
          a.storedAt
        );

      const timeB =
        new Date(
          b.voyage?.departureTime ||
          b.storedAt
        );

      return timeB - timeA;

    });


    return Response.json({

      success: true,

      count: logs.length,

      logs

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
