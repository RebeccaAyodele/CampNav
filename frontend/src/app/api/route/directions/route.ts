import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { origin, destination, mode } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { success: false, error: "Missing origin or destination" },
        { status: 400 }
      );
    }

    // Default to walking/foot if not specified
    const routingMode = mode === "driving" ? "driving" : "foot";

    // OSRM URL format: /route/v1/{profile}/{coordinates}?options
    // Coordinates must be longitude,latitude separated by semicolon
    const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const osrmUrl = `http://router.project-osrm.org/route/v1/${routingMode}/${coords}?overview=full&geometries=geojson&steps=true`;

    const osrmResponse = await fetch(osrmUrl, {
      // Add a generous timeout or handle it, but OSRM is usually fast
      headers: {
        "User-Agent": "CampNav/1.0",
      },
    });

    if (!osrmResponse.ok) {
      throw new Error(`OSRM API returned ${osrmResponse.status}`);
    }

    const data = await osrmResponse.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return NextResponse.json({ success: false, error: "No route found" }, { status: 404 });
    }

    const route = data.routes[0];
    
    // Parse waypoints from the GeoJSON LineString
    // OSRM geojson coordinates are [longitude, latitude]
    const waypoints = route.geometry.coordinates.map((coord: number[]) => ({
      lng: coord[0],
      lat: coord[1],
    }));

    // Parse turn-by-turn steps
    const steps = [];
    if (route.legs && route.legs.length > 0) {
      const leg = route.legs[0];
      if (leg.steps) {
        for (const step of leg.steps) {
          // Skip empty or arrival steps with 0 distance if needed, but keeping them is fine
          if (step.distance > 0 || step.maneuver.type === "arrive") {
            // OSRM maneuver instructions can be somewhat raw depending on the client, 
            // but the `name` and `type` can construct a simple instruction.
            const type = step.maneuver.type;
            const modifier = step.maneuver.modifier ? ` ${step.maneuver.modifier}` : "";
            const streetName = step.name ? ` onto ${step.name}` : "";
            
            let instruction = `${type}${modifier}${streetName}`;
            
            // Clean up instruction string
            if (type === "turn") {
              instruction = `Turn${modifier}${streetName}`;
            } else if (type === "depart") {
              instruction = `Head${modifier}${streetName}`;
            } else if (type === "arrive") {
              instruction = `You will arrive at your destination`;
            } else if (type === "continue") {
              instruction = `Continue${modifier}${streetName}`;
            }

            // Capitalize first letter
            instruction = instruction.charAt(0).toUpperCase() + instruction.slice(1);

            steps.push({
              instruction,
              distance_meters: Math.round(step.distance),
            });
          }
        }
      }
    }

    // Format response to match the RouteResult interface expected by the frontend
    const result = {
      routeId: `osrm-${Date.now()}`,
      mode: routingMode === "foot" ? "walking" : "driving",
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      waypoints,
      steps,
      isStraightLine: false,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Directions API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
