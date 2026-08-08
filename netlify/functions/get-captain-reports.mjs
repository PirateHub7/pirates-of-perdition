import { getStore } from "@netlify/blobs";

export default async () => {

  try {

    const store = getStore("captain-reports");

    const { blobs } = await store.list();

    const reports = [];

    for (const blob of blobs) {

      const report = await store.get(blob.key, {
        type: "json"
      });

      if (report) {
        reports.push(report);
      }

    }

    reports.sort((a, b) => {
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    });

    return Response.json({
      success: true,
      count: reports.length,
      reports
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
