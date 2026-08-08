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


    const sisters =
      await getHRDPSPoint(
        locations.sistersIslets
      );

    const ballenas =
      await getHRDPSPoint(
        locations.ballenasIsland
      );


    return Response.json({

      success: true,

      generatedAt:
        new Date().toISOString(),

      model: {
        name: "HRDPS",
        source:
          "Environment and Climate Change Canada"
      },

      locations: {
        sistersIslets: sisters,
        ballenasIsland: ballenas
      }

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

};



// ======================================================
// HRDPS POINT
// ======================================================

async function getHRDPSPoint(location) {

  const capabilitiesUrl =
    "https://geo.weather.gc.ca/geomet" +
    "?service=WMS" +
    "&version=1.3.0" +
    "&request=GetCapabilities" +
    "&layer=HRDPS.CONTINENTAL_WSPD";


  const capabilitiesResponse =
    await fetch(capabilitiesUrl);


  const capabilities =
    await capabilitiesResponse.text();


  const timeMatch =
    capabilities.match(
      /<Dimension[^>]*name=["']time["'][^>]*default=["']([^"']+)["'][^>]*>/i
    );


  const referenceMatch =
    capabilities.match(
      /<Dimension[^>]*name=["']reference_time["'][^>]*default=["']([^"']+)["'][^>]*>/i
    );


  if (!timeMatch) {

    return {
      available: false,
      reason: "No HRDPS forecast time found."
    };

  }


  const forecastTime =
    timeMatch[1];


  const referenceTime =
    referenceMatch
      ? referenceMatch[1]
      : null;


  const windSpeed =
    await getFeatureValue(
      "HRDPS.CONTINENTAL_WSPD",
      location,
      forecastTime,
      referenceTime
    );


  const windDirection =
    await getFeatureValue(
      "HRDPS.CONTINENTAL_WD",
      location,
      forecastTime,
      referenceTime
    );


  const gust =
    await getFeatureValue(
      "HRDPS.CONTINENTAL_WGX",
      location,
      forecastTime,
      referenceTime
    );


  return {

  location:
    location.name,

  available:
    true,

  modelRunTime:
    referenceTime,

  forecastFor:
    forecastTime,

  wind: {

    speedKnots:
      msToKnots(
        windSpeed.value
      ),

    directionDegrees:
      windDirection.value,

    directionCardinal:
      degreesToCardinal(
        windDirection.value
      ),

    gustKnots:
      gust.value !== null
        ? msToKnots(gust.value)
        : null

  }

};

}



// ======================================================
// FEATURE INFO
// ======================================================

async function getFeatureValue(
  layer,
  location,
  time,
  referenceTime
) {

  const padding =
    0.025;


  const west =
    location.longitude -
    padding;

  const east =
    location.longitude +
    padding;

  const south =
    location.latitude -
    padding;

  const north =
    location.latitude +
    padding;


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


  if (referenceTime) {

    params.set(
      "DIM_REFERENCE_TIME",
      referenceTime
    );

  }


  const url =
    "https://geo.weather.gc.ca/geomet?" +
    params.toString();


  const response =
    await fetch(url);


  const text =
    await response.text();


  if (!response.ok) {

    return {

      value: null,

      status:
        response.status,

      responsePreview:
        text.slice(0, 800),

      requestUrl:
        url

    };

  }


  if (
    text.trim().startsWith("<")
  ) {

    return {

      value: null,

      responseType:
        "XML",

      responsePreview:
        text.slice(0, 800),

      requestUrl:
        url

    };

  }


  let data;


  try {

    data =
      JSON.parse(text);

  } catch {

    return {

      value: null,

      responseType:
        "UNKNOWN",

      responsePreview:
        text.slice(0, 800),

      requestUrl:
        url

    };

  }


  const feature =
    data.features?.[0];


  const props =
    feature?.properties ||
    null;


  let value =
    null;


  if (
    props &&
    props.value !== undefined &&
    !Number.isNaN(
      Number(props.value)
    )
  ) {

    value =
      Number(
        props.value
      );

  }


  return {

    value,

    properties:
      props,

    featureCount:
      data.features?.length || 0,

    requestUrl:
      url

  };

}



// ======================================================
// HELPERS
// ======================================================

function msToKnots(value) {

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


function degreesToCardinal(degrees) {

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


  const index =
    Math.round(
      (
        (
          Number(degrees) %
          360
        ) +
        360
      ) %
      360 /
      22.5
    ) % 16;


  return directions[index];

}
