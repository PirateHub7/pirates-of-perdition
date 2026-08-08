export default async () => {

  try {

    const stations = [
      {
        key: "sistersIslets",
        name: "Sisters Islets",
        stationCode: "CWGT"
      },
      {
        key: "ballenasIsland",
        name: "Ballenas Island",
        stationCode: "CWGB"
      }
    ];

    const observations = {};

    for (const station of stations) {
      observations[station.key] =
        await getDatamartObservation(station);
    }

    return Response.json({
      success: true,

      source: {
        name: "Environment and Climate Change Canada",
        service: "MSC Datamart",
        dataset: "SWOB Met-ML",
        official: true
      },

      observations,

      fetchedAt: new Date().toISOString()
    });

  } catch (error) {

    console.error(
      "Datamart observation error:",
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
// GET LATEST DATAMART OBSERVATION
// ======================================================

async function getDatamartObservation(station) {

  const url =
    `https://dd.weather.gc.ca/today/observations/swob-ml/latest/` +
    `latest_${station.stationCode}_AUTO_swob.xml`;

  const response = await fetch(url);

  if (!response.ok) {

    return {
      station: station.name,
      stationCode: station.stationCode,
      available: false,
      reason:
        `Datamart request failed with status ${response.status}`,
      sourceUrl: url
    };

  }

  const xml = await response.text();


  // ====================================================
  // OBSERVATION TIME
  // ====================================================

  const observedAt =
    getElementValue(
      xml,
      "date_tm"
    ) ||
    getElementValue(
      xml,
      "date_tm-value"
    );


  // ====================================================
  // WIND
  //
  // Prefer the official 10-minute mean at 10 m.
  // ====================================================

  const windSpeed =
    getElement(
      xml,
      [
        "avg_wnd_spd_10m_pst10mts",
        "avg_wnd_spd_pst10mts",
        "avg_wnd_spd_10m_pst2mts",
        "avg_wnd_spd_pst2mts"
      ]
    );


  const windDirection =
    getElement(
      xml,
      [
        "avg_wnd_dir_10m_pst10mts",
        "avg_wnd_dir_pst10mts",
        "avg_wnd_dir_10m_pst2mts",
        "avg_wnd_dir_pst2mts"
      ]
    );


  // Official SWOB distinguishes maximum wind speed
  // and reportable wind gust. Prefer gust if present.

  const gust =
    getElement(
      xml,
      [
        "max_wnd_gst_spd_10m_pst10mts",
        "max_pk_wnd_spd_10m_pst1hr",
        "max_wnd_spd_10m_pst10mts",
        "max_wnd_spd_10m_pst1hr"
      ]
    );


  const temperature =
    getElement(
      xml,
      [
        "air_temp",
        "avg_air_temp_pst1hr"
      ]
    );


  const pressure =
    getElement(
      xml,
      [
        "stn_pres",
        "mslp",
        "pres"
      ]
    );


  return {

    station:
      station.name,

    stationCode:
      station.stationCode,

    available:
      true,

    observedAt,

    wind: {

      speedKnots:
        convertWindToKnots(
          windSpeed
        ),

      gustKnots:
        convertWindToKnots(
          gust
        ),

      directionDegrees:
        windDirection?.value ?? null,

      directionCardinal:
        degreesToCardinal(
          windDirection?.value ?? null
        ),

      sourcePeriod:
        windSpeed?.name ?? null
    },

    airTemperatureC:
      convertTemperature(
        temperature
      ),

    pressureKpa:
      convertPressureToKpa(
        pressure
      ),

    sourceFile:
      `latest_${station.stationCode}_AUTO_swob.xml`,

    sourceUrl:
      url

  };

}


// ======================================================
// XML HELPERS
// ======================================================

function getElement(
  xml,
  possibleNames
) {

  for (const name of possibleNames) {

    const escaped =
      name.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const regex =
      new RegExp(
        `<element\\b[^>]*\\bname=["']${escaped}["'][^>]*>`,
        "i"
      );

    const match =
      xml.match(regex);

    if (!match) {
      continue;
    }


    const tag =
      match[0];


    const valueMatch =
      tag.match(
        /\bvalue=["']([^"']*)["']/i
      );

    const unitMatch =
      tag.match(
        /\buom=["']([^"']*)["']/i
      );


    if (!valueMatch) {
      continue;
    }


    const numericValue =
      Number(
        valueMatch[1]
      );


    return {

      name,

      value:
        Number.isNaN(
          numericValue
        )
          ? valueMatch[1]
          : numericValue,

      unit:
        unitMatch
          ? unitMatch[1]
          : null

    };

  }

  return null;
}


function getElementValue(
  xml,
  name
) {

  const element =
    getElement(
      xml,
      [name]
    );

  return element
    ? element.value
    : null;
}


// ======================================================
// UNIT CONVERSIONS
// ======================================================

function convertWindToKnots(
  observation
) {

  if (
    !observation ||
    typeof observation.value !== "number"
  ) {

    return null;

  }


  const unit =
    String(
      observation.unit || ""
    ).toLowerCase();


  let knots;


  if (
    unit.includes("km/h") ||
    unit.includes("km h")
  ) {

    knots =
      observation.value *
      0.539957;

  } else if (
    unit === "m/s" ||
    unit.includes("m s")
  ) {

    knots =
      observation.value *
      1.94384;

  } else if (
    unit.includes("knot") ||
    unit === "kt"
  ) {

    knots =
      observation.value;

  } else {

    return null;

  }


  return Number(
    knots.toFixed(1)
  );
}


function convertTemperature(
  observation
) {

  if (
    !observation ||
    typeof observation.value !== "number"
  ) {

    return null;

  }

  return observation.value;
}


function convertPressureToKpa(
  observation
) {

  if (
    !observation ||
    typeof observation.value !== "number"
  ) {

    return null;

  }


  const unit =
    String(
      observation.unit || ""
    ).toLowerCase();


  if (
    unit === "hpa" ||
    unit.includes("hectopascal")
  ) {

    return Number(
      (
        observation.value /
        10
      ).toFixed(1)
    );

  }


  if (
    unit === "kpa"
  ) {

    return Number(
      observation.value.toFixed(1)
    );

  }


  return null;
}


// ======================================================
// CARDINAL WIND DIRECTION
// ======================================================

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
