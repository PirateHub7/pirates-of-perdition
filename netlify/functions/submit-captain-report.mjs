import { getStore } from "@netlify/blobs";

export default async (request, context) => {

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "POST requests only."
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  try {

    const report = await request.json();

    if (!report.captain?.name) {
      throw new Error("Captain name is required.");
    }

    if (!report.observation?.timeObserved) {
      throw new Error("Observation time is required.");
    }

    if (!report.observation?.seaState?.category) {
      throw new Error("Sea state is required.");
    }


    const reportId =
      "CR-" +
      Date.now().toString() +
      "-" +
      Math.random().toString(36).slice(2, 7);


    const storedReport = {

      reportId,

      submittedAt: new Date().toISOString(),

      verified: false,

      status: "pending",

      ...report
    };


    const store = getStore("captain-reports");


    await store.setJSON(
      reportId,
      storedReport,
      {
        metadata: {
          captainName: report.captain.name,
          submittedAt: storedReport.submittedAt,
          status: "pending"
        }
      }
    );


    return new Response(
      JSON.stringify({
        success: true,
        reportId,
        message: "Captain report submitted successfully."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );


  } catch (error) {

    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }

}
