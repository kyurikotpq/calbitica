# Calbitica: Gamify your Calendar

## Project Structure (MVC)
* `config`: Contains configuration details and objects for:
- Google OAuth Sign-In
- Axios instance for conversing with the Habitica API

* `controllers`: Contains the controllers that will:
    * communicate with external APIs (GCal and Habitica)
    * expose data to the website in a RESTful API format
* `middleware`: Contains the functions, processes, etc. that will be triggered before a route is run
* `models`: Contains the Mongoose Schemas used in the app
* `public`: Any assets, i.e. CSS, client-side JS, and images that will be served on the website
* `routes`: Contains the route files for ExpressJS. **NEEDS CLEANING UP**
* `scss`: Contains the SCSS files to be compiled
* `tests`: Contains the automated tests to run for API and/or client-side functions
* `util`: Contains helper functions, i.e. Date, encryption, JWT and conversion to Calbit data format
* `views`: Contains the HTML/EJS files to be rendered
* `.gitignore`: Files to ignore during Git commits. **Please consult the team before modifying.**
* `index.js`: The entry point of the ExpressJS app

## Running the Project
```
npm install
npm run watch
```
