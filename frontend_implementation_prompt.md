# CampNav — Frontend PWA Implementation Prompt (Plain English Spec)

Your task is to implement the complete, offline-first visitor and admin dashboard frontend for CampNav in the Next.js frontend directory. Follow these requirements carefully to connect the portals to the backend and handle offline capabilities.

---

## 1. Connection Modes & API Integration
* **Online Mode:** Connect the pages to the Express backend API. Refer directly to the API Reference file for endpoint names, required parameters, and JSON payloads.
* **Offline Mode:** If the app is offline or the server health check fails, the PWA must immediately fall back to local client-side data operations. Use the GeoJSON dataset file stored locally inside the application bundle.

---

## 2. Pre-Traced Offline Routing & Landmark Logic
* **No Graph Routing Engines:** Do not implement Dijkstra or other graph pathfinding algorithms on the client. 
* **Pre-traced Matching:** Search the local GeoJSON features for a pre-traced line segment (LineString) where the starting point matches your origin and the ending point matches your destination.
* **Reversing Paths:** If a route is found in reverse (the origin matches the destination parameter of the segment and vice versa), invert the coordinates list to display the correct path.
* **Straight-Line Fallback:** If no pre-traced line segment matches, generate a straight-line navigation path showing distance and direction (bearing) between the two coordinates.
* **Relative Landmark Annotation:** Analyze the coordinates along the generated route. If any point is within forty-five meters of another point of interest (excluding the start and end), calculate if the landmark sits to the left or right of the path based on the walking direction. Dynamically add annotations to the text steps (for example: "passing Access Bank on your left").

---

## 3. Offline Data Queueing and Auto-Sync
* **Form Action Queueing:** If a visitor submits a lost person report while offline, or if a driver performs a bus stop check-in without internet, do not display a failure message. Save the data payload locally inside the browser's storage.
* **Network Recovery Sync:** Set up listeners to detect when the network connection is restored. When the app returns online, automatically send all queued items in the background to the backend database and clear the local storage queue.

---

## 4. Multilingual Translation & Voice Engines
* **Language Selector:** Add a translation selector to the app bar that allows users to choose between English, Yoruba, Hausa, Igbo, and French. Update all static textual elements on the page based on the selected language.
* **Voice-to-Text (Voice Search):** Enable speech recognition using the browser's native speech recognition features. Match the listening language model to the user's chosen language (for example, Yoruba for Yoruba speakers) to transcribe spoken words into search queries.
* **Text-to-Voice (Audio Guidance):** On the directions screen, add a speaker button. When tapped, use the browser's native voice speech synthesis to read the step-by-step landmark directions out loud in the selected language.

---

## 5. WebSocket Integration
* **Live Dashboard:** Connect the admin dashboard to the backend WebSocket server. 
* **Real-time Map Updates:** Listen for shuttle movement events to update the bus markers on the dashboard map in real-time as driver check-ins occur.
* **Emergency Alerts:** Listen for new lost person reports to pop up immediate system alert boxes and add markers to the dashboard map.
