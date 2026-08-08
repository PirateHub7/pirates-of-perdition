import { getStore } from "@netlify/blobs";

export default async () => {

  try {

    // --------------------------------------------------
    // TEST MARINE DATA
    // We will replace this with live marine data later.
    // --------------------------------------------------

    const marineData = {
      route: "Lasqueti Island ↔ French Creek",

      observations: [
        {
          station: "Sisters Islets",
          direction: "NW",
          wind: 12,
          gust: 16,
          trend: "easing"
        },
        {
          station: "Ballenas Island",
          direction: "NW",
          wind: 9,
          gust: 12,
          trend: "steady"
        }
      ],

      forecast:
        "Northwest winds diminishing through the afternoon.",

      visibility: "Good",

      seaState: "Moderate chop",

      tideStage: "Falling"
    };


    // --------------------------------------------------
    // GET CAPTAIN REPORTS
    // --------------------------------------------------

    const captainReports = await getRecentCaptainReports();


    // --------------------------------------------------
    // GENERATE BRIEFING
    // --------------------------------------------------

    const briefing = generateBriefing(
      marineData,
      captainReports
    );


    return Response.json({
      success: true,
      generatedAt: new Date().toISOString(),
      briefing
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



// ======================================================
// GET RECENT CAPTAIN REPORTS
// ======================================================

async function getRecentCaptainReports() {

  const store = getStore("captain-reports");

  const { blobs } = await store.list();

  const reports = [];


  for (const blob of blobs) {

    const report = await store.get(blob.key, {
      type: "json"
    });

    if (!report) {
      continue;
    }


    // Ignore reports older than 6 hours

    const observedTime =
      report.observation?.timeObserved ||
      report.submittedAt;


    const ageMilliseconds =
      Date.now() -
      new Date(observedTime).getTime();


    const sixHours =
      6 * 60 * 60 * 1000;


    if (ageMilliseconds <= sixHours) {

      reports.push(report);

    }

  }


  // Newest reports first

  reports.sort((a, b) => {

    const timeA =
      new Date(
        a.observation?.timeObserved ||
        a.submittedAt
      );

    const timeB =
      new Date(
        b.observation?.timeObserved ||
        b.submittedAt
      );

    return timeB - timeA;

  });


  return reports;

}



// ======================================================
// GENERATE BRIEFING
// ======================================================

function generateBriefing(
  data,
  captainReports
) {

  const sisters =
    data.observations.find(
      station =>
        station.station ===
        "Sisters Islets"
    );


  const ballenas =
    data.observations.find(
      station =>
        station.station ===
        "Ballenas Island"
    );


  // --------------------------------------------------
  // BASIC ASSESSMENT
  // Temporary logic until AI analysis is connected.
  // --------------------------------------------------

  const highestWind =
    Math.max(
      sisters.wind,
      ballenas.wind
    );


  let assessment =
    "FAVOURABLE";


  if (highestWind >= 10) {
    assessment = "CAUTION";
  }

  if (highestWind >= 18) {
    assessment = "CHALLENGING";
  }

  if (highestWind >= 25) {
    assessment = "DEMANDING";
  }

  if (highestWind >= 35) {
    assessment = "EXTREME";
  }



  // --------------------------------------------------
  // ANALYSIS
  // --------------------------------------------------

  const analysis = [];


  if (
    sisters.wind >
    ballenas.wind + 3
  ) {

    analysis.push(
      "Wind observations are stronger at Sisters Islets than Ballenas Island, indicating uneven conditions across the route."
    );

  }


  if (
    sisters.trend === "easing"
  ) {

    analysis.push(
      "Winds at Sisters Islets are currently easing."
    );

  }


  if (
    highestWind >= 10
  ) {

    analysis.push(
      "Moderate wind is present and exposed sections of the route may experience increased wave activity."
    );

  }


  if (
    data.seaState !== "Calm"
  ) {

    analysis.push(
      `Reported sea conditions are ${data.seaState.toLowerCase()}.`
    );

  }



  // --------------------------------------------------
  // CAPTAIN REPORT SUMMARY
  // --------------------------------------------------

  const localReports =
    captainReports.map(report => {

      return {

        reportId:
          report.reportId,

        captain:
          report.captain?.name ||
          "Local operator",

        verified:
          report.verified === true,

        observedAt:
          report.observation?.timeObserved,

        route:
          `${report.route?.from || "Unknown"} → ${report.route?.to || "Unknown"}`,

        area:
          report.location?.area ||
          null,

        vessel:
          {
            lengthFeet:
              report.vessel?.lengthFeet ||
              null,

            type:
              report.vessel?.type ||
              null
          },

        wind:
          report.observation?.wind ||
          null,

        seaState:
          report.observation?.seaState ||
          null,

        rideQuality:
          report.observation?.rideQuality ||
          null,

        passengerComfort:
          report.observation?.passengerComfort ||
          null,

        speedImpact:
          report.observation?.speedImpact ||
          null,

        notes:
          report.observation?.notes ||
          null,

        captainConfidence:
          report.confidence?.captainConfidence ||
          null

      };

    });



  // --------------------------------------------------
  // LOCAL REPORT ANALYSIS
  // --------------------------------------------------

  if (
    captainReports.length === 1
  ) {

    analysis.push(
      "One recent local captain report is available and should be treated as supplementary evidence."
    );

  }


  if (
    captainReports.length >= 2
  ) {

    analysis.push(
      `${captainReports.length} recent captain reports are available for comparison with instrument observations and forecasts.`
    );

  }



  // --------------------------------------------------
  // CONFIDENCE
  // --------------------------------------------------

  let confidence =
    "HIGH";

  let confidenceReason =
    "Current station observations are reasonably consistent.";

  if (
    Math.abs(
      sisters.wind -
      ballenas.wind
    ) >= 5
  ) {

    confidence =
      "MODERATE";
    confidenceReason =
    "Wind observations differ noticeably between Sisters Islets and Ballenas Island.";
  }

  if (
    captainReports.length === 0
  ) {

    confidenceReason =
      "No recent local captain reports are available.";

  }


  if (
    captainReports.length > 0
  ) {

    confidenceReason +=
      ` ${captainReports.length} recent local captain report${captainReports.length === 1 ? "" : "s"} are available.`;

  }



  // --------------------------------------------------
  // RETURN BRIEFING
  // --------------------------------------------------

  return {

    title:
      "Captain's Briefing",

    route:
      data.route,

    assessment,

    currentConditions: {

      sistersIslets:
        `${sisters.direction} ${sisters.wind} kt, gusting ${sisters.gust} kt`,

      ballenasIsland:
        `${ballenas.direction} ${ballenas.wind} kt, gusting ${ballenas.gust} kt`,

      visibility:
        data.visibility,

      seaState:
        data.seaState,

      tide:
        data.tideStage

    },

    forecast:
      data.forecast,

    analysis,

    localCaptainReports: {

      count:
        localReports.length,

      reports:
        localReports

    },

    confidence: {

      level:
        confidence,

      reason:
        confidenceReason

    },

    disclaimer:
      "This briefing is intended to assist voyage planning. It is not a navigation aid and does not determine whether a voyage is safe or appropriate. Vessel capability, loading, crew experience, passenger considerations, equipment and changing local conditions remain the responsibility of the vessel's master."

  };

}
