# Calbitica: Gamify your Calendar

## Notes
**THIS IS THE PRODUCTION VERSION**. Due to URL rewrites by Nginx on the deployment server, some modifications in link URLs were necessary for the app to work in [https://app.kyurikotpq.com/calbitica/](https://app.kyurikotpq.com/calbitica/). For the best results in the MVC, please visit the project at the aforementioned URL.

The API should work though, but that has not been tested too.

## Project Structure (MVC)
* `config`: Contains configuration details and objects for:
- Google OAuth Sign-In
- Axios instance for conversing with the Habitica API

* `controllers`: Contains the controllers that will:
    * communicate with external APIs (GCal and Habitica)
    * expose data to the website in a RESTful API format
* `db-dump`: Database dump for the local development version before 
* `docs`: API Docs (`dev-*` branches only)
* `middleware`: Contains the functions, processes, etc. that will be triggered before a route is run
* `models`: Contains the Mongoose Schemas used in the app
* `public`: Any assets, i.e. CSS, client-side JS, and images that will be served on the website
* `routes`: Contains the route files for ExpressJS.
* `scss`: Contains the SCSS files to be compiled
* `util`: Contains helper functions, i.e. Date, encryption, JWT and conversion to Calbit data format
* `views`: Contains the HTML/EJS files to be rendered
* `.gitignore`: Files to ignore during Git commits. **Please consult the team before modifying.**
* `index.js`: The entry point of the ExpressJS app

## Other files (not in Git)
* `.env`: Environment variables **for production**. Any variables supposedly for local development has not been tested.

## Running the Project locally [DEPRECATED]
- Ensure Node Version 12.12.0 and above is installed
```
npm install
npm run watch
```
