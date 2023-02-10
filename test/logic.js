let bucketPolicy = require("./bucketPolicy.json")

const adderPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Effect: "Deny",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::<bucket_name>/*",
            Condition: {
                Bool: {
                    "aws:SecureTransport": "false",
                },
            },
        }
    ]
}

let bucketName = "sdek";


adderPolicy.Statement[0].Resource = adderPolicy.Statement[0].Resource.replace("<bucket_name>", bucketName);

bucketPolicy.Statement.push(adderPolicy.Statement[0])
console.log(bucketPolicy.Statement)