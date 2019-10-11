const functions = require('firebase-functions');
const admin  = require('firebase-admin');
const CSVToJSON = require('csvtojson');
const JSONToCSV = require('json2csv').parse;
const FileSystem = require('fs');
const serviceAccount = require('./key.json');
const FtpDeploy = require('ftp-deploy')
const _ = require('lodash');
const PromiseFtp = require('promise-ftp');
admin.initializeApp({
    credential : admin.credential.cert(serviceAccount),
    databaseURL :"https://fir-js-29865.firebaseio.com/"
})


const config  = {
    user: "iziweb",                   // NOTE that this was username in 1.x 
    password: "izi2014z",           // optional, prompted if none given
    host: "198.50.210.81",
    port: 21,
    localRoot: __dirname + '/upload',
    remoteRoot: '/csv-out/',
    include: ['*.csv', 'upload/*'], // include: ['*', '**/*'],      // this would upload everything except dot files
    exclude: ['dist/**/*.map'],     // e.g. exclude sourcemaps - ** exclude: [] if nothing to exclude ** // delete ALL existing files at destination before uploading, if true
    deleteRemote: false,              
    forcePasv: true
   }

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
            
             FileSystem.writeFileSync("./upload/destination.csv", csv);
             const ftpDeploy = new FtpDeploy();
             ftpDeploy.deploy(config)
              .then(res => console.log('finished:', res))
              .catch(err => console.log(err))
            // response.send(source)
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
    //GET FILE ON THE FTP
    
    const ftp = new PromiseFtp();
    ftp.connect({host:"198.50.210.81", user:"iziweb", password:"izi2014z"})
        .then(serverMessage => {
            return ftp.get("./csv-out/upload/down.csv")
        }).then(stream => {
            return new Promise ((resolve, reject) =>{
                stream.once('close', resolve)
                stream.once('error', reject)
                stream.pipe(FileSystem.createWriteStream("./download/down.csv"));
            });
        }).then(function(){
            return ftp.end()
        })

    //COMPARE DATA ON CSV WITH FIREBASE
    


})

// db.collection("users").get().then( snapshot => {
//     snapshot.forEach(doc => {
//         const keys = doc.id;
//         db.collection("users").doc(""+keys+"").get()
//         .then(snap => {

//             CSVToJSON().fromFile('./add.csv').then(source => {
//                 for(const key in source){
//                     if(_.isEqual(source[key], snap.data())){
//                        console.log("mitovy")
//                     }else{
//                         console.log(snap.data(), "\n", source[key])
//                         console.log("tsy mitovy")
//                     }
//                 }

//             })
//         }).catch(error => {
//             response.status(500).send(error)
//         })
//     }) 
//     return null
// }).catch(error => {
//     response.status(500).send(error)
// })