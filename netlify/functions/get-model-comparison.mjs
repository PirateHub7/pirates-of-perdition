export default async () => {

  try {

    const generatedAt = new Date().toISOString();

    const locations = {

      sistersIslets: {
        name: "Sisters Islets",
        stationCode: "WGT",
        latitude: 49.49,
        longitude: -124.43
      },

      ballenasIsland: {
        name: "Ballenas Island",
        stationCode: "WGB",
        latitude: 49.35,
        longitude: -124.16
      },

      midStrait: {
        name: "Mid-Strait",
        latitude: 49.42,
        longitude: -124.30
      }

    };


    // =====================================================
    // TEST OFFICIAL ECCC GEOMET CONNECTION
    // =====================================================

    const geometUrl =
      "https://api.weather.gc.ca/collections?f=json";

    const geometResponse =
      await fetch(geometUrl);

    if (!geometResponse.ok) {
      throw new Error(
        `ECCC GeoMet request failed: ${geometResponse.status}`
      );
    }

    const geometData =
      await geometResponse.json();


    // =====================================================
    // FIND COLLECTIONS THAT APPEAR TO RELATE TO HRDPS
    // =====================================================

    const allCollections =
      geometData.collections || [];

    const hrdpsCollections =
      allCollections
        .filter(collection => {

          const text =
            `${collection.id || ""} ${collection.title || ""}`
              .toLowerCase();

          return text.includes("hrdps");

        })
        .map(collection => ({
          id: collection.id,
          title: collection.title || null,
          description: collection.description || null
        }));


    // =====================================================
    // MODELS
    // =====================================================

    const models = {

      hrdps: {
        name: "HRDPS",
        source: "Environment and Climate Change Canada",
        resolutionKm: 2.5,
        status:
          hrdpsCollections.length > 0
            ? "source-found"
            : "source-not-found",
        availableCollections: hrdpsCollections,
        forecasts: []
      },

      gdps: {
        name: "GDPS",
        source: "Environment and Climate Change Canada",
        status: "pending",
        forecasts: []
      },

      gfs: {
        name: "GFS",
        source: "NOAA",
        status: "pending",
        forecasts: []
      },

      icon: {
        name: "ICON",
        source: "DWD",
        status: "pending",
        forecasts: []
      }

    };


    const actualObservations = {

      sistersIslets: {
        stationCode: "WGT",
        observations: []
      },

      ballenasIsland: {
        stationCode: "WGB",
        observations: []
      }

    };


    return Response.json({

      success: true,

      generatedAt,

      route: {
        name: "Lasqueti Island ↔ French Creek",
        region: "Strait of Georgia"
      },

      locations,

      models,

      actualObservations,

      geomet: {
        connected: true,
        totalCollections:
          allCollections.length,
        hrdpsCollectionsFound:
          hrdpsCollections.length
      },

      notes: [
        "Connected directly to the official ECCC GeoMet API.",
        "No forecast values are being invented or scraped.",
        "The next step is to identify the exact HRDPS 10 metre wind collection and query Sisters Islets."
      ]

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
