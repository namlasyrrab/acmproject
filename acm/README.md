# Airplane Communications Mapping Demo 

This demo project was created by Giannfranco Crovetto.

## Overview

Our group project - Airplane Communications Mapping - is a system that captures, organizes, and analyzes real-time air traffic control (ATC) communications using software-defined radios (SDRs). It pairs live audio with real-time aircraft tracking and transcribes the conversations using speech-to-text tools. The system also uses stress detection algorithms to flag when a pilot may be under emotional strain. This information is presented through a web-based dashboard designed for aviation analysts, students, and enthusiasts to review live and past flight communications more easily and effectively. 

In this specific demo, I will be showcasing a standard demo run. When the user first loads into the app, the user will see the home screen, that has 2 links to signup for an account or login to an existing account. The user authentication is handled by Supabase, it only records the user accounts as there is no data being pulled from the database yet at least. Then once the user is logged in, there will be an interactive map to see. The map is set to view over the Boca Raton airport by default as there is a red marker over it. The user is able to zoom out, zoom in, and move around the map. The user can click on the red marker and see the incoming flights. The user can see more flights if they wish by clicking the button below it, and the user can click on each individual flight to see specific flight information for that corresponding flight. In that page, it has specific flight information regarding that flight, like flight number, destination, arrival time, departure time etc. 

## Time Spent
