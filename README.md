# Nanoleaf_Challenge

https://nanoleaf-challenge.herokuapp.com/

Disclaimer: the website is not responsive, so it's best to view it on a bigger screen instead of a mobile device. 

Don't hesitate to email me at **mdhasan.iqbal@mail.utoronto.ca** if there's any problems or the Heroku site has crashed.

Nanoleaf's take-home assignment for the full stack developer internship. 

This is a web-app which takes marketing data, sales data and product grids as JSON files, parses them, stores the data inside an SQL server and displays the results to the user, along with charts when appropriate. 

# Set Up Procedure on Your Local Machine:
1. ```npm install``` to install all the dependencies required for the app
2. Edit the .env file and insert:
  * DB_HOST="YOUR_DB_HOST"
  * DB_USERNAME="YOUR_DB_USERNAME"
  * DB_PASSWORD="YOUR_DB_PASS"
  * DB_NAME="YOUR_DB_NAME"
3. Run the ```database_schema (USE THIS).sql``` file on your DB schema. This will create all the required tables.
4. ```node app.js``` or ```nodemon app.js``` to get the server started on ```localhost:5000```

# Lessons Learned:
1. Finally learned how to use and work with SQL! Will be using SQL for my next project, to extend my knowledge.
2. Learned how to handle files uploaded by user.
3. Learned how to create downloadable CSV files using data sent from the server.

# Technologies used:
1. HTML using EJS as the templating engine
2. CSS
3. JavaScript(Node + Express) for the server and back-end
4. Chart.js to graph data
5. MySQL
6. MySQL workbench for testing out the DB
7. ClearDB - Database
8. Heroku for hosting/serving the server

# Known Problems:
1. If a product has multiple components, only the first one gets put into DB after the first time the data is uploaded.
2. Server might crash if changes made quickly in products page.
3. The JSON files given to me were not valid JSONs. I'm not sure if we were allowed to do this, but I edited each file and fixed it. Inside the `given_files` folder, there is a fixed and the original version of each JSON file (marketing data, sales data, products grid). The app takes in the fixed versions when the user clicks "Insert Original Data", but it also has checks for invalid JSON, and will alert the user if they try to upload invalid JSON files
