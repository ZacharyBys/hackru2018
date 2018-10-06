from google.cloud import datastore
import random

client = datastore.Client()

def createUser(firstName, lastName, gender, number):

    key = client.key('Users', random.randint(1, 99999999))
    entity = datastore.Entity(key=key)
    entity.update({
        'firstName':firstName,
        'lastName':lastName,
        'gender':gender,
        'number':number,
    })
    client.put(entity)
    result = client.get(key)

    return 'User Created'