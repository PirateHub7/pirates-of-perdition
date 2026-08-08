export default async () => {

  try {

    const url =
      "https://weather.gc.ca/marine/weatherConditions-currentConditions_e.html?mapID=03&siteID=07000&stationID=WGT";

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Environment Canada request failed: ${response.status}`
      );
    }

    const html = await response.text();


    // ---------------------------------------------
    // FIND CURRENT WIND
    // Environment Canada page contains text like:
    // Wind (knots) | NW 12
    // ---------------------------------------------

    const windMatch = html.match(
      /Wind[\s\S]*?\(knots\)[\s\S]*?([NSEW]{1,3}|CALM|VRB)\s+(\d+)/i
    );


    let windDirection = null;
    let windSpeedKnots = null;


    if (windMatch) {

      windDirection =
        windMatch[1].toUpperCase();

      windSpeedKnots =
        Number(windMatch[2]);

    }


    // ---------------------------------------------
    // FIND OBSERVATION TIME
    // ---------------------------------------------

    const timeMatch = html.match(
      /(\d{1,2}:\d{2}\s*(?:AM|PM)\s*PDT[\s\S]*?\d{1,2}\s+[A-Za-z]+\s+\d{4})/i
    );


    let observationTime = null;

    if (timeMatch) {
      observationTime =
        timeMatch[1]
          .replace(/\s+/g, " ")
          .trim();
    }


    // ---------------------------------------------
    // FIND TEMPERATURE
    // ---------------------------------------------

    const temperatureMatch = html.match(
      /Air temperature[\s\S]*?(-?\d+(?:\.\d+)?)/i
    );


    let airTemperatureC = null;

    if (temperatureMatch) {
      airTemperatureC =
        Number(temperatureMatch[1]);
    }


    // ---------------------------------------------
    // FIND PRESSURE
    // ---------------------------------------------

    const pressureMatch = html.match(
      /Pressure and tendency[\s\S]*?(\d{3}\.\d)/i
    );


    let pressureKpa = null;

    if (pressureMatch) {
      pressureKpa =
        Number(pressureMatch[1]);
    }


    return Response.json({

      success: true,

      source: {
        name: "Environment Canada",
        station: "Sisters Islets",
        stationCode: "WGT",
        official: true
      },

      observation: {

        observedAt:
          observationTime,

        wind: {
          direction:
            windDirection,

          speedKnots:
            windSpeedKnots
        },

        airTemperatureC:
          airTemperatureC,

        pressureKpa:
          pressureKpa

      },

      fetchedAt:
        new Date().toISOString()

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
