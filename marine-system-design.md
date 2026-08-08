# Captain's Briefing Marine Intelligence Platform
## System Design Document
Version 1.0

---

# Mission

The Captain's Briefing Marine Intelligence Platform exists to provide professional small vessel operators with the highest quality voyage planning information possible.

The platform combines:

- Official weather observations
- Official forecast models
- Official marine forecasts
- Wave models
- Tide information
- Local captain observations
- Historical forecast accuracy
- Artificial intelligence analysis

The objective is not to replace the judgement of the vessel master.

The objective is to provide the best available information to assist that judgement.

---

# Core Philosophy

Facts come first.

Interpretation comes second.

AI comes last.

The AI never changes official data.

The AI only interprets verified information.

---

# Source Priority

The system shall distinguish between information sources.

## Tier 1
Official observations

Examples

• Environment Canada weather stations
• Marine weather stations
• Tide stations

These are measured facts.

---

## Tier 2

Official forecast models

Examples

• HRDPS
• GDPS
• GFS
• ICON
• RDWPS

These are predictions.

---

## Tier 3

Official marine forecasts

Examples

• Environment Canada Marine Forecast

These are human-generated forecasts.

---

## Tier 4

Verified captain observations

Reports submitted by verified local operators.

These supplement official observations.

---

## Tier 5

AI interpretation

The AI never replaces the above information.

The AI explains it.

---

# 1. Locations

Every monitored location shall have a permanent ID.

Example

```json
{
  "locationId":"sisters-islets",
  "name":"Sisters Islets",
  "stationCode":"WGT",
  "latitude":49.49,
  "longitude":-124.43,
  "region":"Strait of Georgia"
}
```

Initial monitored locations

• Sisters Islets

• Ballenas Island

• Mid Strait

• French Creek

• Lasqueti Island

Additional locations may be added.

---

# 2. Forecast Records

Every forecast produced by every weather model must be stored permanently.

Forecasts must NEVER be overwritten.

Example

```json
{
  "forecastId":"HRDPS-20260808-0600",

  "model":"HRDPS",

  "forecastFor":"2026-08-08T18:00:00Z",

  "locationId":"sisters-islets",

  "wind":{

      "speedKnots":14,

      "gustKnots":18,

      "direction":"NW"

  }
}
```

Every model run becomes a new record.

---

# 3. Official Observations

Official observations are stored separately from forecasts.

Example

```json
{
    "station":"WGT",

    "observedAt":"2026-08-08T18:00:00Z",

    "wind":{

        "speedKnots":16,

        "gustKnots":21,

        "direction":"NW"

    }
}
```

Official observations shall never be modified.

---

# 4. Wave Forecasts

Wave models are stored separately.

Example

```json
{
    "model":"RDWPS",

    "height":1.0,

    "period":4.7,

    "direction":"NW"
}
```

Wave forecasts remain independent from wind forecasts.

---

# 5. Captain Reports

Captain reports represent observations from experienced operators.

Example

```json
{
    "captain":"Nick",

    "verified":true,

    "location":"Mid Strait",

    "wind":{

        "speedKnots":15,

        "direction":"NW"

    },

    "seaState":"Short steep chop",

    "rideQuality":"Moderate",

    "passengerComfort":"Reduced comfort",

    "notes":"Worst near French Creek."
}
```

Captain reports supplement official observations.

They never replace them.

---

# 6. Crossing Records

Every commercial crossing should eventually be stored.

Information includes

Captain

Boat

Passengers

Departure

Arrival

Travel time

Forecasts used

Observed conditions

Ride quality

Passenger comfort

Captain notes

Crossings become the operational history of the platform.

---

# 7. Forecast Accuracy Records

After observations arrive, forecast accuracy shall be calculated.

Example

```json
{
    "model":"HRDPS",

    "forecastWind":14,

    "observedWind":17,

    "absoluteError":3
}
```

Forecast accuracy must never alter historical forecasts.

---

# 8. Model Performance

Each weather model receives an ongoing performance score.

Metrics include

Average wind error

Average direction error

Average wave error

Bias

Sample count

Recent trend

Performance shall be calculated over

7 days

30 days

90 days

365 days

Lifetime

---

# 9. Captain Briefing Archive

Every AI briefing should be permanently stored.

This allows review of

What the AI predicted

What actually happened

Whether the briefing was useful

---

# 10. Source Integrity

Every record must include its source.

Examples

Official Observation

Forecast Model

Captain Report

AI Interpretation

Sources shall never become mixed together.

---

# 11. Forecast Preservation

Forecasts are immutable.

Forecasts shall never be edited.

Every new model run creates a new record.

This is essential for forecast versus actual analysis.

---

# 12. Missing Data

Missing information shall remain null.

Example

```json
{
    "gustKnots":null
}
```

The AI must acknowledge missing information.

The AI shall never invent missing data.

---

# 13. Model Comparison

The platform compares

HRDPS

GDPS

GFS

ICON

RDWPS

Official Marine Forecast

Captain Reports

Models remain independent.

Model disagreement is useful information.

It shall never be hidden.

---

# 14. Forecast vs Actual Graph

The website shall display

HRDPS

GDPS

GFS

ICON

Actual Sisters observations

Actual Ballenas observations

Captain observations

Historical forecasts

Time is shown horizontally.

Wind speed is shown vertically.

Wave height will eventually become a second graph.

---

# 15. Marine Intelligence Database

The database becomes the permanent memory of the platform.

It stores

Every forecast

Every observation

Every captain report

Every crossing

Every generated briefing

Every model accuracy calculation

Nothing is discarded.

The database continually learns from reality.

---

# Future Development

Future versions may include

Verified captain accounts

Vessel profiles

Automatic route recommendations

Passenger comfort prediction

Fuel consumption prediction

Forecast confidence scoring

Machine learning model ranking

Interactive forecast graphs

Historical playback

Storm archive

Voyage replay

Mobile application

SMS alerts

Email briefings

API access

Multiple coastal routes

Worldwide expansion

---

# Guiding Principle

The Captain's Briefing does not decide whether a voyage should occur.

Only the vessel master makes that decision.

The platform exists to provide the highest quality information possible so that decision can be made with greater confidence.

Facts first.

Experience second.

Artificial intelligence last.
