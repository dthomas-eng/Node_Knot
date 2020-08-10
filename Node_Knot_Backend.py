'''This is the server-side source code for Node Knot.
Simple interactions with a database storing puzzles and scores information. 
Note - if you would like to implement this yourself, you'll need to create your own database
and fill in the <YOUR X HERE> tags with real values.
'''

from flask import Flask
from flask import request
app = Flask(__name__)

#Pulls a random puzzle out of the database and sends it to the client. 
@app.route("/getPuzzle", methods=['GET', 'POST'])
def getPuzzle():

    import random
    import MySQLdb

	#Connect to the database.
    db = MySQLdb.connect(host="<YOUR HOST HERE>",  
                         user="<YOUR USER NAME HERE>",       
                         passwd="<YOUR PASSWORD HERE>",     
                         db="<YOUR DATABASE$NAME HERE>") 

    #Create a Cursor object to execute queries.
    cur = db.cursor()

    #Create an SQL command to find the maximum puzzle id (primary key).
    SQLstring = "SELECT MAX(puzzle_id) FROM puzzles;"
	
	#Execute the command. 
    cur.execute(SQLstring)

	#Get the returned value. 
    for row in cur.fetchall():
        max_id = row[0]

	#Find a random number between 3 and the maximum puzzle_id found in the database. 
    id = random.randint(3,max_id)
	
	#Create and SQL command to get the corresponding puzzle data from the database. 
    SQLstring = "SELECT * FROM puzzles WHERE puzzle_id=" + str(id)

	#Execute the command. 
    cur.execute(SQLstring)

	#Get the data from the cursor. 
    for row in cur.fetchall() :
        initials = row[1]
        lines = row[2]
        scores = row[3]

	#Do some parsing to prepare for send to client. 
    scores = scores.replace(',','-,-')
    scores = scores.replace('[','')
    scores = scores.replace(']','')
    scores = scores.replace('\'','')
    scores = scores.replace(' ', '')

    lines = '['+ lines + ']'

	#Send the line data to the client. 
    return str(id) + '-,-' + initials + '-,-' + lines + '-,-' + scores
	
	
#Saves a newly created puzzle to the database.
@app.route("/addPuzzle", methods=['GET', 'POST'])
def addPuzzle():

    import MySQLdb
	
	#Takes the data as a string
    if request.method == 'POST':
        data = request.data
        data = str(data)

		#Parses the data in preperation for storage. 
        data = data[4:]
        split_data = list(data.split(',['))
        initials = split_data[0]
        split_data_str = str(split_data[1])
        split_data_2 = list(split_data_str.split("],"))
        lines = split_data_2[0]
        scores = list(split_data_2[1].split(','))
        scores[-1] = '---'

	#Connect to the database
    db = MySQLdb.connect(host="<YOUR HOST HERE>",  
                         user="<YOUR USER NAME HERE>",       
                         passwd="<YOUR PASSWORD HERE>",     
                         db="<YOUR DATABASE$NAME HERE>")

    #Create a Cursor object to execute queries.
    cur = db.cursor()

	#Create SLQ command string to commit the data to the database. 
    SQLstring = "INSERT INTO puzzles VALUES(\'\',\'" + initials + "\',\'" + str(lines) + "\',\"" + str(scores) +"\");"
	
	#Execute and commit the commant. 
    cur.execute(SQLstring)
    db.commit()

	#Returns the SQL command for diagnostics only. 
    return str(SQLstring) 

#Returns the scores data for any puzzle passed in. 
@app.route("/getScores", methods=['GET', 'POST'])
def getScores():

    import MySQLdb
	
	#Get the data as a string and parse. 
    if request.method == 'POST':
        data = request.data
        data = str(data)
        data = data[2:-1]

	#Conncect to database.
    db = MySQLdb.connect(host="<YOUR HOST HERE>",  
                         user="<YOUR USER NAME HERE>",       
                         passwd="<YOUR PASSWORD HERE>",     
                         db="<YOUR DATABASE$NAME HERE>")

    # Create a Cursor object to execute queries.
    cur = db.cursor()
	
	#Create an SQL command to get the puzzle data for the puzzle_id "data".
    SQLstring = "SELECT * FROM puzzles WHERE puzzle_id=" + str(data) + ";"

	#Execute the command.
    cur.execute(SQLstring)

	#Get the rows of data out and store as strings. 
    for row in cur.fetchall():
        initials = row[1]
        lines = row[2]
        scores = row[3]

	#Parse the scores string 
    scores = scores.replace(',','-,-')
    scores = scores.replace('[','')
    scores = scores.replace(']','')
    scores = scores.replace('\'','')
    scores = scores.replace(' ', '')

    lines = '['+ lines + ']'

	#Send the data to the client. 
    return data + '-,-' + initials + '-,-' + lines + '-,-' + scores


#Updates the score for any puzzle passed in. 
@app.route("/updateScores", methods=['GET', 'POST'])
def updateScores():

    import MySQLdb
	
	#Get the data as a string and parse it. 
    if request.method == 'POST':
        data = request.data
        data = str(data)
        data = data[2:-1]
        split_data = list(data.split(','))
        id = split_data[0]
        del split_data[0]
        data = ', '.join(split_data)

	#Connect to database. 
    db = MySQLdb.connect(host="<YOUR HOST HERE>",  
                         user="<YOUR USER NAME HERE>",       
                         passwd="<YOUR PASSWORD HERE>",     
                         db="<YOUR DATABASE$NAME HERE>")

    #Create a cursor object to execute queries.
    cur = db.cursor()

	#Create an SQL command that updates the scores data for the puzzle with puzzle_id = id. 
    SQLstring = "UPDATE puzzles SET scores='"+data+ "' WHERE puzzle_id=" + id + ";"
	
	#Execute the command and commit the change. 
    cur.execute(SQLstring)
    db.commit()

	#Return the SQL command string for diagonostic purposes only. 
    return str(SQLstring)
