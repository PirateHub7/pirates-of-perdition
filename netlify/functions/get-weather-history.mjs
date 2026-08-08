import { getStore } from "@netlify/blobs";

export default async () => {

  try {

    const store =
      getStore("weather-history");


    const { blobs } =
      await store.list();


    const snapshots = [];


    for (const blob of blobs) {

      const snapshot =
        await store.get(
          blob.key,
          {
            type: "json"
          }
        );


      if (snapshot) {

        snapshots.push(
          snapshot
        );

      }

    }


    // -----------------------------------------
    // NEWEST SNAPSHOTS FIRST
    // -----------------------------------------

    snapshots.sort(
      (a, b) => {

        const timeA =
          new Date(
            a.snapshotTime ||
            a.data?.generatedAt ||
            0
          );

        const timeB =
          new Date(
            b.snapshotTime ||
            b.data?.generatedAt ||
            0
          );

        return timeB - timeA;

      }
    );


    return Response.json({

      success: true,

      count:
        snapshots.length,

      snapshots

    });


  } catch (error) {

    console.error(
      error
    );


    return Response.json(
      {

        success: false,

        error:
          error.message

      },
      {

        status: 500

      }
    );

  }

}
