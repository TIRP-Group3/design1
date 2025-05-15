# malware-detection
Figmaa Prototype Link:
  https://www.figma.com/proto/SRZY76Kwet2d4E16eG1mEq/Prototype-1-Final?node-id=1-819&t=PGOCm9seKsSR9gtM-1

How to run the application. import the anacondapk.yml into your anaconda environment.
Lets say you name your env "malware"
After imported cd into Backend folder and run "conda activate malware"
Make sure you have mysql running and have a database name "dbmalware"
run "python reset_db.py" to initialize all the database
run "uvicorn main:app --reload" to run your backend/api

Next, start your frontend. Cd to Frontend folder
Run "npm install" to install all the packages
Run "npm run dev" to run the frontend
Sth like  " http://localhost:5173/" open that link to start the application