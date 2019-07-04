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


function json2array(json){
    var result = [];
    var keys = Object.keys(json);
    keys.forEach(function(key){
        result.push(json[key]);
    });
    return result;
}


exports.addMessage = functions.https.onRequest((request, response) => {
    const username = request.query.username
    const email =request.query.email
 

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
    const ref = admin.database().ref().child('users')
    ref.on("value", function(snapshot){
        const data = snapshot.val()
        const users = [];
      
        
        CSVToJSON().fromFile('./source.csv').then(source => {

            for(const key in data){
                const newObject = Object.assign({}, data[key], {idUser:key});
                source.push(newObject)
            }
             var csv = JSONToCSV(source, { fields : ["email","username","idUser"]});
             FileSystem.writeFileSync("./destination.csv", csv);

             response.send(source)
             return null
 
         }).catch(error => {
             response.status(500).send(error)
         })
        
      
    })

 
})




 /**
           const messages = snapshot.val()
        const keys = Object.keys(messages)

        response.json(keys) --

        for( i = 0 ; i<= keys.length; i++){
            const k = keys[i];
            const message = messages[k].message
            response.send(message)
        }
        //this line convert data to csv
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

     CSVToJSON().fromFile('./source.csv').then(source => {
            
            for(const key in data){
                source.push(data[key])
            }
             var csv = JSONToCSV(source, { fields: ["email","username"]});
             FileSystem.writeFileSync("./destination.csv", csv);

             response.send(source)
             return null
 
         }).catch(error => {
             response.status(500).send(error)
         })

           CSVToJSON().fromFile('./source.csv').then(source => {
            for(const key in data){
                source.push(data[key])
            }
             var csv = JSONToCSV(source, { fields : ["email","username"]});
             FileSystem.writeFileSync("./destination.csv", csv);

             response.send(source)
             return null
 
         }).catch(error => {
             response.status(500).send(error)
         })

           
        for(const key in data){
           const newObject = Object.assign({}, data[key], {id:key});
           users.push(newObject)
           for(const key in users){
                user.push(users[key])
           }
        }

         */
