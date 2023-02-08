let bucketPolicy = require("./bucketPolicy.json")
let adderPolicy = require("./adderPolicy.json")

let bucketName = "sdek";


adderPolicy.Resource = adderPolicy.Resource.replace("<bucket_name>", bucketName);

bucketPolicy.Statement.push(adderPolicy)
console.log(bucketPolicy.Statement)