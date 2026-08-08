export default async () => {

  try {

    const stations = [
      {
        key: "sistersIslets",
        name: "Sisters Islets",
        stationCode: "WGT",
        latitude: 49.49,
        longitude: -124.43
      },

      {
        key: "ballenasIsland",
        name: "Ballenas Island",
        stationCode: "WGB",
        latitude: 49.35,
        longitude: -124.16
      }
    ];


    const observations = {};


    for (const station of stations) {

      const observation =
        await getLatestObservation(station);

      observations[station.key] =
        observation;

    }


    return Response.json({

      success: true,

      source: {
        name:
          "Environment and Climate Change Canada",

        dataset:
          "SWOB Real-Time Surface Weather Observations",

        official:
          true
      },

      observations,

      fetchedAt:
        new Date().toISOString()

    });


  } catch (error) {

    console.error(
      "Marine observation error:",
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
// GET LATEST OBSERVATION NEAR A STATION LOCATION
// ======================================================

async function getLatestObservation(station) {

  const now = new Date();

  const sixHoursAgo =
    new Date(
      now.getTime() -
      6 * 60 * 60 * 1000
    );


  const params =
    new URLSearchParams({

      f: "json",

      datetime:
        `${sixHoursAgo.toISOString()}/${now.toISOString()}`,

      limit:
        "100"

    });


  const url =
    "https://api.weather.gc.ca/collections/swob-realtime/items?" +
    params.toString();


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `${station.name} SWOB request failed: ${response.status}`
    );

  }


  const data =
    await response.json();


  const features =
    data.features || [];


  // --------------------------------------------------
  // FIND THE EXACT STATION
  //
  // SWOB records include station identifiers in
  // different fields depending on the station/network.
  // --------------------------------------------------

  const stationMatches =
    features.filter(feature => {

      const props =
        feature.properties || {};

      const possibleIds = [

        props.wmo_id,
        props.icao_id,
        props.iata_id,
        props.msc_id,
        props.station_id,
        props.stn_id,
        props.station,
        props.name,
        props.name_en

      ]
        .filter(Boolean)
        .map(value =>
          String(value)
            .trim()
            .toUpperCase()
        );


      const target =
        station.stationCode
          .toUpperCase();


      // Also inspect record IDs like:
      // CWGT-AUTO-swob.xml
      const recordId =
        String(
          feature.id || ""
        ).toUpperCase();


      return (
        possibleIds.includes(target) ||
        recordId.includes(
          `C${target}`
        )
      );

    });


  if (
    stationMatches.length === 0
  ) {

    return {

      station:
        station.name,

      stationCode:
        station.stationCode,

      available:
        false,

      reason:
        "No recent exact-station SWOB observation was found.",

      recordsChecked:
        features.length

    };

  }


  // --------------------------------------------------
  // NEWEST MATCH FIRST
  // --------------------------------------------------

  stationMatches.sort(
    (a, b) => {

      const timeA =
        getObservationTime(
          a.properties || {}
        );

      const timeB =
        getObservationTime(
          b.properties || {}
        );

      return (
        new Date(timeB || 0) -
        new Date(timeA || 0)
      );

    }
  );


  const latest =
    stationMatches[0];


  const props =
    latest.properties || {};


  const speedMs =
    firstNumber(

      props.avg_wnd_spd_10m_pst10mts,

      props.avg_wnd_spd_pst10mts,

      props.avg_wnd_spd_10m_pst2mts,

      props.avg_wnd_spd_pst2mts,

      props.wnd_spd

    );


  const gustMs =
    firstNumber(

      props.max_wnd_spd_10m_pst10mts,

      props.max_wnd_spd_pst10mts,

      props.max_wnd_spd_pst1hr,

      props.wnd_gust_spd

    );


  const directionDegrees =
    firstNumber(

      props.avg_wnd_dir_10m_pst10mts,

      props.avg_wnd_dir_pst10mts,

      props.avg_wnd_dir_10m_pst2mts,

      props.avg_wnd_dir_pst2mts,

      props.wnd_dir

    );


  return {

    station:
      station.name,

    stationCode:
      station.stationCode,

    available:
      true,

    observedAt:
      getObservationTime(
        props
      ),

    wind: {

      speedKnots:
        metresPerSecondToKnots(
          speedMs
        ),

      gustKnots:
        metresPerSecondToKnots(
          gustMs
        ),

      directionDegrees:
        directionDegrees,

      directionCardinal:
        degreesToCardinal(
          directionDegrees
        )

    },

    airTemperatureC:
      firstNumber(
        props.air_temp,
        props.avg_air_temp_pst1hr
      ),

    pressureKpa:
      firstNumber(
        props.stn_pres,
        props.pres
      ),

    sourceRecordId:
      latest.id || null

  };

}
  // -----------------------------------------------
  // SORT BY OBSERVATION TIME
  // -----------------------------------------------

  features.sort(
    (a, b) => {

      const timeA =
        getObservationTime(
          a.properties
        );

      const timeB =
        getObservationTime(
          b.properties
        );

      return (
        new Date(timeB || 0) -
        new Date(timeA || 0)
      );

    }
  );


  const latest =
    features[0];


  const props =
    latest.properties || {};


  // -----------------------------------------------
  // WIND
  // SWOB field names can vary slightly by station.
  // We check the standard variants without
  // manufacturing missing values.
  // -----------------------------------------------

  const speedMs =
    firstNumber(
      props.avg_wnd_spd_10m_pst10mts,
      props.avg_wnd_spd_pst10mts,
      props.avg_wnd_spd_10m_pst2mts,
      props.avg_wnd_spd_pst2mts,
      props.wnd_spd
    );


  const gustMs =
    firstNumber(
      props.max_wnd_spd_10m_pst10mts,
      props.max_wnd_spd_pst10mts,
      props.max_wnd_spd_pst1hr,
      props.wnd_gust_spd
    );


  const directionDegrees =
    firstNumber(
      props.avg_wnd_dir_10m_pst10mts,
      props.avg_wnd_dir_pst10mts,
      props.avg_wnd_dir_10m_pst2mts,
      props.avg_wnd_dir_pst2mts,
      props.wnd_dir
    );


  return {

    station:
      station.name,

    stationCode:
      station.stationCode,

    available:
      true,

    observedAt:
      getObservationTime(
        props
      ),

    wind: {

      speedKnots:
        metresPerSecondToKnots(
          speedMs
        ),

      gustKnots:
        metresPerSecondToKnots(
          gustMs
        ),

      directionDegrees:
        directionDegrees,

      directionCardinal:
        degreesToCardinal(
          directionDegrees
        )

    },

    airTemperatureC:
      firstNumber(
        props.air_temp,
        props.avg_air_temp_pst1hr
      ),

    pressureKpa:
      firstNumber(
        props.stn_pres,
        props.pres
      ),

    sourceRecordId:
      latest.id || null

  };

}


// ======================================================
// HELPERS
// ======================================================

function getObservationTime(props) {

  return (
    props.date_tm ||
    props.datetime ||
    props.observation_time ||
    props.obs_time ||
    props.time ||
    null
  );

}


function firstNumber(...values) {

  for (const value of values) {

    if (
      value !== null &&
      value !== undefined &&
      value !== "" &&
      !Number.isNaN(
        Number(value)
      )
    ) {

      return Number(value);

    }

  }

  return null;

}


function metresPerSecondToKnots(value) {

  if (value === null) {
    return null;
  }

  return Number(
    (value * 1.94384)
      .toFixed(1)
  );

}


function degreesToCardinal(degrees) {

  if (
    degrees === null ||
    degrees === undefined
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
      degrees / 22.5
    ) % 16;


  return directions[index];

}
