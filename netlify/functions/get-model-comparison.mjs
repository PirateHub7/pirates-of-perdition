export default async () => {

  try {

    const locations = {

      sistersIslets: {
        name: "Sisters Islets",
        latitude: 49.49,
        longitude: -124.43
      },

      ballenasIsland: {
        name: "Ballenas Island",
        latitude: 49.35,
        longitude: -124.16
      }

    };


    const hrdps = {

      sistersIslets:
        await getHRDPSPoint(
          locations.sistersIslets
        ),

      ballenasIsland:
        await getHRDPSPoint(
          locations.ballenasIsland
        )

    };


    return Response.json({

      success: true,

      generatedAt:
        new Date().toISOString(),

      route: {
        name:
          "Lasqueti Island ↔ French Creek",
        region:
          "Strait of Georgia"
      },

      models: {

        hrdps: {

          name:
            "HRDPS",

          source:
            "Environment and Climate Change Canada",

          resolutionKm:
            2.5,

          status:
            "live",

          locations:
            hrdps

        }

      }

    });


  } catch (error) {

    console.error(
      "HRDPS comparison error:",
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
// HRDPS POINT QUERY
// ======================================================

async function getHRDPSPoint(
  location
) {

  const bboxSize =
    0.025;


  const west =
    location.longitude -
    bboxSize;

  const east =
    location.longitude +
    bboxSize;

  const south =
    location.latitude -
    bboxSize;

  const north =
    location.latitude +
    bboxSize;


  // --------------------------------------------------
  // First retrieve layer metadata.
  // This gives us the current available forecast times.
  // --------------------------------------------------

  const capabilitiesUrl =
    "https://geo.weather.gc.ca/geomet" +
    "?service=WMS" +
    "&version=1.3.0" +
    "&request=GetCapabilities" +
    "&layer=HRDPS.CONTINENTAL_WSPD";


  const capabilitiesResponse =
    await fetch(
      capabilitiesUrl
    );


  if (
    !capabilitiesResponse.ok
  ) {

    throw new Error(
      `HRDPS capabilities request failed: ${capabilitiesResponse.status}`
    );

  }


  const capabilities =
    await capabilitiesResponse.text();


  // --------------------------------------------------
  // Find available forecast datetimes.
  // --------------------------------------------------

  const timeMatch =
    capabilities.match(
      /<Dimension[^>]*name=["']time["'][^>]*>([\s\S]*?)<\/Dimension>/i
    );


  if (!timeMatch) {

    return {

      location:
        location.name,

      available:
        false,

      reason:
        "No HRDPS forecast times found."

    };

  }


  const times =
    timeMatch[1]
      .split(",")
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);


  if (
    times.length === 0
  ) {

    return {

      location:
        location.name,

      available:
        false,

      reason:
        "No HRDPS forecast times available."

    };

  }


  // --------------------------------------------------
  // Choose nearest forecast time at or after now.
  // --------------------------------------------------

  const now =
    Date.now();


  let selectedTime =
    times[0];


  for (
    const time of times
  ) {

    const timestamp =
      new Date(
        time
      ).getTime();


    if (
      timestamp >= now
    ) {

      selectedTime =
        time;

      break;

    }

  }


  // --------------------------------------------------
  // Query wind speed.
  // --------------------------------------------------

  const windSpeed =
    await getFeatureValue({

      layer:
        "HRDPS.CONTINENTAL_WSPD",

      time:
        selectedTime,

      west,
      south,
      east,
      north

    });


  // --------------------------------------------------
  // Query wind direction.
  // --------------------------------------------------

  const windDirection =
    await getFeatureValue({

      layer:
        "HRDPS.CONTINENTAL_WD",

      time:
        selectedTime,

      west,
      south,
      east,
      north

    });


  // --------------------------------------------------
  // Query maximum gust.
  // --------------------------------------------------

  const gust =
    await getFeatureValue({

      layer:
        "HRDPS.CONTINENTAL_WGX",

      time:
        selectedTime,

      west,
      south,
      east,
      north

    });


  return {

    location:
      location.name,

    available:
      true,

    forecastFor:
      selectedTime,

    wind: {

      speedKnots:
        msToKnots(
          windSpeed
        ),

      directionDegrees:
        windDirection,

      directionCardinal:
        degreesToCardinal(
          windDirection
        ),

      gustKnots:
        msToKnots(
          gust
        )

    }

  };

}



// ======================================================
// WMS FEATURE INFO
// ======================================================

async function getFeatureValue({
  layer,
  time,
  west,
  south,
  east,
  north
}) {

  const params =
  new URLSearchParams({

    SERVICE:
      "WMS",

    VERSION:
      "1.3.0",

    REQUEST:
      "GetFeatureInfo",

    LAYERS:
      layer,

    QUERY_LAYERS:
      layer,

    CRS:
      "EPSG:4326",

    BBOX:
      `${south},${west},${north},${east}`,

    WIDTH:
      "101",

    HEIGHT:
      "101",

    I:
      "50",

    J:
      "50",

    FORMAT:
      "image/png",

    INFO_FORMAT:
      "application/json",

    FEATURE_COUNT:
      "1",

    TIME:
      time

  });


  const url =
    "https://geo.weather.gc.ca/geomet?" +
    params.toString();


  const response =
    await fetch(
      url
    );


  if (!response.ok) {

    return null;

  }


  const text =
  await response.text();


if (
  text.trim().startsWith("<")
) {

  console.error(
    `GeoMet XML response for ${layer}:`,
    text.slice(0, 1000)
  );

  return null;

}


const data =
  JSON.parse(text);


  const feature =
    data.features?.[0];


  if (!feature) {

    return null;

  }


  const props =
    feature.properties || {};


  // GeoMet normally returns the layer value
  // as one numeric property. Find the first number.

  if (
  typeof props.value === "number"
) {

  return props.value;

}


if (
  props.value !== undefined &&
  !Number.isNaN(
    Number(props.value)
  )
) {

  return Number(
    props.value
  );

}


return null;

}



// ======================================================
// HELPERS
// ======================================================

function msToKnots(
  value
) {

  if (
    value === null ||
    value === undefined ||
    Number.isNaN(
      Number(value)
    )
  ) {

    return null;

  }


  return Number(
    (
      Number(value) *
      1.94384
    ).toFixed(1)
  );

}



function degreesToCardinal(
  degrees
) {

  if (
    degrees === null ||
    degrees === undefined ||
    Number.isNaN(
      Number(degrees)
    )
  ) {

    return null;

  }


  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW"
  ];


  const normalized =
    (
      Number(degrees) %
      360 +
      360
    ) % 360;


  const index =
    Math.round(
      normalized /
      22.5
    ) % 16;


  return directions[index];

}
    
