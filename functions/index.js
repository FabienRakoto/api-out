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



exports.addMessage = functions.https.onRequest((request, response) => {
    const username = request.query.username
    const email =request.query.email
    //const secretText = toUpperCase(text)

    admin
        .database()
        .ref('/users')
        .push({username : username, email : email})
        .then(() => 
            response.json({
                message : 'Successfully',
                username,
                email
            }))
            .catch(() => {
                response.json({
                    message :'somethings went wrong'
                })
            })
})

exports.getMessage = functions.https.onRequest((request, response) => {
    const ref = admin.database().ref();

    ref.on("value", function(snapshot){
        
        const data = snapshot.val()
        CSVToJSON().fromFile('./Book1.csv').then(source => {
          
           // var csv = JSONToCSV(source, { fields: ["sku", "title", "hardware", "price" ]});
           // FileSystem.writeFileSync("./destination.csv", csv);

            response.send(data)
            return null

        }).catch(error => {
            response.status(500).send(error)
        })

    }, function (error) {
        console.log("Error: " + error.code);
    })
})

 /**
           const messages = snapshot.val()
        const keys = Object.keys(messages)

        response.json(keys)

        for( i = 0 ; i<= keys.length; i++){
            const k = keys[i];
            const message = messages[k].message
            response.send(message)
        }

         */
