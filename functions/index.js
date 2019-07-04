const functions = require('firebase-functions');
const admin  = require('firebase-admin');
const CSVToJSON = require('csvtojson');
const JSONToCSV = require('json2csv').parse;
const FileSystem = require('fs');
const serviceAccount = require('./key.json');

admin.initializeApp({
    credential : admin.credential.cert(serviceAccount),
    databaseURL :"https://fir-js-29865.firebaseio.com/"
})

const db = admin.firestore()

exports.getUsers = functions.https.onRequest( (request, response) => {
    db.collection("users").get().then( snapshot => {
        const users = {};
        snapshot.forEach(doc => {
            const key = doc.id;
            const user = doc.data();
            user['key'] = key;
            users[key] = user
        });
    
         
        CSVToJSON().fromFile('./source.csv').then(source => {

            for(const key in users){
                source.push(users[key])
            }
             var csv = JSONToCSV(source, { fields : ["email","username","key"]});
             FileSystem.writeFileSync("./destination.csv", csv);

             response.send(source)
             return null
 
         }).catch(error => {
             response.status(500).send(error)
         })


    }) .catch(reason => {
        response.status(500).send('db.collection("users").get gets err, reason: ' + reason);
    });
})

