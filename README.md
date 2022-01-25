# Nanoleaf_Challenge

https://nanoleaf-challenge.herokuapp.com/

Nanoleaf's take-home assignment for the full stack developer internship. 

This is a web-app which takes marketing data, sales data and product grids as JSON files, parses them, stores the data inside an SQL server and displays the results to the user, along with charts when appropriate. 

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
