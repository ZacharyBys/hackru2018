from flask import Flask, request, Response
from flask_cors import CORS
from users import createUser, getUser
import json

app = Flask(__name__)
CORS(app)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/users', methods=['POST'])
def newUser():
    data = request.get_json();
    firstName = data['firstName']
    lastName = data['lastName']
    gender = data['gender']
    number = data['number']

    code = createUser(firstName, lastName, gender, number)
    if code != -1:
        return json.dumps({'id':code, 'firstName':firstName, 'lastName':lastName, 'gender':gender, 'number':number, 'success':True}), 200, {'ContentType':'application/json'} 
    else:
        return json.dumps({'success':False}), 400, {'ContentType':'application/json'} 

@app.route('/user', methods=['GET'])
def retrieveUser():
    id = request.args.get('id')

    result = getUser(int(id))

    if result == -1:
        return json.dumps({'success':False}), 400, {'ContentType':'application/json'}
    else:
        return json.dumps(result), 200, {'ContentType':'application/json'} 