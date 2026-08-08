export default async (request, context) => {

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


  // -------------------------------------------------------
  // STEP 1
  // Analyze the marine data.
  //
  // Eventually this section will send the information
  // to an AI model.
  //
  // For now we're generating a test briefing ourselves.
  // -------------------------------------------------------

  const briefing = generateBriefing(marineData);


  return Response.json({
    success: true,
    generatedAt: new Date().toISOString(),
    briefing
  });
};



function generateBriefing(data) {

  const sisters = data.observations.find(
    station => station.station === "Sisters Islets"
  );

  const ballenas = data.observations.find(
    station => station.station === "Ballenas Island"
  );


  // ---------------------------------------
  // Basic condition assessment
  // ---------------------------------------

  const highestWind = Math.max(
    sisters.wind,
    ballenas.wind
  );

  let assessment = "FAVOURABLE";

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


  // ---------------------------------------
  // Build explanation
  // ---------------------------------------

  const analysis = [];

  if (sisters.wind > ballenas.wind + 3) {
    analysis.push(
      "Wind observations are stronger at Sisters Islets than Ballenas Island, indicating uneven conditions across the route."
    );
  }

  if (sisters.trend === "easing") {
    analysis.push(
      "Winds at Sisters Islets are currently easing."
    );
  }

  if (highestWind >= 10) {
    analysis.push(
      "Moderate wind is present and exposed sections of the route may experience increased wave activity."
    );
  }

  if (data.seaState !== "Calm") {
    analysis.push(
      `Reported sea conditions are ${data.seaState.toLowerCase()}.`
    );
  }


  // ---------------------------------------
  // Confidence
  // ---------------------------------------

  let confidence = "HIGH";

  if (
    Math.abs(sisters.wind - ballenas.wind) >= 5
  ) {
    confidence = "MODERATE";
  }


  return {

    title: "Captain's Briefing",

    route: data.route,

    assessment,

    currentConditions: {
      sistersIslets:
        `${sisters.direction} ${sisters.wind} kt, gusting ${sisters.gust} kt`,

      ballenasIsland:
        `${ballenas.direction} ${ballenas.wind} kt, gusting ${ballenas.gust} kt`,

      visibility: data.visibility,

      seaState: data.seaState,

      tide: data.tideStage
    },

    forecast: data.forecast,

    analysis,

    confidence,

    disclaimer:
      "This briefing is intended to assist voyage planning. It is not a navigation aid and does not determine whether a voyage is safe or appropriate. Vessel capability, loading, crew experience, passenger considerations and changing local conditions remain the responsibility of the vessel's master."
  };
}
