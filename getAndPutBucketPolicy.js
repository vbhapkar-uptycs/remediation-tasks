"use strict";
const {
    S3Client,
    PutBucketPolicyCommand,
    GetBucketPolicyCommand,
} = require("@aws-sdk/client-s3");
const {
    sendToUptycsRemediationFeedback,
    ApplicationError,
} = require("../utils");

const adderPolicy = {
    Effect: "Deny",
    Principal: "*",
    Action: "s3:GetObject",
    Resource: "arn:aws:s3:::<bucket_name>/*",
    Condition: {
        Bool: {
            "aws:SecureTransport": "false",
        },
    },
};

/**
 *  Block S3 from Public access
 * @param {object} event
 * @param {object} context
 * @param {object} callback
 * @returns
 */
module.exports.handler = async (event, context, callback) => {
    event = event || {};

    console.log(
        " Block S3 Public Access  - Received event:",
        JSON.stringify(event, null, 2)
    );
    try {
        if (!event.region) {
            throw new ApplicationError("Invalid event, no region provided");
        }
        event.lambdaExecutorRecievedTime = new Date();

        const client = new S3Client({ region: event.region });

        const bucketName = {
            Bucket: event.bucketName,
        };

        // GET BUCKET POLICY
        const getCommand = new GetBucketPolicyCommand(bucketName);
        const policy = await client.send(getCommand);

        if (!policy) {
            throw new ApplicationError("Invalid bucket name or policy not found");
        }
        event.lambdaExecutorRecievedTime = new Date();

        // response will be policy in string format
        policy = JSON.parse(policy);

        //adderPolicy is policy which will get added to the existing bucket
        adderPolicy.Resource = adderPolicy.Resource.replace(
            "<bucket_name>",
            event.bucketName
        );
        policy.Statement.push(adderPolicy);

        policy = JSON.stringify(policy);

        // PUT BUCKET POLICY
        const putCommand = new PutBucketPolicyCommand(policy);
        const putResponse = await client.send(putCommand);
        event.response = putResponse;

        console.log(putResponse);
    } catch (err) {
        event.error = err;
        console.error("Error : ", err.message);
    } finally {
        event.lambdaFeedbackDispachedTime = new Date();
        await sendToUptycsRemediationFeedback(event);
    }
};
