const functions = require('firebase-functions');
const admin  = require('firebase-admin');
const CSVToJSON = require('csvtojson');
const JSONToCSV = require('json2csv').parse;
const FileSystem = require('fs');
const serviceAccount = require('./key.json');
const PromiseFtp = require('promise-ftp');
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

             const csv = JSONToCSV(source, { fields : ["email","username","key"]});
            
             FileSystem.writeFileSync("./destination.csv",   csv, {mode : parseInt(777, 8)});
             response.send(source)
             return null

         }).catch(error => {
            console.log(error)
            response.send(error)
         })

         return null

    }) .catch(reason => {
        response.status(500).send('db.collection("users").get gets err, reason: ' + reason);
    });
})

exports.addUser = functions.https.onRequest((request, response) => {
    CSVToJSON().fromFile('./add.csv').then(source => {

        for(const key in source){
            db
            .collection("users")
            .add(source[key])
            .then(ref => {
              return response.status(200).send(ref.id)
            }).catch(error => {
                response.status(500).send("somethings went wrongs", error)
            })
        }
        
         return null
         
     }).catch(error => {
         response.status(500).send(error)
     })

})

exports.verifyUser = functions.https.onRequest((request, response) => {
    db.collection("users").get().then( snapshot => {
        snapshot.forEach(doc => {
            const key = doc.id;
            db.collection("users").doc(""+doc.id+"").get()
            .then(snap => {

                CSVToJSON().fromFile('./add.csv').then(source => {
                    for(const key in source){
                        if(JSON.stringify(source[key])==JSON.stringify(snap.data())){
                           console.log("mitovy")
                        }else{
                            console.log(snap.data(), "\n", source[key])
                            console.log("tsy mitovy")
                        }
                    }

                })
            }).catch(error => {
                response.status(500).send(error)
            })
        }) 
        return null
    }).catch(error => {
        response.status(500).send(error)
    })
})

exports.configFtp = functions.https.onRequest((request, response) => {
    var ftp = new PromiseFtp();
    ftp.connect({host: "198.50.210.81", user: "iziweb", password: "izi2014z"})
    .then(function (serverMessage) {
        response.send(serverMessage)
        return ftp.put('./destination.csv', '/kaylandko');
      }).then(function () {
        return ftp.end();
      });
})

