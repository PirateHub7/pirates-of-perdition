import { getStore } from "@netlify/blobs";

export default async () => {

  try {

    // =====================================================
    // 1. GET LIVE OFFICIAL MARINE OBSERVATIONS
    // =====================================================

    const marineResponse = await fetch(
      "https://piratesofperdition.com/.netlify/functions/get-marine-data"
    );

    if (!marineResponse.ok) {
      throw new Error(
        `Marine data request failed: ${marineResponse.status}`
      );
    }

    const marineData = await marineResponse.json();

    if (!marineData.success) {
      throw new Error(
        marineData.error ||
        "Marine data unavailable."
      );
    }


    const sisters =
      marineData.observations?.sistersIslets || null;

    const ballenas =
      marineData.observations?.ballenasIsland || null;


    // =====================================================
    // 2. GET RECENT CAPTAIN REPORTS
    // =====================================================

    const captainReports =
      await getRecentCaptainReports();


    // =====================================================
    // 3. BUILD THE BRIEFING
    // =====================================================

    const briefing =
      generateBriefing(
        sisters,
        ballenas,
        captainReports
      );


    return Response.json({

      success: true,

      generatedAt:
        new Date().toISOString(),

      briefing

    });


  } catch (error) {

    console.error(
      "Captain briefing error:",
      error
    );


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

};



// ======================================================
// GET RECENT CAPTAIN REPORTS
// ======================================================

async function getRecentCaptainReports() {

  const store =
    getStore("captain-reports");


  const { blobs } =
    await store.list();


  const reports = [];


  for (const blob of blobs) {

    const report =
      await store.get(
        blob.key,
        {
          type: "json"
        }
      );


    if (!report) {
      continue;
    }


    const observedTime =
      report.observation?.timeObserved ||
      report.submittedAt;


    if (!observedTime) {
      continue;
    }


    const age =
      Date.now() -
      new Date(
        observedTime
      ).getTime();


    const sixHours =
      6 * 60 * 60 * 1000;


    if (age <= sixHours) {

      reports.push(
        report
      );

    }

  }


  reports.sort(
    (a, b) => {

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

    }
  );


  return reports;

}



// ======================================================
// GENERATE BRIEFING
// ======================================================

function generateBriefing(
  sisters,
  ballenas,
  captainReports
) {

  const analysis = [];


  // ===================================================
  // BASIC VALIDATION
  // ===================================================

  const sistersAvailable =
    sisters?.available === true;

  const ballenasAvailable =
    ballenas?.available === true;


  const sistersWind =
    sistersAvailable
      ? sisters.wind?.speedKnots
      : null;


  const ballenasWind =
    ballenasAvailable
      ? ballenas.wind?.speedKnots
      : null;


  const sistersDirection =
    sistersAvailable
      ? sisters.wind?.directionCardinal
      : null;


  const ballenasDirection =
    ballenasAvailable
      ? ballenas.wind?.directionCardinal
      : null;


  // ===================================================
  // ASSESSMENT
  //
  // This is still a simple operational description.
  // It is NOT a voyage limit.
  // ===================================================

  const validWindValues =
    [
      sistersWind,
      ballenasWind
    ]
      .filter(
        value =>
          typeof value === "number"
      );


  const highestWind =
    validWindValues.length
      ? Math.max(
          ...validWindValues
        )
      : null;


  let assessment =
    "FAVOURABLE";


  if (
    highestWind !== null &&
    highestWind >= 10
  ) {

    assessment =
      "CAUTION";

  }


  if (
    highestWind !== null &&
    highestWind >= 18
  ) {

    assessment =
      "CHALLENGING";

  }


  if (
    highestWind !== null &&
    highestWind >= 25
  ) {

    assessment =
      "DEMANDING";

  }


  if (
    highestWind !== null &&
    highestWind >= 35
  ) {

    assessment =
      "EXTREME";

  }


  if (
    highestWind === null
  ) {

    assessment =
      "UNKNOWN";

  }



  // ===================================================
  // ANALYSIS OF OFFICIAL OBSERVATIONS
  // ===================================================

  if (
    sistersAvailable &&
    ballenasAvailable
  ) {

    analysis.push(
      `Current official observations show ${sistersDirection || "unknown direction"} ${formatKnots(sistersWind)} at Sisters Islets and ${ballenasDirection || "unknown direction"} ${formatKnots(ballenasWind)} at Ballenas Island.`
    );

  }


  if (
    sistersAvailable &&
    ballenasAvailable &&
    typeof sistersWind === "number" &&
    typeof ballenasWind === "number"
  ) {

    const difference =
      Math.abs(
        sistersWind -
        ballenasWind
      );


    if (
      difference >= 4
    ) {

      analysis.push(
        "Wind speeds differ noticeably between Sisters Islets and Ballenas Island, indicating uneven conditions across the route."
      );

    }

  }


  if (
    sistersAvailable &&
    ballenasAvailable &&
    sistersDirection &&
    ballenasDirection &&
    sistersDirection !== ballenasDirection
  ) {

    analysis.push(
      "Wind direction differs between the two stations, suggesting localized wind behaviour across the Strait."
    );

  }


  if (
    highestWind !== null &&
    highestWind >= 10
  ) {

    analysis.push(
      "Moderate wind is present at one or both official stations, so exposed sections of the route may experience increased vessel motion."
    );

  }


  if (
    highestWind !== null &&
    highestWind < 10
  ) {

    analysis.push(
      "Official station winds are currently relatively light, although local sea state may still differ from the wind observations."
    );

  }



  // ===================================================
  // GUST ANALYSIS
  // ===================================================

  const sistersGust =
    sistersAvailable
      ? sisters.wind?.gustKnots
      : null;


  const ballenasGust =
    ballenasAvailable
      ? ballenas.wind?.gustKnots
      : null;


  if (
    typeof sistersWind === "number" &&
    typeof sistersGust === "number" &&
    sistersGust - sistersWind >= 5
  ) {

    analysis.push(
      "Sisters Islets is reporting a notable gust spread, which may indicate variable or unstable wind."
    );

  }


  if (
    typeof ballenasWind === "number" &&
    typeof ballenasGust === "number" &&
    ballenasGust - ballenasWind >= 5
  ) {

    analysis.push(
      "Ballenas Island is reporting a notable gust spread, which may affect vessel handling."
    );

  }



  // ===================================================
  // CAPTAIN REPORTS
  // ===================================================

  if (
    captainReports.length === 1
  ) {

    analysis.push(
      "One recent local captain report is available as supplementary on-water evidence."
    );

  }


  if (
    captainReports.length >= 2
  ) {

    analysis.push(
      `${captainReports.length} recent local captain reports are available for comparison with the official observations.`
    );

  }


  const localReports =
    captainReports.map(
      report => ({

        reportId:
          report.reportId,

        captain:
          report.captain?.name ||
          "Local operator",

        verified:
          report.verified === true,

        observedAt:
          report.observation?.timeObserved ||
          report.submittedAt,

        route:
          `${report.route?.from || "Unknown"} → ${report.route?.to || "Unknown"}`,

        area:
          report.location?.area ||
          null,

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

      })
    );



  // ===================================================
  // CONFIDENCE
  // ===================================================

  let confidence =
    "HIGH";


  let confidenceReason =
    "Official station observations are current and available.";


  if (
    !sistersAvailable ||
    !ballenasAvailable
  ) {

    confidence =
      "MODERATE";

    confidenceReason =
      "One or more official station observations are unavailable.";

  }


  if (
    sistersAvailable &&
    ballenasAvailable &&
    typeof sistersWind === "number" &&
    typeof ballenasWind === "number" &&
    Math.abs(
      sistersWind -
      ballenasWind
    ) >= 5
  ) {

    confidence =
      "MODERATE";

    confidenceReason =
      "Official station winds differ significantly across the route.";

  }


  if (
    captainReports.length > 0
  ) {

    confidenceReason +=
      ` ${captainReports.length} recent local captain report${captainReports.length === 1 ? "" : "s"} ${captainReports.length === 1 ? "is" : "are"} available.`;

  }



  // ===================================================
  // RETURN BRIEFING
  // ===================================================

  return {

    title:
      "Captain's Briefing",

    route:
      "Lasqueti Island ↔ French Creek",

    assessment,

    currentConditions: {

      sistersIslets:
        sistersAvailable
          ? {
              wind:
                `${sistersDirection || "—"} ${formatKnots(sistersWind)}`,

              gust:
                formatKnots(
                  sistersGust
                ),

              observedAt:
                sisters.observedAt,

              temperatureC:
                sisters.airTemperatureC,

              pressureKpa:
                sisters.pressureKpa
            }
          : null,


      ballenasIsland:
        ballenasAvailable
          ? {
              wind:
                `${ballenasDirection || "—"} ${formatKnots(ballenasWind)}`,

              gust:
                formatKnots(
                  ballenasGust
                ),

              observedAt:
                ballenas.observedAt,

              temperatureC:
                ballenas.airTemperatureC,

              pressureKpa:
                ballenas.pressureKpa
            }
          : null

    },


    forecast:
      "Forecast model integration is pending. This briefing currently reflects official live observations and recent captain reports.",


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


    sources: [

      {
        type:
          "Official Observation",

        source:
          "Environment and Climate Change Canada",

        stations: [
          "Sisters Islets",
          "Ballenas Island"
        ]
      },

      {
        type:
          "Captain Reports",

        count:
          localReports.length
      }

    ],


    disclaimer:
      "This briefing is intended to assist voyage planning. It is not a navigation aid and does not determine whether a voyage is safe or appropriate. Conditions can change rapidly. Vessel capability, loading, crew experience, passenger considerations, equipment and the final decision to operate remain the responsibility of the vessel's master."

  };

}



// ======================================================
// HELPERS
// ======================================================

function formatKnots(
  value
) {

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(
      Number(value)
    )
  ) {

    return "—";

  }


  return `${Number(value).toFixed(1)} kt`;

}
